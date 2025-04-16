import React from "react";
import {Button, Col, Divider, Row} from "antd";
import axios from "axios";
import {
	FileAddOutlined, FolderOpenOutlined,
	GroupOutlined,
	PrinterOutlined,
	ScanOutlined,
	SignatureOutlined,
	UploadOutlined
} from "@ant-design/icons";

import {API_URLS} from "../../api/api.ts";
import FileTypeConverter from "./fileTypeConverter.tsx";
import {CurrentFileNew, FileItemNew} from "../../types/entityTypesNew.ts";
import ScannerControl from "../sacnnerControl/scannerControl.tsx";
import SubHeader from "./subHeader.tsx";

interface ComponentHeaderInterface {
	// 导入文件按钮
	setSelectedPaths: (paths: FileItemNew[] | []) => void;
	resetIsBatchOperation:( isBatchOperation: boolean) => void;
	setDirHandle: (dirHandle: string) => void;
	dirHandle?: string | null;
	setInternalFileTree: (fileTree: FileItemNew[]) => void;

	currentFile?: CurrentFileNew;
	setCurrentFile: (currentFile: CurrentFileNew) => void;

	// 画框识别
	isOcrEnabled: boolean;
	setIsOcrEnabled: ( isOcrEnabled: boolean) => void;

	// 全文识别
	setFullText: (text: string) => void;
	setIsFullOcrEnabled:( isFullOcrEnabled: boolean) => void;
	isFullOcrEnabled: boolean;

	// 模版模式
	isTemplateEnabled: boolean;
	setIsTemplateEnabled: ( isOcrEnabled: boolean) => void;

	// 批量操作
	isBatchOperation: boolean;

	setTemplateOcrLoading: (isTemplateOcrLoading: boolean) => void;
	templateOcrLoading: boolean;
	fullOcrLoading:boolean;
	setFullOcrLoading: (isFullOcrLoading: boolean) => void;

	customOcrLoading: boolean,
	setCustomOcrLoading: (customOcrLoading: boolean) => void;
	setIsCustomOcrEnable: (isCustomOcrEnable: boolean) => void;
	isCustomOcrEnable: boolean,


}

const ComponentHeader: React.FC<ComponentHeaderInterface> =
	({
		 setSelectedPaths,
		 setDirHandle,
		 setInternalFileTree,

		 setIsOcrEnabled,
		 isOcrEnabled,
		 setIsTemplateEnabled,
		 isTemplateEnabled,
		 currentFile,
		 setCurrentFile,
		 setFullText,
		 setIsFullOcrEnabled,
		 isFullOcrEnabled,

		 fullOcrLoading,
		 setFullOcrLoading,
		 templateOcrLoading,
		 // setTemplateOcrLoading,
		 setIsCustomOcrEnable,
		 isCustomOcrEnable,
	}) => {

	const [fileTypeConvertModal, setFileTypeConvertModal] = React.useState<boolean>(false);
	const [scannerControlModal, setScannerControlModal] = React.useState<boolean>(false);
	const [currentHeaderButton, setCurrentHeaderButton] = React.useState<string>("");

	// 文件选择，构建文件树赋值给internalFileTree
	const handleFolderSelect = async () => {
		try {
			const result: FileItemNew = await (window as any).electronAPI.selectFolder();
			if (!result) return;
			setDirHandle(result.path);
			setInternalFileTree(result.children?result.children:[]);
			setSelectedPaths([]);
		} catch (error) {
			console.error('Error selecting directory:', error);
		}
	};

	// 全文识别按钮
	const onFullTextOcr = async () => {
		if(!currentFile || (currentFile.data==="") || isFullOcrEnabled) {
			setIsFullOcrEnabled(!isFullOcrEnabled);
			setFullText("");
			return;
		}
		setFullText("");
		setFullOcrLoading(true);
		setIsFullOcrEnabled(true);
		setCurrentHeaderButton("FolderSelect");
		try {

			// 去除 Base64 数据的前缀
			const base64Data = currentFile.data.split(',')[1]
			// 目标 API URL
			const url = API_URLS.IMAGE_BASE64_OCR;
			// 构造请求数据
			const data = {
				base64: base64Data, // Base64 编码的图片数据
				options: {
					"data.format": "text" // 可选参数
				}
			};

			// 发送 POST 请求
			const response = await axios.post(url, data);
			const text = response.data.data;
			setFullText(text)
			setFullOcrLoading(false);
			setIsFullOcrEnabled(false);
			return response.data;
		} catch (error) {
			console.error("Error:", error);
			throw error;
		}

	}


	return (
		<div style={{ maxHeight:"12vh",  background: '#f5f7fa',overflow: "auto" }}>
			<Divider style={{ margin: '1vh 0' }} />
			{/* 第一部分：主要功能工具栏 */}
			<div style={{ maxHeight:"6vh",  background: '#f5f7fa',overflow: "auto" }}>
				<Row>
					<Col span={3} push={1}>
						<Button type="primary" icon={<PrinterOutlined />} size="small"
								onClick={()=>setScannerControlModal(true)}
						>
							扫描仪控制
						</Button>
					</Col>
					<Col span={3} push={1}>
						<Button
							type="primary"
							icon={<UploadOutlined />}
							size="small"
							disabled={isFullOcrEnabled||isOcrEnabled||isTemplateEnabled||isCustomOcrEnable}
							onClick={handleFolderSelect}
						>
							导入文件
						</Button>
					</Col>
					<Col span={3} push={1}>
						<Button
							type="primary"
							icon={<UploadOutlined />}
							size="small"
							disabled={isTemplateEnabled||isOcrEnabled||currentFile?.type!=="image"||isCustomOcrEnable}
							onClick={() => {
								setCurrentHeaderButton("ImageOperation");
							}}
						>
							图像处理
						</Button>
					</Col>
					<Col span={3} push={1}>
						<Button
							type="primary"
							icon={<ScanOutlined />}
							disabled={isTemplateEnabled||isOcrEnabled||currentFile?.type!=="image"||isCustomOcrEnable}
							loading={fullOcrLoading}
							danger={isFullOcrEnabled}
							onClick={onFullTextOcr}
							size="small"
						>
							{isFullOcrEnabled ? "关闭全文识别" : "全文识别"}
						</Button>
					</Col>
					<Col span={3} push={1}>
						<Button
							type="primary"
							size="small"
							icon={<SignatureOutlined />}
							danger={isOcrEnabled}
							disabled={!currentFile || !['pdf' , 'image' , 'ofd'].includes(currentFile!.type)||isCustomOcrEnable}
							onClick={() => {
								setIsOcrEnabled(!isOcrEnabled)
								setCurrentHeaderButton("OcrEnabled");
							}}>
							{isOcrEnabled ? "关闭画框识别" : "画框识别"}
						</Button>
					</Col>
					<Col span={3} push={1}>
						<Button
							type="primary"
							size="small"
							icon={<GroupOutlined />}
							loading={templateOcrLoading}
							disabled={isFullOcrEnabled||isOcrEnabled||currentFile?.type!=="image"||isCustomOcrEnable}
							danger={isTemplateEnabled}
							onClick={() => {
								setIsTemplateEnabled(!isTemplateEnabled)
								setCurrentHeaderButton("TemplateEnabled");
							}}>
							{isTemplateEnabled ? "关闭公文识别" : "公文识别"}
						</Button>
					</Col>
					<Col span={3} push={1}>
							<Button
								type="primary"
								size="small"
								icon={<FileAddOutlined />}
								danger={isCustomOcrEnable}
								disabled={isFullOcrEnabled||isOcrEnabled||currentFile?.type!=="image"||isTemplateEnabled}
								onClick={() => {
									setIsCustomOcrEnable(!isCustomOcrEnable)
									setCurrentHeaderButton("CustomOcrEnable");
								}}
							>
								{isCustomOcrEnable ? "关闭模版定制" : "公文模版定制"}
							</Button>
					</Col>
					<Col span={3} push={1}>
						<Button type="primary" size="small" icon={<FolderOpenOutlined />} onClick={()=>setFileTypeConvertModal(true)}>
							批量转换
						</Button>
					</Col>
				</Row>
			</div>
			{/* 分割线 */}
			<Divider style={{ margin: '1vh 0' }} />

			{/* 第二部分：次要功能 */}
			<div style={{ maxHeight:"4vh",  background: '#f5f7fa',overflow: "auto" }}>
				<SubHeader key={currentFile?.name} currentFile={currentFile} currentHeaderButton={currentHeaderButton} setCurrentFile={setCurrentFile}/>
			</div>

			<FileTypeConverter
				fileTypeConvertModal={fileTypeConvertModal}
				setFileTypeConvertModal={setFileTypeConvertModal}
			/>
			<ScannerControl
				scannerControlModal={scannerControlModal}
				setScannerControlModal={setScannerControlModal}
			/>
		</div>
	);

}
export default ComponentHeader;
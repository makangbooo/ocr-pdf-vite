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
import {CurrentFile, FileItem} from "../entityTypes.ts";
import FileTypeConverter from "./fileTypeConverter.tsx";
import {buildFileTree, getBase64FromBlob} from "../../utils/fileTypeIdentify.tsx";


interface ComponentHeaderInterface {
	// 导入文件按钮
	setSelectedPaths: (paths: FileItem[] | []) => void;
	resetIsBatchOperation:( isBatchOperation: boolean) => void;
	setDirHandle: (fileSystemDirectoryHandle: FileSystemDirectoryHandle) => void;
	dirHandle?: FileSystemDirectoryHandle | null;
	setInternalFileTree: (fileTree: FileItem[]) => void;

	currentFile?: CurrentFile;

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
		 setFullText,
		 setIsFullOcrEnabled,
		 isFullOcrEnabled,

		 fullOcrLoading,
		 setFullOcrLoading,
		 templateOcrLoading,
		 // setTemplateOcrLoading,
	}) => {

	const [fileTypeConvertModal, setFileTypeConvertModal] = React.useState<boolean>(false);

	// 文件选择，构建文件树赋值给internalFileTree
	const handleFolderSelect = async () => {
		try {
			// @ts-expect-error window.showDirectoryPicker() 对旧版本浏览器不支持，且只支持https和localhost
			const dirHandle = await window.showDirectoryPicker();
			setDirHandle(dirHandle);
			const newTree = await buildFileTree(dirHandle);
			setInternalFileTree(newTree);
			// 清空已选择文件
			setSelectedPaths([]);
		} catch (error) {
			console.error('Error syncing directory:', error);
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
		// todo 将imageUrl传入后端，http://1.95.55.32:1224/api/ocr
		try {

			// 将图片转换为 Base64
			const base64Data = await getBase64FromBlob(currentFile);
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
			console.log("转换后",text)
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
				<Row  justify="center" align="middle" style={{ flex: 1 }}>
					<Col span={3}>
						<Button type="primary" icon={<PrinterOutlined />} size="small">
							扫描仪控制
						</Button>
					</Col>
					<Col span={3}>
						<Button
							type="primary"
							icon={<UploadOutlined />}
							size="small"
							disabled={isFullOcrEnabled||isOcrEnabled||isTemplateEnabled}
							// onClick={() => document.getElementById('folderInput')?.click()}
							onClick={handleFolderSelect}
						>
							导入文件
						</Button>
					</Col>
					<Col span={3}>
						<Button
							type="primary"
							icon={<ScanOutlined />}
							disabled={isTemplateEnabled||isOcrEnabled||currentFile?.type!=="image"}
							loading={fullOcrLoading}
							danger={isFullOcrEnabled}
							onClick={onFullTextOcr} size="small"
						>
							{isFullOcrEnabled ? "关闭全文识别" : "全文识别"}
						</Button>
					</Col>
					<Col span={3}>
						<Button
							type="primary"
							size="small"
							icon={<SignatureOutlined />}
							danger={isOcrEnabled}
							// disabled={isTemplateEnabled||isFullOcrEnabled||currentFile.type!=="image"}
							onClick={() => setIsOcrEnabled(!isOcrEnabled)}>
							{isOcrEnabled ? "关闭画框识别" : "画框识别"}
						</Button>
					</Col>
					<Col span={3}>
						<Button
							type="primary"
							size="small"
							icon={<GroupOutlined />}
							loading={templateOcrLoading}
							disabled={isFullOcrEnabled||isOcrEnabled||currentFile?.type!=="image"}
							danger={isTemplateEnabled}
							onClick={() => setIsTemplateEnabled(!isTemplateEnabled)}>
							{isTemplateEnabled ? "关闭公文识别" : "公文识别"}
						</Button>
					</Col>
					<Col span={3}>
							<Button type="primary" size="small" icon={<FileAddOutlined />}>公文模版定制</Button>
					</Col>
					<Col span={3}>
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
			<Row justify="center" align="middle">
				<Col span={8} offset={1}>
					<Button block type="default" size="small" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)' }}>
						图像处理
					</Button>
				</Col>
				<Col span={5} offset={1}>
					<Button block type="default" size="small" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)' }}>
						识别结果保存
					</Button>
				</Col>
				<Col span={4}  offset={1}>
					<Button block type="default" size="small" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)' }}>
						档案上传
					</Button>
				</Col>
			</Row>
			</div>

			<FileTypeConverter
				fileTypeConvertModal={fileTypeConvertModal}
				setFileTypeConvertModal={setFileTypeConvertModal}
			/>
		</div>
	);

}
export default ComponentHeader;
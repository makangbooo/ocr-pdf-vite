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
import { FileItemNew } from "../../types/entityTypesNew.ts";
import {ComponentHeaderInterface} from "./type.ts";




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
							disabled={!currentFile || !['pdf' , 'image' , 'ofd'].includes(currentFile!.type)}
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
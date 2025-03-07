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


interface FileItem {
	name: string;
	type: 'file' | 'folder';
	path: string;
	children?: FileItem[];
	file?: File;
}
interface CurrentFile {
	name?: string;
	type?: 'folder' | 'pdf' | 'image' | 'ofd' | undefined;
	data: string;
	file?: File;
}

interface ComponentHeaderInterface {
	// 导入文件按钮
	setFileTree: (file: FileItem[]) => void;
	setSelectedPaths: ( paths: Set<string>) => void;
	resetIsBatchOperation:( isBatchOperation: boolean) => void;

	currentFile: CurrentFile;

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
}
// 使用 FileReader 将本地文件转换为 Base64
// 使用 FileReader 将 blob URL 转换为 Base64
const getBase64FromBlob = (currentFile: CurrentFile): Promise<string> => {
	return new Promise(async (resolve, reject) => {
		try {
			// 通过 fetch 获取 Blob
			const response = await fetch(currentFile.data);
			if (!response.ok) {
				throw new Error('Failed to fetch blob from URL');
			}
			const blob = await response.blob();

			const reader = new FileReader();

			reader.onload = () => {
				const base64String = reader.result as string; // 完整的 Data URL
				const base64Only = base64String.split(',')[1]; // 只取 Base64 部分
				resolve(base64Only); // 返回纯 Base64 字符串
			};

			reader.onerror = (error) => {
				reject(error); // 读取失败时返回错误
			};

			reader.readAsDataURL(blob); // 读取 Blob 为 Data URL
		} catch (error) {
			reject(error); // fetch 或其他错误
		}
	});
};
const ComponentHeader: React.FC<ComponentHeaderInterface> =
	({
		 setFileTree,
		 setSelectedPaths,
		 resetIsBatchOperation,
		 isBatchOperation,
		 setIsOcrEnabled,
		 isOcrEnabled,
		 setIsTemplateEnabled,
		 isTemplateEnabled,
		 currentFile,
		 setFullText,
		 setIsFullOcrEnabled,
		 isFullOcrEnabled,
	}) => {

	// 文件选择（）
	const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		if (!files) return;

		const tree: FileItem[] = [];
		const pathMap = new Map<string, FileItem>();

		Array.from(files).forEach(file => {
			const pathParts = file.webkitRelativePath.split('/');
			let currentLevel = tree;

			for (let i = 0; i < pathParts.length; i++) {
				const part = pathParts[i];
				const fullPath = pathParts.slice(0, i + 1).join('/');

				if (i === pathParts.length - 1) {
					const fileItem: FileItem = {
						name: part,
						type: 'file',
						path: fullPath,
						file: file
					};
					currentLevel.push(fileItem);
				} else {
					let folder = pathMap.get(fullPath);
					if (!folder) {
						folder = {
							name: part,
							type: 'folder',
							path: fullPath,
							children: []
						};
						pathMap.set(fullPath, folder);
						currentLevel.push(folder);
					}
					currentLevel = folder.children!;
				}
			}
		});

		setFileTree(tree);
		setSelectedPaths(new Set());
	};

	// 全文识别按钮
	const onFullTextOcr = async () => {
		if(!currentFile || (currentFile.data==="")) return;

		// todo, 加入按钮loading
		setIsFullOcrEnabled(!isFullOcrEnabled);
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
			return response.data;
		} catch (error) {
			console.error("Error:", error);
			throw error;
		}

	}

	// 获取总状态，只允许一个按钮被选中
	const getButtonStatus = () => {
		return !!(isOcrEnabled || isTemplateEnabled || isFullOcrEnabled);

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
					<input
							type="file"
							id="folderInput"
							// @ts-ignore
							webkitdirectory="true"
							directory="true"
							style={{ display: 'none' }}
							onChange={handleFolderSelect}
							multiple
						/>
						<Button
							type="primary"
							icon={<UploadOutlined />}
							size="small"
							disabled={getButtonStatus()}
							onClick={() => document.getElementById('folderInput')?.click()}
						>
							导入文件
						</Button>
					</Col>
					<Col span={3}>
						<Button
							type="primary"
							icon={<ScanOutlined />}
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
							onClick={() => setIsOcrEnabled(!isOcrEnabled)}>
							{isOcrEnabled ? "关闭画框识别" : "画框识别"}
						</Button>
					</Col>
					<Col span={3}>
						<Button
							type="primary"
							size="small"
							icon={<GroupOutlined />}
							danger={isTemplateEnabled}
							onClick={() => setIsTemplateEnabled(!isTemplateEnabled)}>
							{isTemplateEnabled ? "关闭公文识别" : "公文识别"}
						</Button>
					</Col>
					<Col span={3}>
							<Button type="primary" size="small" icon={<FileAddOutlined />}>公文模版定制</Button>
					</Col>
					<Col span={3}>
						<Button type="primary" size="small" icon={<FolderOpenOutlined />} onClick={() => resetIsBatchOperation(!isBatchOperation)}>
							批量处理
						</Button>
					</Col>
				</Row>
			</div>
			{/* 分割线 */}
			<Divider style={{ margin: '1vh 0' }} />

			{/* 第二部分：次要功能 */}
			<div style={{ maxHeight:"4vh",  background: '#f5f7fa',overflow: "auto" }}>
			<Row gutter={[16, 16]} justify="center" align="middle">
				<Col span={12}>
					<Button block type="default" size="small" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)' }}>
						图像处理
					</Button>
				</Col>
				<Col span={6}>
					<Button block type="default" size="small" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)' }}>
						识别结果保存
					</Button>
				</Col>
				<Col span={6}>
					<Button block type="default" size="small" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)' }}>
						档案上传
					</Button>
				</Col>
			</Row>
			</div>
		</div>


	);




}
export default ComponentHeader;
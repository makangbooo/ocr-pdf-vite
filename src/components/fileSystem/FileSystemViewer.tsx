import React, { useEffect } from 'react';
import {Menu, Checkbox, Button, Dropdown} from 'antd';
import {FolderOutlined, FileImageOutlined, SyncOutlined, UnorderedListOutlined} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { getBase64FromBlob, getFileType} from "../../utils/fileTypeIdentify.tsx";
import {CurrentFile, FileItem} from "../entityTypes.ts";
import UploadButton from "../uploadButton.tsx";
import axios from "axios";
import {CurrentFileNew, FileItemNew} from "../entityTypesNew.ts";

interface FileSystemViewerProps {
	setCurrentFile: (url: CurrentFileNew) => void;
	isBatchOperation: boolean;
	selectedPaths: FileItem[] | undefined;
	setSelectedPaths: (paths: FileItem[] | []) => void;

	setDirHandle: (dirHandle: string) => void;
	dirHandle?: string | null; // dirHandle 用于存储文件夹句柄
	internalFileTree: FileItemNew[];
	setInternalFileTree: (fileTree: FileItemNew[]) => void;

	setIsBatchOperation:( isBatchOperation: boolean) => void;
}

type MenuItem = Required<MenuProps>['items'][number];

const FileSystemViewer: React.FC<FileSystemViewerProps> = ({
															   setCurrentFile,
															   isBatchOperation,
															   selectedPaths,
															   setSelectedPaths,
															   setDirHandle,
															   dirHandle,
															   internalFileTree,
															   setInternalFileTree,
															   setIsBatchOperation
														   }) => {


	// todo 初始化或同步文件夹
	const syncDirectory = async () => {
		try {
			let handle = dirHandle; //所导入根文件夹路径

			//
			// const result = await (window as any).electronAPI.selectFolder();
			// if (!result) return; // 用户取消选择
			// console.log("所选择的文件夹",result);
			// setDirHandle(result.folderPath);
			// setInternalFileTree(result.files);
			// setSelectedPaths([]);
		} catch (error) {
			console.error('Error syncing directory:', error);
		}
	};

	// 首次加载时同步（可选）
	useEffect(() => {
		if (internalFileTree.length === 0 && !dirHandle) {
			syncDirectory();
		}
	}, []);

	// 将文件树转换为 Menu 所需的 items 格式
	const getMenuItems = (items: FileItemNew[]): MenuItem[] => {
		return items.map(item => (
			{
				key: item.path,
				icon: item.isDirectory ? <FolderOutlined/> : <FileImageOutlined/>,
				label: (
					<div style={{display: 'flex', alignItems: 'center'}}>
						{isBatchOperation && (
							<Checkbox
								checked={selectedPaths?.some(p => p.name === item.name)}
								onChange={e => handleCheckboxChange(item, item.isDirectory, e.target.checked)}
								onClick={e => e.stopPropagation()}
							/>
						)}
						<span style={{marginLeft: 8}}>{item.name}</span>
					</div>
				),
				children: item.isDirectory? item.children : undefined,
			}));
	};

	// 处理菜单点击事件
	const handleMenuClick: MenuProps['onClick'] = async(e) => {
		// clickedItem： {folderPath:"/Users/makangbo/mine/code/ocr_project/ocr-Test" files:{isDirectory,name,path}
		const clickedItem = findItemByPath(internalFileTree, e.key);
		if (!clickedItem || clickedItem.isDirectory) return;
		const fileType = getFileType(clickedItem.name);
		try {
			// 向主进程请求文件内容（Base64）
			// const response = await ipcRenderer.invoke("read-file", clickedItem.path);
			const response = await (window as any).electronAPI.readFile(clickedItem.path);
			if (response.success) {
				// 将 Base64 转换为 Blob
				const byteCharacters = atob(response.base64.split(",")[1]);
				const byteNumbers = new Array(byteCharacters.length).fill(null).map((_, i) => byteCharacters.charCodeAt(i));
				const byteArray = new Uint8Array(byteNumbers);
				const fileBlob = new Blob([byteArray], { type: response.mimeType });

				// 创建 File 对象
				const file = new File([fileBlob], clickedItem.name, { type: response.mimeType });

				const currentClick = {
					name: clickedItem.name,
					type: fileType,
					path: clickedItem.path,
					file: file, // Base64 数据
					data: response.base64,
				};
				console.log("文件读取成功:", currentClick);
				setCurrentFile(currentClick);
			} else {
				console.error("文件读取失败:", response.error);
			}
		} catch (error) {
			console.error("IPC 调用失败:", error);
		}
	};

	// 获取所有子文件路径
	const getAllChildPaths = (item: FileItemNew): FileItemNew[] => {
		const paths: FileItemNew[] = [];
		if (!item.isDirectory) {
			paths.push(item);
		} else if (item.children) {
			item.children.forEach(child => {
				paths.push(...getAllChildPaths(child));
			});
		}
		return paths;
	};

	// 处理选择框变化
	const handleCheckboxChange = (file: FileItemNew, isFolder: boolean, checked: boolean) => {

		const newSelected = selectedPaths ? [...selectedPaths] : []
		const item = findItemByPath(internalFileTree, file.path);

		if (isFolder && item?.children) {
			const childPaths = getAllChildPaths(item);
			if (checked) {
				childPaths.forEach(() => newSelected.push(item));
			} else {
				childPaths.forEach(p => {
					const index = newSelected.findIndex(selected => selected.name === p.name);
					if (index !== -1) {
						newSelected.splice(index, 1);
					}
				});
			}
		} else {
			if (checked) {
				newSelected.push(file)
			} else {
				const index = newSelected.findIndex(selected => selected.name === file.name);
				if (index !== -1) {
					newSelected.splice(index, 1);
				}
			}
			setSelectedPaths([...newSelected]);
		}
	}
	// 根据文件路径在文件树中遍历查找文件项
	const findItemByPath = (items: FileItemNew[], path: string): FileItemNew | undefined => {
		for (const item of items) {
			if (item.path === path) return item;
			if (item.children) {
				const found = findItemByPath(item.children, path);
				if (found) return found;
			}
		}
		return undefined;
	};


	// 转化为双层pdf
	const convert2pdf = async (): Promise<void> => {
		// 1. 输入验证
		if (!selectedPaths?.length) {
			console.error('No file selected.');
			return;
		}

		try {
			// 2. 使用Promise.all并提取转换逻辑
			const convertFileToBase64 = async (file: FileItem): Promise<{ name: string; file: string }> => {

				const currentFile: CurrentFile = {
					name: file.name,
					// @ts-expect-error 此时的file为文件而非文件夹，因此file不为空
					data: URL.createObjectURL(file.file),
					path: file.path,
					// @ts-expect-error 此时的file为文件而非文件夹，因此file不为空
					file: file.file,
				};

				const base64Data = await getBase64FromBlob(currentFile);
				return {
					name: currentFile.name,
					file: base64Data,
				};
			};

			// 3. 并行处理文件转换
			const requestData = await Promise.all(
				selectedPaths.map((file) => {
					console.log('Processing file:', file);
					return convertFileToBase64(file);
				})
			);

			// 4. 发送请求
			const response = await axios.post(
				`${process.env.VITE_API_BASE_URL}/FileTypeConvert/imageToPDF`,
				requestData
			);

			console.log('Conversion successful:', response.data);
			const downloadUrl = `${process.env.VITE_API_BASE_URL}/${response.data.name}`
			// 根据链接下载文件
			// handleDownload(downloadUrl, response.data.name);
			window.open(downloadUrl, "_blank");


			return response.data; // 根据需要返回数据
		} catch (error) {
			console.error('PDF conversion failed:', error);
			throw error; // 或根据需求处理错误
		}
	};

	// 转化为双层ofd
	const convert2ofd = async (): Promise<void> => {
		// 1. 输入验证
		if (!selectedPaths?.length) {
			console.error('No file selected.');
			return;
		}

		try {
			// 2. 使用Promise.all并提取转换逻辑
			const convertFileToBase64 = async (file: FileItem): Promise<{ name: string; file: string }> => {
				const currentFile: CurrentFile = {
					name: file.name,
					// @ts-expect-error 此时的file为文件而非文件夹，因此file不为空
					data: URL.createObjectURL(file.file),
					path: file.path,
					// @ts-expect-error 此时的file为文件而非文件夹，因此file不为空
					file: file.file,
				};

				const base64Data = await getBase64FromBlob(currentFile);
				return {
					name: currentFile.name,
					file: base64Data,
				};
			};

			// 3. 并行处理文件转换
			const requestData = await Promise.all(
				selectedPaths.map((file) => {
					console.log('Processing file:', file);
					return convertFileToBase64(file);
				})
			);

			// 4. 发送请求
			const response = await axios.post(
				`${process.env.VITE_API_BASE_URL}/FileTypeConvert/imageToOFD`,
				requestData
			);
			const downloadUrl = `${process.env.VITE_API_BASE_URL}/${response.data.name}`
			// 根据链接下载文件
			// handleDownload(downloadUrl, response.data.name);
			window.open(downloadUrl, "_blank");
			console.log('Conversion successful:', response.data);
			return response.data; // 根据需要返回数据
		} catch (error) {
			console.error('PDF conversion failed:', error);
			throw error; // 或根据需求处理错误
		}
	};

	const items: MenuProps['items'] = [
		{
			key: '1',
			label: (
				<UploadButton
					name={'导出为双层ofd'}
					buttonType={''}
					onClick={convert2ofd}
					disabled={(selectedPaths === undefined || selectedPaths.length <= 0)}
				/>
			),
		},
		{
			key: '2',
			label: (
				<UploadButton
					name={'导出为双层pdf'}
					buttonType={''}
					onClick={convert2pdf}
					disabled={(selectedPaths === undefined || selectedPaths.length <= 0)}
				/>
			),
		},
	];

	return (
		<>
			{internalFileTree.length > 0 ? (
				<>
					<Button icon={<SyncOutlined/>} onClick={syncDirectory} style={{marginBottom: 16}}>
						同步文件夹
					</Button>
					&nbsp;
					<Button icon={<UnorderedListOutlined />} type={"primary"}
							onClick={
								()=>{
									setIsBatchOperation(!isBatchOperation)
									setSelectedPaths([])
								}
							}
							style={{marginBottom: 16}}>
						图片批量选择
					</Button>
					<Menu
						mode="inline"
						items={getMenuItems(internalFileTree)}
						onClick={handleMenuClick}
						style={{height: 'calc(100% - 200px)', overflow: 'auto'}}
						defaultOpenKeys={internalFileTree.map(item => item.path)}
					/>

					<Dropdown
						menu={{items}}
					 	placement="top" arrow={{ pointAtCenter: true }}>
						<Button
							type="primary"
							size="large"
							block
							disabled={(selectedPaths === undefined || selectedPaths.length <= 0)}
						>
							导出文件
						</Button>
					</Dropdown>
				</>
			) : (
				<p>请点击“导入文件”或“扫描仪控制”以加载文件夹内容。</p>
			)}

		</>
	);
	};
export default FileSystemViewer;
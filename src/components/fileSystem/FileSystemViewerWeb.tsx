import React, { useEffect } from 'react';
import {Menu, Checkbox, Button, Dropdown} from 'antd';
import {FolderOutlined, FileImageOutlined, SyncOutlined, UnorderedListOutlined} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import {findItemByPath, getFileType} from "../../utils/fileTypeIdentify.tsx";
import {CurrentFile, FileItem} from "../../types/entityTypes.ts";
import UploadButton from "../uploadButton.tsx";
import axios from "axios";


interface FileSystemViewerProps {
	setCurrentFile: (url: CurrentFile) => void;
	isBatchOperation: boolean;
	selectedPaths: FileItem[] | undefined;
	setSelectedPaths: (paths: FileItem[] | []) => void;

	setDirHandle: (fileSystemDirectoryHandle: FileSystemDirectoryHandle) => void;
	dirHandle?: FileSystemDirectoryHandle | null; // dirHandle 用于存储文件夹句柄
	internalFileTree: FileItem[];
	setInternalFileTree: (fileTree: FileItem[]) => void;

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


	// 初始化或同步文件夹
	const syncDirectory = async () => {
		try {
			let handle = dirHandle;
			if (!handle) {
				// 首次加载时选择文件夹
				// @ts-expect-error 可能不存在
				handle = await window.showDirectoryPicker();
				// @ts-expect-error 可能不存在
				setDirHandle(handle);
			}
			// @ts-expect-error 可能不存在
			const newTree = await buildFileTree(handle);
			setInternalFileTree(newTree);
			// setSelectedPaths(new Set()); // 可选：清空已选择路径
			setSelectedPaths([]);
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
	const getMenuItems = (items: FileItem[]): MenuItem[] => {
		return items.map(item => (
			{
				key: item.path,
				icon: item.type === 'folder' ? <FolderOutlined/> : <FileImageOutlined/>,
				label: (
					<div style={{display: 'flex', alignItems: 'center'}}>
						{isBatchOperation && (
							<Checkbox
								checked={selectedPaths?.some(p => p.name === item.name)}
								onChange={e => handleCheckboxChange(item, item.type === 'folder', e.target.checked)}
								onClick={e => e.stopPropagation()}
							/>
						)}
						<span style={{marginLeft: 8}}>{item.name}</span>
					</div>
				),
				children: item.children ? getMenuItems(item.children) : undefined,
			}));
	};

	// 处理菜单点击事件
	const handleMenuClick: MenuProps['onClick'] = (e) => {
		const clickedItem = findItemByPath(internalFileTree, e.key);
		if (clickedItem?.type === 'file' && clickedItem.file) {
			const fileType = getFileType(clickedItem.name);
			const currentClick = {
				name: clickedItem.name,
				type: fileType,
				file: clickedItem.file,
				data: URL.createObjectURL(clickedItem.file),
			};
			// 唯一定义currentFile
			setCurrentFile(currentClick);
		}
	};

	// 获取所有子文件路径
	const getAllChildPaths = (item: FileItem): FileItem[] => {
		const paths: FileItem[] = [];
		if (item.type === 'file') {
			paths.push(item);
		} else if (item.children) {
			item.children.forEach(child => {
				paths.push(...getAllChildPaths(child));
			});
		}
		return paths;
	};

	// 处理选择框变化
	const handleCheckboxChange = (file: FileItem, isFolder: boolean, checked: boolean) => {

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

				const base64Data = currentFile.data.split(',')[1]
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

				const base64Data = currentFile.data.split(',')[1]
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
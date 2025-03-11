// components/FileSystemViewer.tsx
import React, { useEffect } from 'react';
import { Menu, Checkbox, Button } from 'antd';
import {FolderOutlined, FileImageOutlined, SyncOutlined} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { getFileType } from "../../utils/fileTypeIdentify.tsx";
import { CurrentFile } from "../entityTypes.ts";
import UploadButton from "../uploadButton.tsx";
import axios from "axios";

interface FileItem {
	name: string;
	type: 'file' | 'folder';
	path: string;
	children?: FileItem[];
	file?: File;
}

interface FileSystemViewerProps {
	setCurrentFile: (url: CurrentFile) => void;
	isBatchOperation: boolean;
	selectedPaths: {name: string, data: File}[] | undefined;
	setSelectedPaths: (paths: {name: string, data: File}[] | []) => void;

	setDirHandle: (fileSystemDirectoryHandle: FileSystemDirectoryHandle) => void;
	dirHandle: FileSystemDirectoryHandle | null;
	internalFileTree: FileItem[];
	setInternalFileTree: (fileTree: FileItem[]) => void;
}

type MenuItem = Required<MenuProps>['items'][number];

// 使用 FileReader 将 blob URL 转换为 Base64
const getBase64FromBlob = (currentFile: CurrentFile): Promise<string> => {
	// eslint-disable-next-line no-async-promise-executor
	return new Promise( async (resolve, reject) => {
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
				console.log('Data URL:', base64String);
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

const FileSystemViewer: React.FC<FileSystemViewerProps> = ({
															   setCurrentFile,
															   isBatchOperation,
															   selectedPaths,
															   setSelectedPaths,
															   setDirHandle,
															   dirHandle,
															   internalFileTree,
															   setInternalFileTree,
														   }) => {
	// dirHandle 用于存储文件夹句柄

	// 读取文件夹并构建文件树
	const buildFileTree = async (handle: FileSystemDirectoryHandle, path: string = ''): Promise<FileItem[]> => {
		const items: FileItem[] = [];
		// @ts-expect-error 可能不存在
		for await (const [name, entry] of handle.entries()) {
			const itemPath = `${path}/${name}`;
			if (entry.kind === 'file') {
				const file = await (entry as FileSystemFileHandle).getFile();
				items.push({name, type: 'file', path: itemPath, file});
			} else if (entry.kind === 'directory') {
				const children = await buildFileTree(entry as FileSystemDirectoryHandle, itemPath);
				items.push({name, type: 'folder', path: itemPath, children});
			}
		}
		return items;
	};

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
				data: URL.createObjectURL(clickedItem.file),
				file: clickedItem.file,
			};
			setCurrentFile(currentClick);
		}
	};

	// 根据路径查找文件项
	const findItemByPath = (items: FileItem[], path: string): FileItem | undefined => {
		for (const item of items) {
			if (item.path === path) return item;
			if (item.children) {
				const found = findItemByPath(item.children, path);
				if (found) return found;
			}
		}
		return undefined;
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


		console.log("handleCheckboxChange.file", file)
		const newSelected = selectedPaths ? [...selectedPaths] : []
		const item = findItemByPath(internalFileTree, file.path);

		if (isFolder && item?.children) {
			const childPaths = getAllChildPaths(item);
			if (checked) {
				childPaths.forEach(p => newSelected.push({name: p.name, data: p.file}));
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
				newSelected.push({name: file.name, data: file.file})
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
			const convertFileToBase64 = async (file: {name: string, data: File}): Promise<{ name: string; file: string }> => {
				const currentFile: CurrentFile = {
					name: file.name,
					data: URL.createObjectURL(file.data),
					file: file.data,
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
			return response.data; // 根据需要返回数据
		} catch (error) {
			console.error('PDF conversion failed:', error);
			throw error; // 或根据需求处理错误
		}
	};

	return (
		<>
			{internalFileTree.length > 0 ? (
				<>
					<Button icon={<SyncOutlined/>} onClick={syncDirectory} style={{marginBottom: 16}}>
						同步文件夹
					</Button>
					<Menu
						mode="inline"
						items={getMenuItems(internalFileTree)}
						onClick={handleMenuClick}
						style={{height: 'calc(100% - 120px)', overflow: 'auto'}}
						defaultOpenKeys={internalFileTree.map(item => item.path)}
					/>
					<UploadButton
						name={'转化为双层pdf'}
						buttonType={''}
						onClick={convert2pdf}
						disabled={(selectedPaths === undefined || selectedPaths.length <= 0)}
					/>
				</>
			) : (
				<p>请点击“导入文件”或“扫描仪控制”以加载文件夹内容。</p>
			)}

		</>
	);
	};
export default FileSystemViewer;
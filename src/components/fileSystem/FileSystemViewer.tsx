// components/FileSystemViewer.tsx
import React, { useEffect } from 'react';
import { Menu, Checkbox, Button } from 'antd';
import { FolderOutlined, FileImageOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { getFileType } from "../../utils/fileTypeIdentify.tsx";
import { CurrentFile } from "../entityTypes.ts";

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
	selectedPaths: Set<string>;
	setSelectedPaths: (paths: Set<string>) => void;

	setDirHandle: (fileSystemDirectoryHandle: FileSystemDirectoryHandle) => void;
	dirHandle: FileSystemDirectoryHandle | null;
	internalFileTree: FileItem[];
	setInternalFileTree: (fileTree: FileItem[]) => void;
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
				items.push({ name, type: 'file', path: itemPath, file });
			} else if (entry.kind === 'directory') {
				const children = await buildFileTree(entry as FileSystemDirectoryHandle, itemPath);
				items.push({ name, type: 'folder', path: itemPath, children });
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
				handle = await window.showDirectoryPicker();
				// @ts-expect-error 可能不存在
				setDirHandle(handle);
			}
			// @ts-expect-error 可能不存在
			const newTree = await buildFileTree(handle);
			setInternalFileTree(newTree);
			setSelectedPaths(new Set()); // 可选：清空已选择路径
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
		return items.map(item => ({
			key: item.path,
			icon: item.type === 'folder' ? <FolderOutlined /> : <FileImageOutlined />,
			label: (
				<div style={{ display: 'flex', alignItems: 'center' }}>
					{isBatchOperation && (
						<Checkbox
							checked={selectedPaths.has(item.path)}
							onChange={e => handleCheckboxChange(item.path, item.type === 'folder', e.target.checked)}
							onClick={e => e.stopPropagation()}
						/>
					)}
					<span style={{ marginLeft: 8 }}>{item.name}</span>
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
	const getAllChildPaths = (item: FileItem): string[] => {
		const paths: string[] = [];
		if (item.type === 'file') {
			paths.push(item.path);
		} else if (item.children) {
			item.children.forEach(child => {
				paths.push(...getAllChildPaths(child));
			});
		}
		return paths;
	};

	// 处理选择框变化
	const handleCheckboxChange = (path: string, isFolder: boolean, checked: boolean) => {
		const newSelected = new Set(selectedPaths);
		const item = findItemByPath(internalFileTree, path);

		if (isFolder && item?.children) {
			const childPaths = getAllChildPaths(item);
			if (checked) {
				childPaths.forEach(p => newSelected.add(p));
			} else {
				childPaths.forEach(p => newSelected.delete(p));
			}
		} else {
			if (checked) {
				newSelected.add(path);
			} else {
				newSelected.delete(path);
			}
		}
		setSelectedPaths(newSelected);
	};

	return (
		<>
			{internalFileTree.length > 0 ? (
				<>
					<Button onClick={syncDirectory} style={{ marginBottom: 16 }}>
						同步文件夹
					</Button>
					<Menu
						mode="inline"
						items={getMenuItems(internalFileTree)}
						onClick={handleMenuClick}
						style={{ height: 'calc(100% - 120px)', overflow: 'auto' }}
						defaultOpenKeys={internalFileTree.map(item => item.path)}
					/>
				</>
			) : (
				<p>请点击“导入文件”或“扫描仪控制”以加载文件夹内容。</p>
			)}
		</>
	);
};

export default FileSystemViewer;
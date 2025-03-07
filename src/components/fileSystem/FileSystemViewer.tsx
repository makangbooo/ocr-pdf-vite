// components/FileSystemViewer.tsx
import React from 'react';
import { Menu, Checkbox } from 'antd';
import { FolderOutlined, FileImageOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import {getFileType} from "../../utils/fileTypeIdentify.tsx";

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

interface FileSystemViewer {
	setCurrentFile: (url:CurrentFile)=>void
	isBatchOperation:boolean;
	selectedPaths:Set<string>;
	fileTree:FileItem[];
	setSelectedPaths: ( paths: Set<string>) => void;
}

type MenuItem = Required<MenuProps>['items'][number];

const FileSystemViewer: React.FC<FileSystemViewer> = ({setCurrentFile,isBatchOperation,selectedPaths,fileTree,setSelectedPaths}) => {

	// 将文件树转换为 Menu 所需的 items 格式
	const getMenuItems = (items: FileItem[]): MenuItem[] => {
		return items.map(item => ({
			key: item.path,
			icon: item.type === 'folder' ? <FolderOutlined /> : <FileImageOutlined />,
			label: (
				<div style={{ display: 'flex', alignItems: 'center' }}>
					{
					isBatchOperation &&
                      <Checkbox
                        checked={selectedPaths.has(item.path)}
                        onChange={e => handleCheckboxChange(item.path, item.type === 'folder', e.target.checked)}
                        onClick={e => e.stopPropagation()}
                      />
					}
					<span style={{ marginLeft: 8 }}>{item.name}</span>
				</div>
			),
			children: item.children ? getMenuItems(item.children) : undefined,
		}));
	};

	// 处理菜单点击事件
	const handleMenuClick: MenuProps['onClick'] = (e) => {
		const clickedItem = findItemByPath(fileTree, e.key);
		console.log("clickedItem",clickedItem)
		if (clickedItem?.type === 'file' && clickedItem.file) {
			const fileType = getFileType(clickedItem.name);
			const currentClick = {
				name: clickedItem.name,
				type: fileType,
				data: URL.createObjectURL(clickedItem.file),
			}
			console.log("currentClick",currentClick)
			setCurrentFile(currentClick)
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
		const item = findItemByPath(fileTree, path);

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

				<Menu
					mode="inline"
					items={getMenuItems(fileTree)}
					onClick={handleMenuClick}
					style={{ height: 'calc(100% - 60px)', overflow: 'auto' }}
					defaultOpenKeys={fileTree.map(item => item.path)}
				/>

	);
};

export default FileSystemViewer;
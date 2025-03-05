// components/FileSystemViewer.tsx
import React, { useState } from 'react';
import { Button, Menu, Checkbox } from 'antd';
import { FolderOutlined, FileImageOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

interface FileItem {
	name: string;
	type: 'file' | 'folder';
	path: string;
	children?: FileItem[];
	file?: File;
}

interface FileSystemViewer {
	refreshImageUrl: (url:string)=>void
	isBatchOperation:boolean;
	selectedPaths:Set<string>;
	fileTree:FileItem[];
	handleCheckboxChange: (path: string, isFolder: boolean, checked: boolean) => void;
}

type MenuItem = Required<MenuProps>['items'][number];

const FileSystemViewer: React.FC<FileSystemViewer> = ({refreshImageUrl,isBatchOperation,selectedPaths,fileTree,handleCheckboxChange}) => {

	// 将文件树转换为 Menu 所需的 items 格式
	const getMenuItems = (items: FileItem[]): MenuItem[] => {
		return items.map(item => ({
			key: item.path,
			icon: item.type === 'folder' ? <FolderOutlined /> : <FileImageOutlined />,
			label: (
				<div style={{ display: 'flex', alignItems: 'center' }}>
					{/* todo，当用户点击批量操作时，显示选择框*/}
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
		if (clickedItem?.type === 'file' && clickedItem.file) {
			refreshImageUrl(URL.createObjectURL(clickedItem.file))
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

	return (
		<div style={{ display: 'flex', height: '100vh',width: '100%' }}>
			<div style={{ width: 300, background: '#f0f2f5' }}>
				<Menu
					mode="inline"
					items={getMenuItems(fileTree)}
					onClick={handleMenuClick}
					style={{ height: 'calc(100% - 60px)', overflow: 'auto' }}
					defaultOpenKeys={fileTree.map(item => item.path)}
				/>
			</div>
		</div>
	);
};

export default FileSystemViewer;
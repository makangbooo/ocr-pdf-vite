import React, {useEffect} from 'react';
import type {MenuProps} from 'antd';
import {Button, Checkbox, Dropdown, Menu, message} from 'antd';
import {FileImageOutlined, FolderOutlined, SyncOutlined, UnorderedListOutlined} from '@ant-design/icons';
import {getBase64ByPath_Electron, getFileType} from "../../utils/fileTypeIdentify.tsx";
import UploadButton from "../uploadButton.tsx";
import axios from "axios";
import {CurrentFileNew, FileItemNew} from "../../types/entityTypesNew.ts";

interface FileSystemViewerProps {
	setCurrentFile: (url: CurrentFileNew) => void;
	isBatchOperation: boolean;
	selectedPaths: FileItemNew[] | undefined;
	setSelectedPaths: (paths: FileItemNew[] | []) => void;

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
															   dirHandle,
															   internalFileTree,
															   setInternalFileTree,
															   setIsBatchOperation
														   }) => {


	// todo 初始化或同步文件夹
	const syncDirectory = async () => {
		if (!dirHandle) return
		try {
			 //所导入根文件夹路径
			const response = await (window as any).electronAPI.syncFolder(dirHandle);

			if (response.success) {
				message.open({
					type: 'success',
					content: '文件同步成功',
					duration: 1
				});

				setInternalFileTree(response.children?response.children:[]);
				setSelectedPaths([]);
			} else {
				message.open({
					type: 'error',
					content: '文件同步失败',
					duration: 1
				});
				return undefined;
			}
		} catch (error) {
			message.open({
				type: 'error',
				content: '文件同步失败',
				duration: 1
			});
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
								disabled={getFileType(item.name)!=='image' }
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
		const clickedItem = findItemByPath(internalFileTree, e.key);
		if (!clickedItem || clickedItem.isDirectory) return;

		const currentFile = await getBase64ByPath_Electron(clickedItem)
		if (currentFile === undefined) return undefined;
		const currentClick = {
			name: currentFile.name,
			type: currentFile.type,
			path: currentFile.path,
			file: currentFile.file, // Base64 数据
			data: currentFile.data,
		};
		setCurrentFile(currentClick);
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
			message.error('No file selected.')
			return;
		}

		try {
			const requestData = await Promise.all(
				selectedPaths.map(async (file) => {
					const currentFile = await getBase64ByPath_Electron(file)
					if (currentFile === undefined) return undefined;
					return {
						name: currentFile.name,
						file: currentFile.data,
					}
				})
			);

			// 4. 发送请求
			const response = await axios.post(
				`${process.env.VITE_API_BASE_URL}/FileTypeConvert/imageToPDF`,
				requestData
			);

			const downloadUrl = `${process.env.VITE_API_BASE_URL}/${response.data.name}`
			const fileName = response.data.name; // 根据接口返回的文件名
			// 下载
			try {
				const downloadResult = await (window as any).electronAPI.downloadFile(downloadUrl, fileName);
				if (downloadResult.success) {
					message.success(`下载成功，文件路径: ${downloadResult.filePath}`);
				} else {
					message.error(`下载失败: ${downloadResult.error}`);
				}
			} catch (error) {
				message.error(`IPC 调用失败: ${error}`);
				return undefined;
			}
			return response.data; // 根据需要返回数据
		} catch (error) {
			message.error(`PDF conversion failed: ${error}`);
			throw error; // 或根据需求处理错误
		}
	};

	// 转化为双层ofd
	const convert2ofd = async (): Promise<void> => {
		// 1. 输入验证
		if (!selectedPaths?.length) {
			message.error('No file selected.');
			return;
		}

		try {
			// 3. 并行处理文件转换
			const requestData = await Promise.all(
				selectedPaths.map(async (file) => {
					const currentFile = await getBase64ByPath_Electron(file)
					if (currentFile === undefined) return undefined;
					return {
						name: currentFile.name,
						file: currentFile.data,
					}
				})
			);

			// 4. 发送请求
			const response = await axios.post(
				`${process.env.VITE_API_BASE_URL}/FileTypeConvert/imageToOFD`,
				requestData
			);
			const downloadUrl = `${process.env.VITE_API_BASE_URL}/${response.data.name}`
			const fileName = response.data.name; // 根据接口返回的文件名


			// 下载
			try {
				const downloadResult = await (window as any).electronAPI.downloadFile(downloadUrl, fileName);
				if (downloadResult.success) {
					message.success(`下载成功，文件路径: ${downloadResult.filePath}`);
				} else {
					message.error(`下载失败: ${downloadResult.error}`);
				}
			} catch (error) {
				message.error(`IPC 调用失败: ${error}`);
				return undefined;
			}
			return response.data; // 根据需要返回数据
		} catch (error) {
			message.error(`PDF conversion failed: ${error}`);
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
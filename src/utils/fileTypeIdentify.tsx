import {CurrentFile, FileItem} from "../components/entityTypes.ts";

/**
 *  一个工具类，获取文件的后缀，根据后缀判断文件类型
 * 		input：文件名
 * 		output：pdf 或 image 或 ofd 或 undefined
 */
export const getFileType = (fileName: string): 'pdf' | 'image' | 'ofd' | 'other' => {
	const extension = fileName.split('.').pop()?.toLowerCase();
	if (extension === 'pdf') return 'pdf';
	if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) return 'image';
	if (extension === 'ofd') return 'ofd';
	return 'other';



}

// 使用 FileReader 将 blob URL 转换为 Base64
export const getBase64FromBlob = (currentFile: CurrentFile): Promise<string> => {
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

// 使用 FileReader 将 blob URL 转换为 Base64
export const getBase64FromBlobUrl = (imageUrl: string): Promise<string> => {
	return new Promise(async (resolve, reject) => {
		try {
			// 通过 fetch 获取 Blob
			const response = await fetch(imageUrl);
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


// 传入文件文件夹句柄，读取文件夹并构建文件树
export const buildFileTree = async (handle: FileSystemDirectoryHandle, path: string = ''): Promise<FileItem[]> => {
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

// 根据文件路径在文件树中遍历查找文件项
export const findItemByPath = (items: FileItem[], path: string): FileItem | undefined => {
	for (const item of items) {
		if (item.path === path) return item;
		if (item.children) {
			const found = findItemByPath(item.children, path);
			if (found) return found;
		}
	}
	return undefined;
};
export const ImageTypes = ['png', 'jpg', 'jpeg']

// 文件树
export interface FileItem {
	name: string;
	type: 'file' | 'folder';
	path: string;
	// 如果是文件夹
	children?: FileItem[];
	// 如果是文件夹，就无改属性值
	file?: File;
}

// 当前文件
export interface CurrentFile {
	name: string;
	type: 'folder' | 'pdf' | 'image' | 'ofd' | undefined;
	file: File;
	data: string; // 主要存储base64数据
}

// 元数据
export interface DocumentMeta {
	// 红头名字
	redHeader?: string;
	// 文件号
	fileNumber?: string;
	// 文件主题
	fileTitle?: string;
	// 正文
	content?: string;
	// 发文日期
	documentDate?: Date | null;
}
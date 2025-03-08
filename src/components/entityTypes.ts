export interface CurrentFile {
	name?: string;
	type?: 'folder' | 'pdf' | 'image' | 'ofd' | undefined;
	data: string;
	file?: File;
}

// 文件类
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
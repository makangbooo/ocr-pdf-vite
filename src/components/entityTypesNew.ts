export interface FileItemNew {
	name: string;
	path: string;
	isDirectory: boolean;
	children?: FileItemNew[];
}

export interface CurrentFileNew {
	name: string;
	path: string;
	type: 'folder' | 'pdf' | 'image' | 'ofd' | 'other';
	file: File;
	data: string; // 主要存储base64数据
}
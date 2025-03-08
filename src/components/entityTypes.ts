export interface CurrentFile {
	name?: string;
	type?: 'folder' | 'pdf' | 'image' | 'ofd' | undefined;
	data: string;
	file?: File;
}
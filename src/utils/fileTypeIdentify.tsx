/**
 *  一个工具类，获取文件的后缀，根据后缀判断文件类型
 * 		input：文件名
 * 		output：pdf 或 image 或 ofd 或 undefined
 */
export const getFileType = (fileName: string): 'pdf' | 'image' | 'ofd' | undefined => {
	const extension = fileName.split('.').pop()?.toLowerCase();
	if (extension === 'pdf') return 'pdf';
	if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) return 'image';
	if (extension === 'ofd') return 'ofd';
	return undefined;
}
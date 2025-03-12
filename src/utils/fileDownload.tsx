export const handleDownload = (url: string, fileName: string) => {
	const link = document.createElement('a');
	link.href = url;
	link.download = fileName; // 指定下载文件名
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
};
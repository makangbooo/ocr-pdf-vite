interface ElectronAPI {
	selectFolder: () => Promise<string | null>;
	syncFolder: (folderPath:string) => Promise<string | null>;
	readFile: (path:string) => Promise<string | null>;
	downloadFile: (url, fileName) => Promise<string | null>;
	downloadFileUrlSavePath: (downloadUrl, savePath) => Promise<string | null>;

	startScan: () => Promise<string | null>;

}

declare global {
	interface Window {
		electronAPI: ElectronAPI;
	}
}
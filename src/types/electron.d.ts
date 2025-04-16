// 修改后（正确）
interface ScanResult {
	installed?: boolean;
	found?: boolean;
	devices?: string[];
	error?: string;
}
interface ElectronAPI {
	selectFolder: () => Promise<string | null>;
	syncFolder: (folderPath:string) => Promise<string | null>;
	readFile: (path:string) => Promise<string | null>;
	downloadFile: (url, fileName) => Promise<string | null>;
	downloadFileUrlSavePath: (downloadUrl, savePath) => Promise<string | null>;

	// startScan: () => Promise<string | null>;
	checkSane: () => Promise<ScanResult>;
	installSane: () => Promise<string | null>;
	checkScanner: () => Promise<ScanResult>;
	launchXsane: (device) => Promise<string | null>;

}

declare global {
	interface Window {
		electronAPI: ElectronAPI;
	}
}
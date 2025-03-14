interface ElectronAPI {
	selectFolder: () => Promise<string | null>;
	readFile: (path:string) => Promise<string | null>;
}

declare global {
	interface Window {
		electronAPI: ElectronAPI;
	}
}
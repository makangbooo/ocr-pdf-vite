export interface ElectronAPI {
	openFolder: () => Promise<string | null>;
}

declare global {
	interface Window {
		electronAPI: ElectronAPI;
	}
}


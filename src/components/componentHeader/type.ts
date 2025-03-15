import {CurrentFileNew, FileItemNew} from "../../types/entityTypesNew.ts";

export interface ComponentHeaderInterface {
	// 导入文件按钮
	setSelectedPaths: (paths: FileItemNew[] | []) => void;
	resetIsBatchOperation:( isBatchOperation: boolean) => void;
	setDirHandle: (dirHandle: string) => void;
	dirHandle?: string | null;
	setInternalFileTree: (fileTree: FileItemNew[]) => void;

	currentFile?: CurrentFileNew;

	// 画框识别
	isOcrEnabled: boolean;
	setIsOcrEnabled: ( isOcrEnabled: boolean) => void;

	// 全文识别
	setFullText: (text: string) => void;
	setIsFullOcrEnabled:( isFullOcrEnabled: boolean) => void;
	isFullOcrEnabled: boolean;

	// 模版模式
	isTemplateEnabled: boolean;
	setIsTemplateEnabled: ( isOcrEnabled: boolean) => void;

	// 批量操作
	isBatchOperation: boolean;

	setTemplateOcrLoading: (isTemplateOcrLoading: boolean) => void;
	templateOcrLoading: boolean;
	fullOcrLoading:boolean;
	setFullOcrLoading: (isFullOcrLoading: boolean) => void;
}
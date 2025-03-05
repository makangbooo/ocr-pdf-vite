
import React, { useState } from 'react';
import {Button, Col, Drawer, Image, Row, Splitter} from 'antd';
import UploadViewer from "./components/uploadViewer/uploadViewer.tsx";
import ImageListViewer from "./components/imageList/imageList.tsx";
import PdfViewer from "./components/pdfViewer/pdfViewer.tsx";
import OperatorViewer from "./components/operatorViewer/operatorViewer.tsx";
import FileSystemViewer from "./components/fileSystem/FileSystemViewer.tsx";



interface ImageItem {
    path: string;
    name: string;
}
interface FileItem {
    name: string;
    type: 'file' | 'folder';
    path: string;
    children?: FileItem[];
    file?: File;
}


const App: React.FC = () => {
    // 文件列表所选择的图片
    const [imageUrl, setImageUrl] = useState('');
    const [isBatchOperation, setIsBatchOperation] = useState(false);

    const [fileTree, setFileTree] = useState<FileItem[]>([]);
    const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());




    const refreshImageUrl = (url: string) => {
        setImageUrl(url);
    }
    const resetIsBatchOperation = (isBatchOperation: boolean) => {
        setIsBatchOperation(true)
    }

    // 处理文件夹选择
    const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        const tree: FileItem[] = [];
        const pathMap = new Map<string, FileItem>();

        Array.from(files).forEach(file => {
            const pathParts = file.webkitRelativePath.split('/');
            let currentLevel = tree;

            for (let i = 0; i < pathParts.length; i++) {
                const part = pathParts[i];
                const fullPath = pathParts.slice(0, i + 1).join('/');

                if (i === pathParts.length - 1) {
                    const fileItem: FileItem = {
                        name: part,
                        type: 'file',
                        path: fullPath,
                        file: file
                    };
                    currentLevel.push(fileItem);
                } else {
                    let folder = pathMap.get(fullPath);
                    if (!folder) {
                        folder = {
                            name: part,
                            type: 'folder',
                            path: fullPath,
                            children: []
                        };
                        pathMap.set(fullPath, folder);
                        currentLevel.push(folder);
                    }
                    currentLevel = folder.children!;
                }
            }
        });

        setFileTree(tree);
        setSelectedPaths(new Set());
    };
    // 获取所有子文件路径
    const getAllChildPaths = (item: FileItem): string[] => {
        const paths: string[] = [];
        if (item.type === 'file') {
            paths.push(item.path);
        } else if (item.children) {
            item.children.forEach(child => {
                paths.push(...getAllChildPaths(child));
            });
        }
        return paths;
    };
    // 处理选择框变化
    const handleCheckboxChange = (path: string, isFolder: boolean, checked: boolean) => {
        const newSelected = new Set(selectedPaths);
        const item = findItemByPath(fileTree, path);

        if (isFolder && item?.children) {
            const childPaths = getAllChildPaths(item);
            if (checked) {
                childPaths.forEach(p => newSelected.add(p));
            } else {
                childPaths.forEach(p => newSelected.delete(p));
            }
        } else {
            if (checked) {
                newSelected.add(path);
            } else {
                newSelected.delete(path);
            }
        }

        setSelectedPaths(newSelected);
    };
    // 根据路径查找文件项
    const findItemByPath = (items: FileItem[], path: string): FileItem | undefined => {
        for (const item of items) {
            if (item.path === path) return item;
            if (item.children) {
                const found = findItemByPath(item.children, path);
                if (found) return found;
            }
        }
        return undefined;
    };




    const [drawerOpen, setDrawerOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');

    const [imageListUrl, setImageListUrl] = useState<ImageItem[]>([]);
    const [ocrText, setOcrText] = useState<string>("");
    const [isOcrEnabled, setIsOcrEnabled] = useState<boolean>(false);

    const showDrawer = () => {
        setDrawerOpen(true);
    };
    const onDrawerClose = () => {
        setDrawerOpen(false);
    };
    const refreshPdfUrl = (pdfUrl: string,imageUrlList: ImageItem[]) => {
        setPdfUrl(pdfUrl);
        setImageListUrl(imageUrlList)
        onDrawerClose()
    };

    const refreshOcrText = (text: string) => {
        setOcrText(text);
    }

    const refreshOcrMode = (mode: boolean) => {
        setIsOcrEnabled(mode);
    }


    return (
        <div style={{ height: '100vh', width: '100vw'}}>
            <Row justify="space-evenly" align="middle">
                <Col span={3}>
                    <Button type="primary">扫描仪控制</Button>
                </Col>
                <Col span={3}>
                    <input
                        type="file"
                        id="folderInput"
                        // @ts-ignore
                        webkitdirectory="true"
                        directory="true"
                        style={{ display: 'none' }}
                        onChange={handleFolderSelect}
                        multiple
                    />
                    <Button
                        type="primary"
                        onClick={() => document.getElementById('folderInput')?.click()}
                    >
                        导入文件
                    </Button>
                </Col>
                <Col span={3}>
                    <Button type="primary">全文识别</Button>
                </Col>
                <Col span={3}>
                    <Button type="primary">画框识别</Button>
                </Col>
                <Col span={3}>
                    <Button type="primary">公文识别</Button>
                </Col>
                <Col span={3}>
                    <Button type="primary">公文模版定制</Button>
                </Col>
                <Col span={3}>
                    <Button
                        type="primary"
                        onClick={()=> resetIsBatchOperation}
                    >批量处理</Button>
                </Col>
            </Row>
            <Splitter style={{ height: '100%', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)' }}>
                <Splitter.Panel defaultSize="15%" min="10%">
                    <FileSystemViewer
                        refreshImageUrl={refreshImageUrl}
                        isBatchOperation={isBatchOperation}
                        selectedPaths={selectedPaths}
                        fileTree={fileTree}
                        handleCheckboxChange={handleCheckboxChange}
                    />
                </Splitter.Panel>
                <Splitter.Panel defaultSize="60%" min="10%">
                    <Image src={imageUrl} style={{ width: '100%', height: '100%' }}/>
                    {/*<PdfViewer file={imageUrl} refreshOcrText={refreshOcrText} refreshOcrMode={refreshOcrMode}/>*/}
                </Splitter.Panel>
                <Splitter.Panel defaultSize="35%" min="10%">
                    <OperatorViewer ocrText={ocrText} isOcrEnabled={isOcrEnabled}/>
                </Splitter.Panel>
            </Splitter>
        </div>
    );
}

export default App;
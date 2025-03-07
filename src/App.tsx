import React, { useState } from 'react';
import FileSystemViewer from './components/fileSystem/FileSystemViewer.tsx';
import ComponentHeader from './components/componentHeader/componentHeader.tsx';
import UploadButton from './components/uploadButton.tsx';
import ImageViewer from './components/imageViewer/imageViewer.tsx';
import OperatorViewer from "./components/operatorViewer/operatorViewer.tsx";

interface FileItem {
    name: string;
    type: 'file' | 'folder';
    path: string;
    children?: FileItem[];
    file?: File;
}

const App: React.FC = () => {

    // 文件列表
    const [imageUrl, setImageUrl] = useState('');// 所选择的图片
    const [isBatchOperation, setIsBatchOperation] = useState(false);// 是否批量操作
    const [fileTree, setFileTree] = useState<FileItem[]>([]);// 文件夹
    const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());// 选择的文件

    // ocr模式
    const [ocrText, setOcrText] = useState("");
    const [isOcrEnabled, setIsOcrEnabled] = useState(false);	// OCR按钮状态

    //全文识别模式
    const [fullText,setFullText] = useState('');
    const [isFullOcrEnabled, setIsFullOcrEnabled] = useState(false);	// OCR按钮状态


    // 模版模式
    const [isTemplateEnabled, setIsTemplateEnabled] = useState(false);

    return (
        <div
            style={{
                height: '100vh',
                width: '100vw',
                display: 'flex',
                flexDirection: 'column',
                background: 'linear-gradient(135deg, #f0f2f5 0%, #ffffff 100%)', // 高级渐变背景
            }}
        >
            <div style={{height: '12vh', width: '100vw',}}>
                <ComponentHeader
                    setFileTree={setFileTree}
                    setSelectedPaths={setSelectedPaths}
                    resetIsBatchOperation={setIsBatchOperation}
                    isBatchOperation={isBatchOperation}
                    setIsOcrEnabled={setIsOcrEnabled}
                    isOcrEnabled={isOcrEnabled}
                    setIsTemplateEnabled={setIsTemplateEnabled}
                    isTemplateEnabled={isTemplateEnabled}
                    imageUrl={imageUrl}
                    setFullText={setFullText}
                    setIsFullOcrEnabled={setIsFullOcrEnabled}
                    isFullOcrEnabled={isFullOcrEnabled}
                />
            </div>
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', // 更柔和的外部阴影
                    overflow: 'hidden', // 防止溢出破坏美观
                    backgroundColor: '#fff',
                    borderRadius: '8px', // 圆角容器
                    transition: 'all 0.3s ease', // 平滑过渡
                }}
            >
                {/* 页面1 */}
                <div
                    style={{
                        width: 'calc((100vw - (88vh / 1.414)) / 3)',
                        minWidth: '10%',
                        height: '100%',
                        overflow: 'auto',
                        background: 'linear-gradient(to bottom, #fafafa, #f5f5f5)', // 渐变背景
                        borderRadius: '4px', // 轻微圆角
                        // boxShadow: '2px 0 8px rgba(0, 0, 0, 0.05)', // 右侧阴影替代边框
                        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.05)',
                        padding: '16px', // 更大内边距
                        // transition: 'width 0.3s ease', // 宽度变化动画
                        transition: 'box-shadow 0.3s ease', // 阴影过渡
                    }}
                >
                    <FileSystemViewer
                        refreshImageUrl={setImageUrl}
                        isBatchOperation={isBatchOperation}
                        selectedPaths={selectedPaths}
                        fileTree={fileTree}
                        setSelectedPaths={setSelectedPaths}
                    />
                    <UploadButton
                        name={'转化为双层pdf'}
                        buttonType={''}
                        onClick={() => {
                            throw new Error('Function not implemented.');
                        }}
                        disabled={ selectedPaths.size === 0}
                    />
                </div>

                {/* 页面2 */}
                <div
                    style={{
                        width: 'calc(88vh / 1.414)',
                        height: '100%',
                        overflow: 'hidden',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1), inset 0 0 5px rgba(0, 0, 0, 0.03)', // 立体纸张效果
                        borderRadius: '4px', // 轻微圆角
                        padding: '8px', // 内容边距
                        position: 'relative', // 用于伪元素
                        transition: 'width 0.3s ease', // 宽度变化动画
                    }}
                >
                    {/* 伪元素模拟纸张边缘 */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.05)',
                            pointerEvents: 'none', // 不干扰交互
                        }}
                    />
                    {/*todo 这里判断所选图片为pdf还是image*/}
                    <ImageViewer
                        imageUrl={imageUrl}
                        isOcrEnabled={isOcrEnabled}
                        setOcrText={setOcrText}
                        ocrText={ocrText}
                        isTemplateEnabled={isTemplateEnabled}
                    />
                </div>

                {/* 页面3 */}
                <div
                    style={{
                        width: 'calc((100vw - (88vh / 1.414)) * 2 / 3)',
                        minWidth: '10%',
                        height: '100%',
                        overflow: 'auto',
                        background: 'linear-gradient(to bottom, #ffffff, #fafafa)', // 渐变背景
                        boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.05)', // 左侧阴影替代边框
                        padding: '16px', // 更大内边距
                        transition: 'filter 0.3s ease', // 模糊过渡
                        filter: 'none', // 动态模糊
                        borderRadius: '4px', // 轻微圆角
                    }}
                >
                    <div style={{ color: '#595959', fontSize: '14px' }}>
                        <OperatorViewer isOcrEnabled={isOcrEnabled} isFullOcrEnabled={isFullOcrEnabled} ocrText={ocrText} fullText={fullText} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
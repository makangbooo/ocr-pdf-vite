import React, {useEffect, useRef, useState} from "react";
import {Worker, Viewer} from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';

// Import the styles provided by the react-pdf-viewer packages
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';


import { CurrentFile } from "../entityTypes.ts";
import html2canvas from "html2canvas";
import {API_URLS} from "../../api/api.ts";
import axios from "axios";
import {Popover} from "antd";


interface pdfViewerProps {
	currentFile: CurrentFile;
	isOcrEnabled: boolean;
	setOcrText: (text: string) => void;
	ocrText: string;
}


// 使用 FileReader 将 blob URL 转换为 Base64
const getBase64FromBlob = (imageUrl: string): Promise<string> => {
	return new Promise(async (resolve, reject) => {
		try {
			// 通过 fetch 获取 Blob
			const response = await fetch(imageUrl);
			if (!response.ok) {
				throw new Error('Failed to fetch blob from URL');
			}
			const blob = await response.blob();

			const reader = new FileReader();

			reader.onload = () => {
				const base64String = reader.result as string; // 完整的 Data URL
				const base64Only = base64String.split(',')[1]; // 只取 Base64 部分
				resolve(base64Only); // 返回纯 Base64 字符串
			};

			reader.onerror = (error) => {
				reject(error); // 读取失败时返回错误
			};

			reader.readAsDataURL(blob); // 读取 Blob 为 Data URL
		} catch (error) {
			reject(error); // fetch 或其他错误
		}
	});
};
const PdfViewer: React.FC<pdfViewerProps> = ({currentFile,isOcrEnabled, setOcrText,ocrText}) => {

	const containerRef = useRef<HTMLDivElement>(null);

	// OCR绘制矩形
	const [isOCRDrawing, setIsOCRDrawing] = useState(false); // OCR绘制状态
	const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
	const [rect, setRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
	const [isOCRing, setIsOCRing] = useState(false); // OCR绘制状态

	const defaultLayoutPluginInstance = defaultLayoutPlugin();

	// 监听isOcrEnabled变化
	useEffect(() => {
		// 开启画框ocr模式时
		if (isOcrEnabled) {
			//todo
		} else {
			// 关闭 OCR 模式时重置矩形和结果
			setRect(null);
			setOcrText("");
			setIsOCRDrawing(false);
		}
	}, [isOcrEnabled]);
	// 开始绘制（仅在 OCR 启用时生效）
	const handleMouseDown = (e: React.MouseEvent) => {
		if (!isOcrEnabled || !containerRef.current) return;
		const rectContainer = containerRef.current.getBoundingClientRect();
		const x = e.clientX - rectContainer.left;
		const y = e.clientY - rectContainer.top;
		setStartPos({ x, y });
		setRect({ x, y, width: 0, height: 0 });
		setIsOCRDrawing(true);
		setOcrText("正在识别...");
	};

	// 动态更新矩形
	const handleMouseMove = (e: React.MouseEvent) => {
		if (!isOCRDrawing || !containerRef.current) return;
		const rectContainer = containerRef.current.getBoundingClientRect();
		const currentX = e.clientX - rectContainer.left;
		const currentY = e.clientY - rectContainer.top;
		const width = currentX - startPos.x;
		const height = currentY - startPos.y;
		setRect({
			x: width < 0 ? currentX : startPos.x,
			y: height < 0 ? currentY : startPos.y,
			width: Math.abs(width),
			height: Math.abs(height),
		});
	};

	// 结束绘制并触发 OCR
	const handleMouseUp = async () => {
		if (!isOCRDrawing || !rect || !containerRef.current) return;
		setIsOCRDrawing(false);
		setIsOCRing(true);
		try {
			const canvas = await html2canvas(containerRef.current, {
				x: rect.x + 2,
				y: rect.y + 2,
				width: rect.width,
				height: rect.height,
				scale: 10,
			});
			const imgData = canvas.toDataURL("image/png");
			// const blob = await (await fetch(imgData)).blob();
			const requestData = await getBase64FromBlob(imgData)

			// 目标 API URL
			const url = API_URLS.IMAGE_BASE64_OCR;
			// 构造请求数据
			const data = {
				base64: requestData, // Base64 编码的图片数据
				options: {
					"data.format": "text" // 可选参数
				}
			};
			// 发送 POST 请求
			const response = await axios.post(url, data);
			setOcrText(response.data.data || "未识别到文字");
			// 将response.data.data自动赋值到剪贴板
			await navigator.clipboard.writeText(response.data.data);
			setIsOCRing(false);



			// const formData = new FormData();
			// formData.append("file", blob, "screenshot.png");
			// // const response = await axios.post("http://localhost:8080/OCRToPDF/ocrImage", formData, {
			// const response = await axios.post(`${process.env.VITE_API_BASE_URL}/OCRToPDF/ocrImage`, formData, { //todo
			// 	headers: { "Content-Type": "multipart/form-data" },
			// });
			// setOcrText(response.data || "未识别到文字");
		} catch (error) {
			console.error("OCR 处理失败:", error);
			setOcrText("OCR 处理失败");
		}
	};


	return (
		<>
				<div
					style={{
						position: "relative",
						width: "100%",
						height: "100%",
						overflow: "hidden" }}
				>

					<div
						ref={containerRef}
						key={currentFile.data}
						style={{
							position: "relative",
							width: "100%",
							height: "100%",
							backgroundColor: "#f0f0f0",
							overflow: "hidden",
							userSelect: isOcrEnabled ? "none" : "text",
						}}
						onMouseDown={handleMouseDown}
						onMouseMove={handleMouseMove}
						onMouseUp={handleMouseUp}
					>

						<Worker workerUrl="/pdfjs/pdf.worker.js">
						{/*<Worker workerUrl="https://unpkg.com/pdfjs-dist@2.15.349/build/pdf.worker.js">*/}
							<Viewer fileUrl={currentFile.data}
									// onDocumentLoad={onLoadSuccess}
									plugins={[
										defaultLayoutPluginInstance,
									]}/>
						</Worker>
						{
							rect &&
							// rect && isOcrEnabled && (
                          <Popover content={ocrText || "等待识别..."} title={<span>ocr识别结果{!isOCRing&&<span style={{color: "blue", fontSize: "small"}}>(已复制到剪贴板)</span>}</span>} open={!isOCRDrawing}>
                            <div
                              style={{
								  position: "absolute",
								  left: `${rect.x}px`,
								  top: `${rect.y}px`,
								  width: `${rect.width}px`,
								  height: `${rect.height}px`,
								  border: "2px dashed red",
								  backgroundColor: "rgba(255, 0, 0, 0.1)",
							  }}
                            />
                          </Popover>
							// )
						}
					</div>
				</div>
		</>
	);
};

export default PdfViewer;
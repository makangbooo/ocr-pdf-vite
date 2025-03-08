"use client"; // ✅ 关键一步，Next.js 需要明确它是 Client Component
import React, {useState, useRef, useEffect} from "react";
import '@react-pdf-viewer/core/lib/styles/index.css';
import html2canvas from "html2canvas";
import axios from "axios";
import {Flex, Typography, Popover, Image} from "antd";

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import {API_URLS} from "../../api/api.ts";

import { CurrentFile } from "../entityTypes.ts";

interface ImageViewerProps {
	currentFile: CurrentFile;
	isOcrEnabled: boolean;
	isTemplateEnabled: boolean;
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

const ImageViewer: React.FC<ImageViewerProps> = ({ currentFile, ocrText, setOcrText, isOcrEnabled, isTemplateEnabled }) => {
	const containerRef = useRef<HTMLDivElement>(null);

	// OCR绘制矩形
	const [isOCRDrawing, setIsOCRDrawing] = useState(false); // OCR绘制状态
	const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
	const [rect, setRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
	const [isOCRing, setIsOCRing] = useState(false); // OCR绘制状态

	// 模版模式
	const [template, ] = useState<Array<{ type: string, x: string; y: string; width: string; height: string }> | null>(
		[
			{ type:"title", x: "15%", y: "20%", width: "70%", height: "6%" },	// 红头
			{ type:"content", x: "28%", y: "30.5%", width: "42%", height: "3%" },  // 文件号
			{ type:"content", x: "20%", y: "35%", width: "59%", height: "9%" },  // 主题
			{ type:"content", x: "12%", y: "47%", width: "75%", height: "44%" }	  // 正文
		]
	);

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
				scale: 20,
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
		{currentFile ? (
				<div
					style={{
						position: "relative",
						width: "100%",
						height: "100%",
						overflow: "hidden" }}
				>
					<div
						ref={containerRef}
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
						<Image src={currentFile.data} style={{height:  "88vh" }} preview={false}/>

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
						{
							(isTemplateEnabled && template) && template.map((item) => {
								return (
									<div
										style={{
											position: "absolute",
											left: item.x,
											top: item.y,
											width: item.width,
											height: item.height,
											border: "2px dashed red",
											backgroundColor: "rgba(255, 0, 0, 0.1)",
										}}
									/>
								)
							})
						}
					</div>
				</div>

			) : (
				<>
					<Flex justify="center" align="center" style={{ height: '100%', width: "100%" }}>
						<Typography.Title type="secondary" level={5}>pdf文件</Typography.Title>
					</Flex>
					{/*{*/}
					{/*	template && template.map((item) => {*/}
					{/*		return (*/}
					{/*			<div*/}
					{/*				style={{*/}
					{/*					position: "absolute",*/}
					{/*					left: item.x,*/}
					{/*					top: item.y,*/}
					{/*					width: item.width,*/}
					{/*					height: item.height,*/}
					{/*					border: "2px dashed red",*/}
					{/*					backgroundColor: "rgba(255, 0, 0, 0.1)",*/}
					{/*				}}*/}
					{/*			/>*/}
					{/*		)*/}
					{/*	})*/}
					{/*}*/}
				</>
			)}
		</>
	);
};

export default ImageViewer;
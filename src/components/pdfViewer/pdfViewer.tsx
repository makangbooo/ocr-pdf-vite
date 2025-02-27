"use client"; // ✅ 关键一步，Next.js 需要明确它是 Client Component
import React, { useState, useRef } from "react";
import {Worker, Viewer} from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import html2canvas from "html2canvas";
import axios from "axios";
import {Flex, Typography, Popover} from "antd";

// Import the styles provided by the react-pdf-viewer packages
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import UploadButton from "../uploadButton.tsx";


const PdfViewer: React.FC<{ refreshOcrText: (text: string) => void, file: string, refreshOcrMode: (mode: boolean)=>void }> = ({ file, refreshOcrText,refreshOcrMode }) => {
	const containerRef = useRef<HTMLDivElement>(null);

	const [isOcrEnabled, setIsOcrEnabled] = useState(false);	// OCR按钮状态
	const [isDrawing, setIsDrawing] = useState(false);
	const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
	const [rect, setRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
	const [ocrResult, setOcrResult] = useState("");
	const defaultLayoutPluginInstance = defaultLayoutPlugin();

	// 切换 OCR 功能的启用状态
	const toggleOcrMode = () => {
		if (isOcrEnabled) {
			// 关闭 OCR 模式时重置矩形和结果
			setRect(null);
			setOcrResult("");
			setIsDrawing(false);
		}
		setIsOcrEnabled(prev => !prev);
		refreshOcrMode(!isOcrEnabled)
	};

	// 开始绘制（仅在 OCR 启用时生效）
	const handleMouseDown = (e: React.MouseEvent) => {
		if (!isOcrEnabled || !containerRef.current) return;
		const rectContainer = containerRef.current.getBoundingClientRect();
		const x = e.clientX - rectContainer.left;
		const y = e.clientY - rectContainer.top;
		setStartPos({ x, y });
		setRect({ x, y, width: 0, height: 0 });
		setIsDrawing(true);
	};

	// 动态更新矩形
	const handleMouseMove = (e: React.MouseEvent) => {
		if (!isDrawing || !containerRef.current) return;
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
		if (!isDrawing || !rect || !containerRef.current) return;
		setIsDrawing(false);
		setOcrResult("正在识别...");
		try {
			const canvas = await html2canvas(containerRef.current, {
				x: rect.x + 2,
				y: rect.y + 2,
				width: rect.width,
				height: rect.height,
				scale: 20,
			});
			const imgData = canvas.toDataURL("image/png");
			const blob = await (await fetch(imgData)).blob();
			const formData = new FormData();
			formData.append("file", blob, "screenshot.png");
			const response = await axios.post("http://localhost:8080/OCRToPDF/ocrImage", formData, { //todo
				headers: { "Content-Type": "multipart/form-data" },
			});
			setOcrResult(response.data || "未识别到文字");
			refreshOcrText(response.data || "未识别到文字");
		} catch (error) {
			console.error("OCR 处理失败:", error);
			setOcrResult("OCR 处理失败");
			refreshOcrText("OCR 处理失败");
		}
	};

	return (
		<>
			{file ? (
				<div
					style={{
						position: "relative",
						width: "100%",
						height: "100%",
						overflow: "hidden" }}
				>
					{/* 添加按钮 */}
					<UploadButton onClick={toggleOcrMode} name={isOcrEnabled ? "关闭 OCR 模式" : "启用 OCR 模式"} buttonType="ocr"/>

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
						<Worker workerUrl="/pdfjs/pdf.worker.js">
						{/*<Worker workerUrl="https://unpkg.com/pdfjs-dist@2.15.349/build/pdf.worker.js">*/}
							<Viewer fileUrl={file}
									// onDocumentLoad={onLoadSuccess}
									plugins={[
										defaultLayoutPluginInstance,
									]}/>
						</Worker>
						{rect && isOcrEnabled && (
							<Popover content={ocrResult || "等待识别..."} title="ocr识别结果">
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
								></div>
							</Popover>
						)}
						{/*{isOcrEnabled && (*/}
						{/*	<div*/}
						{/*		style={{*/}
						{/*			position: "absolute",*/}
						{/*			bottom: "20px",*/}
						{/*			left: "20px",*/}
						{/*			backgroundColor: "white",*/}
						{/*			padding: "10px",*/}
						{/*			border: "1px solid #ccc",*/}
						{/*		}}*/}
						{/*	>*/}
						{/*		<h3>OCR 结果:</h3>*/}
						{/*		<p>{ocrResult || "等待识别..."}</p>*/}
						{/*	</div>*/}
						{/*)}*/}
					</div>
				</div>

			) : (
				<Flex justify="center" align="center" style={{ height: '100%', width: "100%" }}>
					<Typography.Title type="secondary" level={5}>pdf文件</Typography.Title>
				</Flex>
			)}
		</>
	);
};

export default PdfViewer;
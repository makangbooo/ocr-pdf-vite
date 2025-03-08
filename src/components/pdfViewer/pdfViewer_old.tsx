"use client"; // ✅ 关键一步，Next.js 需要明确它是 Client Component
import React, { useState, useRef } from "react";
import {Worker, Viewer} from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import html2canvas from "html2canvas";
import axios from "axios";
import {Flex, Typography, Popover, Button, Row, Col} from "antd";

// Import the styles provided by the react-pdf-viewer packages
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
// import UploadButton from "../uploadButton.tsx";
import {BorderOuterOutlined, ExpandOutlined} from "@ant-design/icons";


const PdfViewer: React.FC<{ refreshOcrText: (text: string) => void, file: string, refreshOcrMode: (mode: boolean)=>void }> = ({ file, refreshOcrText,refreshOcrMode }) => {
	const containerRef = useRef<HTMLDivElement>(null);

	// OCR绘制矩形
	const [isOcrEnabled, setIsOcrEnabled] = useState(false);	// OCR按钮状态
	const [isOCRDrawing, setIsOCRDrawing] = useState(false); // OCR绘制状态
	const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
	const [rect, setRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
	// OCR结果
	const [ocrResult, setOcrResult] = useState("");
	const defaultLayoutPluginInstance = defaultLayoutPlugin();
	// 模版模式
	const [isTemplateEnabled, setIsTemplateEnabled] = useState(false);
	window.addEventListener('click', (e) => {
		console.log("坐标x",e.x,"坐标y",e.y)
	})
	const [template, ] = useState<Array<{ type: string, x: string; y: string; width: string; height: string }> | null>(
		[
			{ type:"title", x: "36%", y: "20%", width: "10%", height: "5%" },	// 主题
			{ type:"content", x: "25%", y: "30%", width: "30%", height: "50%" },  // 正文
			{ type:"content", x: "25%", y: "83%", width: "30%", height: "10%" }	  // 尾页
		]
	);



	// 切换 OCR 功能的启用状态
	const toggleOcrMode = () => {
		if (isOcrEnabled) {
			// 关闭 OCR 模式时重置矩形和结果
			setRect(null);
			setOcrResult("");
			setIsOCRDrawing(false);
		}
		setIsTemplateEnabled(false)
		setIsOcrEnabled(prev => !prev);
		refreshOcrMode(!isOcrEnabled)
	};

	// 切换 模版 功能的启用状态
	const toggleTemplateMode = () => {
		if (isOcrEnabled) {
			// 关闭 OCR 模式时重置矩形和结果
			setRect(null);
			setOcrResult("");
			setIsOCRDrawing(false);
			setIsOcrEnabled(false)
			refreshOcrMode(false)
		}
		setIsTemplateEnabled(prev => !prev);
	};

	// 开始绘制（仅在 OCR 启用时生效）
	const handleMouseDown = (e: React.MouseEvent) => {
		if (!isOcrEnabled || !containerRef.current) return;
		const rectContainer = containerRef.current.getBoundingClientRect();
		const x = e.clientX - rectContainer.left;
		const y = e.clientY - rectContainer.top;
		setStartPos({ x, y });
		setRect({ x, y, width: 0, height: 0 });
		setIsOCRDrawing(true);
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
			// const response = await axios.post("http://localhost:8080/OCRToPDF/ocrImage", formData, {
			const response = await axios.post(`${process.env.VITE_API_BASE_URL}/OCRToPDF/ocrImage`, formData, { //todo
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

					{/*<Flex gap={'large'}>*/}
						<Row justify="center">
							<Col span={6}>
						<Button
							type="primary"
							icon={<BorderOuterOutlined />}
							onClick={toggleOcrMode}
							danger={isOcrEnabled}
						>
							{isOcrEnabled ? "关闭 OCR 模式" : "启用 OCR 模式"}
						</Button>
							</Col>
							<Col span={6}>
						<Button
							type="primary"
							icon={<ExpandOutlined />}
							onClick={toggleTemplateMode}
							danger={isTemplateEnabled}
						>
							{isTemplateEnabled ? "关闭 模版 模式" : "启用 模版 模式"}
						</Button>
							</Col>
						</Row>
					{/*</Flex>*/}
					{/* 添加按钮 */}
					{/*<UploadButton onClick={toggleOcrMode} name={isOcrEnabled ? "关闭 OCR 模式" : "启用 OCR 模式"} buttonType="ocr" disabled={false}/>*/}
					{/*<UploadButton onClick={toggleOcrMode} name={"启用 模版 模式"} buttonType="ocr" disabled={isOcrEnabled}/>*/}

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
								/>
							</Popover>
						)}
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

export default PdfViewer;
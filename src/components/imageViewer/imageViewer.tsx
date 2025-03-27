import React, {useState, useRef, useEffect} from "react";
import '@react-pdf-viewer/core/lib/styles/index.css';
import html2canvas from "html2canvas";
import axios from "axios";
import {Flex, Typography, Image, Form} from "antd";

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import {API_URLS} from "../../api/api.ts";

import {CurrentFile, DocumentMeta} from "../../types/entityTypes.ts";
import { getBase64FromBlobUrl} from "../../utils/fileTypeIdentify.tsx";
import DrawOCR from "../DrawOcrRender/drawOCR.tsx";

interface ImageViewerProps {

	currentFile?: CurrentFile;
	isOcrEnabled: boolean;
	isTemplateEnabled: boolean;
	setOcrText: (text: string) => void;
	setCurrentFileMeta(meta: DocumentMeta): void;
	currentFileMeta: DocumentMeta | null;
	ocrText: string;
	setTemplateOcrLoading: (isTemplateOcrLoading: boolean) => void;

	customOcrLoading: boolean,
	setCustomOcrLoading: (customOcrLoading: boolean) => void;
	setIsCustomOcrEnable: (isCustomOcrEnable: boolean) => void;
	isCustomOcrEnable: boolean,
}

const ImageViewer: React.FC<ImageViewerProps> = ({ currentFile, ocrText, setOcrText, isOcrEnabled, isTemplateEnabled, setCurrentFileMeta, currentFileMeta, setTemplateOcrLoading,isCustomOcrEnable }) => {
	const containerRef = useRef<HTMLDivElement>(null);

	// OCR绘制矩形
	const [isOCRDrawing, setIsOCRDrawing] = useState(false); // OCR绘制状态
	const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
	const [rect, setRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
	const [isOCRing, setIsOCRing] = useState(false); // OCR绘制状态

	const [isSelecting, setIsSelecting] = useState(false); // OCR绘制状态
	const [form] = Form.useForm();

	// 模版模式
	const [template, ] = useState<Array<{ type: string, position: { x: string, y: string, width: string, height: string } }> >(
		[
			{ type:"redHeader", position: { x: "15%", y: "20%", width: "70%", height: "6%"} },	// 红头
			{ type:"fileNumber", position: { x: "28%", y: "31%", width: "42%", height: "3%"} },  // 文件号
			{ type:"fileTitle", position: { x: "20%", y: "35%", width: "59%", height: "9%"} },  // 主题
			{ type:"content", position: { x: "12%", y: "47%", width: "75%", height: "44%"} }  // 正文
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
	useEffect(() => {
		// 开启模版ocr模式时
		if (isCustomOcrEnable) {
			// todo
		} else {
			// 关闭 OCR 模式时重置矩形和结果
			setRect(null);
			setOcrText("");
			setIsOCRDrawing(false);
		}
	}, [isCustomOcrEnable]);

	// 监听isTemplateEnabled变化，当开启时，将template中的区域，分批发送给API_URLS.IMAGE_BASE64_OCR进行OCR识别
	useEffect(() => {
		// 如果模板未启用且无模板数据，直接重置状态并返回
		if (!isTemplateEnabled || !template?.length) {
			setRect(null);
			setOcrText("");
			setIsOCRDrawing(false);
			return;
		}

		// 如果容器不存在，直接返回
		if (!containerRef.current) return;

		const processTemplateOCR = async () => {
			setTemplateOcrLoading(true);
			if (!containerRef.current) return;

			try {
				const container = {
					width: containerRef.current.offsetWidth,
					height: containerRef.current.offsetHeight
				};

				// 配置模板区域的转换参数
				const getCanvasConfig = (index:number) => ({
					x: (parseFloat(template[index].position.x) / 100) * container.width,
					y: (parseFloat(template[index].position.y) / 100) * container.height,
					width: (parseFloat(template[index].position.width) / 100) * container.width,
					height: (parseFloat(template[index].position.height) / 100) * container.height,
					scale: 10
				});

				// 并行处理所有区域的canvas转换
				const canvases = await Promise.all(
					[0, 1, 2, 3].map(index =>
						html2canvas(containerRef.current!, getCanvasConfig(index)) //使用非空断言操作符 !
					)
				);

				if (canvases.length === 0) return
				// 并行转换canvas为base64

				const base64Images = await Promise.all(
					canvases.map(canvas => getBase64FromBlobUrl(canvas.toDataURL("image/png")))
				);

				// 创建请求数据模板
				const createRequestData = (base64: string) => ({
					base64,
					options: { "data.format": "text" }
				});

				// 并行发送OCR请求
				const responses = await Promise.all(
					base64Images.map(data =>
						axios.post(API_URLS.IMAGE_BASE64_OCR, createRequestData(data))
					)
				);

				// 处理响应数据
				const fileMeta = {
					redHeader: responses[0].data.data,
					fileNumber: responses[1].data.data,
					fileTitle: responses[2].data.data,
					content: responses[3].data.data // 取消注释以启用第四个区域
				};

				setCurrentFileMeta(fileMeta);
			} catch (error) {
				console.error("OCR 处理失败:", error);
			} finally {
				setTemplateOcrLoading(false);
			}
		};

		processTemplateOCR();
	}, [isTemplateEnabled, template]);


	// 开始绘制（仅在 OCR 启用时生效）
	const handleMouseDown = (e: React.MouseEvent) => {
		if ((!isOcrEnabled && !isCustomOcrEnable) || !containerRef.current || isSelecting) return;
		// todo  if (isCustomOcrEnable && isSelecting) return
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
			const requestData = await getBase64FromBlobUrl(imgData)

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

			if (isCustomOcrEnable){
				form.setFieldsValue({CustomOcrResult: response.data.data || "未识别到文字"})
				setIsSelecting(true)
			}



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

						<Image key={currentFile.data} src={currentFile.data} style={{height:  "88vh" }} preview={false}/>

						<DrawOCR
							rect={rect}
							isOCRDrawing={isOCRDrawing}
							isOCRing={isOCRing}
							isOcrEnabled={isOcrEnabled}
							ocrText={ocrText}
							setIsSelecting={setIsSelecting}
							currentFileMeta={currentFileMeta}
							setCurrentFileMeta={setCurrentFileMeta}
							isTemplateEnabled={isTemplateEnabled}
							template={template}
							isCustomOcrEnable={isCustomOcrEnable} isSelecting={isSelecting}
						/>

					</div>
				</div>

			) : (
				<>
					<Flex justify="center" align="center" style={{ height: '100%', width: "100%" }}>
						<Typography.Title type="secondary" level={5}>pdf文件</Typography.Title>
					</Flex>
				</>
			)}
		</>
	);
};

export default ImageViewer;
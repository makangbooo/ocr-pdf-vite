import React, {useState, useRef, useEffect} from "react";
import '@react-pdf-viewer/core/lib/styles/index.css';
import html2canvas from "html2canvas";
import axios from "axios";
import {Flex, Typography, Form, Popover, Select, Button} from "antd";

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import {API_URLS} from "../../api/api.ts";

import { DocumentMeta} from "../../types/entityTypes.ts";
import { getBase64FromBlobUrl} from "../../utils/fileTypeIdentify.tsx";
import TextArea from "antd/es/input/TextArea";
import FileRender from "./fileRender.tsx";
import {CurrentFileNew} from "../../types/entityTypesNew.ts";

// 定义矩形数据结构
type RectItem = {
	position: { x: number; y: number; width: number; height: number };
	ocrText: string;         // OCR 识别结果
	metaType: string | null; // 元数据类型
	isPopoverOpen: boolean;  // Popover 是否打开
};




interface ImageViewerProps {

	currentFile?: CurrentFileNew;
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

const FileViewer: React.FC<ImageViewerProps> = ({ currentFile, ocrText, setOcrText, isOcrEnabled, isTemplateEnabled, setCurrentFileMeta, currentFileMeta, setTemplateOcrLoading,isCustomOcrEnable }) => {
	const containerRef = useRef<HTMLDivElement>(null);

	// OCR绘制矩形
	const [isOCRDrawing, setIsOCRDrawing] = useState(false); // OCR绘制状态
	const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 }); //鼠标点击起始位置
	const [rect, setRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null); // 矩形位置
	const [isOCRing, setIsOCRing] = useState(false); // OCR请求状态

	const [enableDrawing, setEnableDrawing] = useState(false); // 自定义模版，用户编辑表单时，取消鼠标事件
	const [form] = Form.useForm();

	// 模版ocr识别，存储矩形位置
	const [rectArr, setRectArr] = useState<RectItem[]>([]);
	// const [rectArr, setRectArr]= useState<{ x: number; y: number; width: number; height: number }[]>([]); // 矩形位置

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
		if (!isOcrEnabled) {
			// 关闭 OCR 模式时重置矩形和结果
			setRect(null);
			setOcrText("");
			setIsOCRDrawing(false);
			setEnableDrawing(true);
		} else {
			//todo
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
			setRectArr([]);
			setEnableDrawing(true);
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
		if ((!isOcrEnabled && !isCustomOcrEnable) || !containerRef.current || !enableDrawing) return;
		// todo  if (isCustomOcrEnable && enableDrawing) return
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
		if (!isOCRDrawing || !containerRef.current || !enableDrawing) return;
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
		if (!isOCRDrawing || !rect || !containerRef.current || !enableDrawing) return;
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
			const requestData = await getBase64FromBlobUrl(imgData);
			const url = API_URLS.IMAGE_BASE64_OCR;
			const data = {
				base64: requestData,
				options: { "data.format": "text" },
			};
			const response = await axios.post(url, data);
			setOcrText(response.data.data || "未识别到文字");
			await navigator.clipboard.writeText(response.data.data);
			setIsOCRing(false);

			if (isCustomOcrEnable) {
				form.setFieldsValue({ CustomOcrResult: response.data.data || "未识别到文字" });
				setRectArr([
					...rectArr,
					{
						position: { ...rect },
						ocrText: response.data.data,
						metaType: null,
						isPopoverOpen: true, // 绘制完成后自动打开 Popover
					},
				]);
				setRect(null);
				setEnableDrawing(false); // 禁用绘制，直到 Popover 关闭
			}
		} catch (error) {
			console.error("OCR 处理失败:", error);
			setOcrText("OCR 处理失败");
			setIsOCRing(false);
		}
	};

	return (
		<>
		{currentFile ? (
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
					cursor: isOcrEnabled ? "crosshair" : "default", // 提示用户可以绘制
				}}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}>
					<FileRender currentFile={currentFile}/>
				{
					// 画框识别
					(rect && isOcrEnabled) && (
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
					)
				}
				{isCustomOcrEnable && (
					<>
						{rectArr.map((item, index) => (
							<RectPopover
								key={index}
								rectItem={item}
								index={index}
								setRectArr={setRectArr}
								setIsOCRDrawing={setIsOCRDrawing}
								setEnableDrawing={setEnableDrawing}
							/>
						))}
						{rect && (
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
						)}
					</>
				)}
				{
					(isTemplateEnabled && template) && template.map((item,index) => {
						return (
							// todo 添加Popover
							<Popover content={
								() => {
									const type = item.type
									if (currentFileMeta) {
										if (type === "redHeader") {
											return currentFileMeta.redHeader
										} else if (type === "fileNumber") {
											return currentFileMeta.fileNumber
										} else if (type === "fileTitle") {
											return currentFileMeta.fileTitle
										} else if (type === "content") {
											return currentFileMeta.content
										}
									} else return ""
								}
							} title={<span>ocr识别结果</span>}>
								<div
									key={index}
									style={{
										position: "absolute",
										left: item.position.x,
										top: item.position.y,
										width: item.position.width,
										height: item.position.height,
										border: "2px dashed red",
										backgroundColor: "rgba(255, 0, 0, 0.1)",
									}}
								/>
							</Popover>
						)
					})
				}

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






const RectPopover: React.FC<{
	rectItem: RectItem;
	index: number;
	setRectArr: React.Dispatch<React.SetStateAction<RectItem[]>>;
	setIsOCRDrawing: (isOCRDrawing: boolean) => void;
	setEnableDrawing: (enableDrawing: boolean) => void;
}> = ({ rectItem, index, setRectArr, setEnableDrawing }) => {
	const [form] = Form.useForm();

	const handleMetaTypeChange = (value: string) => {
		setRectArr((prev) =>
			prev.map((item, i) => (i === index ? { ...item, metaType: value } : item))
		);
	};

	const handleClosePopover = () => {
		setRectArr((prev) =>
			prev.map((item, i) =>
				i === index ? { ...item, isPopoverOpen: false } : item
			)
		);
		setEnableDrawing(true); // 关闭后允许继续绘制
	};

	return (
		<Popover
			placement="rightTop"
			title="OCR 识别结果"
			open={rectItem.isPopoverOpen}
			content={
				<Form
					layout="vertical"
					form={form}
					initialValues={{ CustomOcrResult: rectItem.ocrText }}
				>
					<Form.Item label="元数据类别" name="MetaType">
						<Select
							options={[
								{ value: "redHeader", label: "红头" },
								{ value: "fileNumber", label: "文件号" },
								{ value: "fileTitle", label: "主题" },
								{ value: "documentDate", label: "发文单位" },
								{ value: "fileDate", label: "发文日期" },
								{ value: "content", label: "正文" },
							]}
							onChange={handleMetaTypeChange}
						/>
					</Form.Item>
					<Form.Item label="识别结果" name="CustomOcrResult">
						<TextArea rows={4} />
					</Form.Item>
					<Button onClick={handleClosePopover} style={{ marginTop: "10px" }}>
						关闭
					</Button>
				</Form>
			}
		>
			<div
				style={{
					position: "absolute",
					left: `${rectItem.position.x}px`,
					top: `${rectItem.position.y}px`,
					width: `${rectItem.position.width}px`,
					height: `${rectItem.position.height}px`,
					border: "2px dashed red",
					backgroundColor: "rgba(255, 0, 0, 0.1)",
				}}
			/>
		</Popover>
	);
};
export default FileViewer;
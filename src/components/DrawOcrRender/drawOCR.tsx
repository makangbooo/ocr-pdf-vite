import React from 'react';
import {Form, Popover, Select} from "antd";
import TextArea from "antd/es/input/TextArea";
import {DocumentMeta} from "../../types/entityTypes.ts";

interface DrawOCRType {
	rect: { x: number; y: number; width: number; height: number } | null
	isCustomOcrEnable: boolean
	isOCRDrawing: boolean
	isSelecting: boolean
	setCurrentFileMeta(meta: DocumentMeta): void;
	currentFileMeta: DocumentMeta | null;
	isOcrEnabled: boolean;
	ocrText: string;
	isOCRing: boolean;
	isTemplateEnabled: boolean;
	template: Array<{ type: string, position: { x: string, y: string, width: string, height: string } }>
	setIsSelecting(isSelecting: boolean): void;
}



const DrawOCR: React.FC<DrawOCRType> = (
	{
		rect,isCustomOcrEnable,isOCRDrawing,isSelecting,setCurrentFileMeta,currentFileMeta,isOcrEnabled,ocrText,isOCRing,isTemplateEnabled,template,setIsSelecting
	}
) => {
	const [form] = Form.useForm();

	return (
		<>

			{
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
			{
				(rect && isCustomOcrEnable )&& (
					<Popover
						title={"ocr识别结果"}
						open={!isOCRDrawing}
						style={{userSelect: "text",}}
						onOpenChange={()=>{
							setIsSelecting(!isSelecting)
							// 初始化表单
							// form.setFieldsValue({MetaType: "redHeader", CustomOcrResult: "等待识别..."})
						}}
						content={
							<>
								<Form layout="vertical" form={form}>
									<Form.Item
										label="元数据类别"
										name="MetaType"
										hasFeedback
										rules={[{ required: true, message: "请选择输入格式" }]}
									>
										<Select
											defaultValue="redHeader"
											// onChange={handleChange}
											options={[
												{ value: 'redHeader', label: '红头' },
												{ value: 'fileNumber', label: '文件号' },
												{ value: 'fileTitle', label: '主题' },
												{ value: 'documentDate', label: '发文单位'},
												{ value: 'fileDate', label: '发文日期'},
												{ value: 'content', label: '正文'},
											]}
											onSelect={
												(value) => {
													// 更新元数据
													setCurrentFileMeta({...currentFileMeta, [value]: form.getFieldValue("CustomOcrResult")})
												}}

										/>
									</Form.Item>
									<Form.Item
										label="识别结果"
										name="CustomOcrResult"
										hasFeedback
										rules={[{ required: true, message: "请选择输入格式" }]}
									>
										<TextArea rows={4} defaultValue={"等待识别..."}/>
									</Form.Item>
								</Form>

							</>
						}
					>
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
		</>
	)
}

export default DrawOCR;
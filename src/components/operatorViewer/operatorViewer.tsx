import React, {useEffect} from "react";
import '@react-pdf-viewer/core/lib/styles/index.css';

import {Button, Card, Col, DatePicker, Flex, Form, FormInstance, Input, List, Row, Tabs, Typography} from "antd";
const LItem = List.Item;
const FItem = Form.Item;

import {CurrentFile, DocumentMeta} from "../entityTypes.ts";
import TextArea from "antd/es/input/TextArea";

interface OperatorViewerProps {
	currentFile?: CurrentFile
	isOcrEnabled: boolean;
	ocrText: string;
	isFullOcrEnabled: boolean;
	fullText: string;
	currentFileMeta: DocumentMeta | null;
}


const OperatorViewer: React.FC<OperatorViewerProps> = (
	{
		// isOcrEnabled,
		// isFullOcrEnabled,
		// currentFile,
		fullText,
		currentFileMeta,
		// ocrText,
	}) => {

	// 遍历ocrText，将每一行数据存入data数组
	const data = fullText.split('\n');
	const formRef = React.createRef<FormInstance>();


	// 监听currentFileMeta，如果有变化，则更新表单数据
	useEffect(() => {
		if (formRef.current) {
			formRef.current.setFieldsValue({
				redHeader: currentFileMeta?.redHeader,
				fileNumber: currentFileMeta?.fileNumber,
				fileTitle: currentFileMeta?.fileTitle,
				// clumn4: currentFileMeta?.documentDate,
				// clumn5: currentFileMeta?.content,
			});
		}
	}, [currentFileMeta]);


	return (
		<>
			{
				<>
				<Tabs
					defaultActiveKey="1"
					items={[
						{
							label: '全文识别结果',
							key: '1',
							children:
								data.map((item, index) => (
									<Flex key={index} style={{marginBottom: '8px', alignItems: 'center'}}>
										<Typography.Text copyable>
											&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
											{item}
										</Typography.Text>
									</Flex>
								))

						},
						{
							label: '文档分行',
							key: '2',
							children:
								<List
									header={<div>各行数据项</div>}
									bordered
									dataSource={data}
									renderItem={(item,index) => (
										<LItem>
											<Typography.Text
												mark
												style={{flexShrink: 0,marginRight: '8px'}}

											>
												第{index+1}行:
											</Typography.Text>
											<Input placeholder="Basic usage" defaultValue={item}/>
										</LItem>
									)}
								/>
							,
						},
						{
							label: '数据项编辑',
							key: '3',
							children:
								<Form
									ref={formRef}
									layout="vertical"
									wrapperCol={{span: 20}}
									initialValues={
										{
											redHeader: currentFileMeta?.redHeader,
											fileNumber: currentFileMeta?.fileNumber,
											fileTitle: currentFileMeta?.fileTitle,
											// clumn4: currentFileMeta.documentDate,
											content: currentFileMeta?.content,
										}
									}
								>
									<Card title={'档案基本信息'} styles={{
										header: {
											fontSize: "16px",
											background: "#e9f6ff",
										},
									}}>
									<Row gutter={5}>
										<Col span={8}>
											<FItem label='红头' name='redHeader' hasFeedback rules={[{required: true}]}>
												<Input />
											</FItem>
										</Col>
										<Col span={8}>
											<FItem label='文件号' name='fileNumber' hasFeedback rules={[{required: true}]}>
												<Input />
											</FItem>
										</Col>
										<Col span={8}>
											<FItem label='主题' name='fileTitle' hasFeedback rules={[{required: true}]}>
												<Input />
											</FItem>
										</Col>
										<Col span={8}>
											<FItem label='发文单位' name='clumn4' hasFeedback rules={[{required: true}]}>
												<Input />
											</FItem>
										</Col>
										<Col span={8}>
											<FItem label='发文日期' name='clumn5' hasFeedback rules={[{required: true}]}>
												<DatePicker style={{ width: '100%' }} />
											</FItem>
										</Col>
										<Col span={24}>
											<FItem label='正文' name='content' hasFeedback>
												<TextArea rows={8}/>
											</FItem>
										</Col>
									</Row>
										<Button type="primary" htmlType="submit">
											档案上传
										</Button>
									</Card>
								</Form>
							,

						},
					]}
				/>
				</>

			}
		</>
	)
}

export default OperatorViewer;
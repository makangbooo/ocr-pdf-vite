import React from "react";
import '@react-pdf-viewer/core/lib/styles/index.css';

import {Button, Card, Col, Flex, Form, Input, List, Row, Tabs, Typography} from "antd";
const LItem = List.Item;
const FItem = Form.Item;

import { CurrentFile } from "../entityTypes.ts";

interface OperatorViewerProps {
	currentFile: CurrentFile
	isOcrEnabled: boolean;
	ocrText: string;
	isFullOcrEnabled: boolean;
	fullText: string;
}


const OperatorViewer: React.FC<OperatorViewerProps> = (
	{
		// isOcrEnabled,
		// isFullOcrEnabled,
		currentFile,
		fullText,
		// ocrText,
	}) => {

	// 遍历ocrText，将每一行数据存入data数组
	const data = fullText.split('\n');


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
								// isOcrEnabled ?
								<Flex justify="center" align="center" style={{ height: '100%' }}>
									<Typography.Text copyable>{fullText}</Typography.Text>
								</Flex>
						// :
								// <Flex justify="center" align="center" style={{ height: '100%' }}>
								// 	<Typography.Title type="secondary" level={5} style={{ whiteSpace: 'nowrap' }}>
								// 		操作界面
								// 	</Typography.Title>
								// </Flex>
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
								<Form>
									<Card title={'档案基本信息'} styles={{
										header: {
											fontSize: "16px",
											background: "#e9f6ff",
										},
									}}>
									<Row gutter={5}>
										<Col span={8}>
											<FItem label='红头' name='clumn1' hasFeedback>
												<Input />
											</FItem>
										</Col>
										<Col span={8}>
											<FItem label='文件号' name='clumn2' hasFeedback>
												<Input />
											</FItem>
										</Col>
										<Col span={8}>
											<FItem label='主题' name='clumn3' hasFeedback>
												<Input />
											</FItem>
										</Col>
										<Col span={8}>
											<FItem label='发文单位' name='clumn4' hasFeedback>
												<Input />
											</FItem>
										</Col>
										<Col span={8}>
											<FItem label='发文日期' name='clumn5' hasFeedback>
												<Input />
											</FItem>
										</Col>
										<Col span={8}>
											<FItem label='正文' name='clumn6' hasFeedback>
												<Input />
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
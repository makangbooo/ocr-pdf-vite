import React from "react";
import '@react-pdf-viewer/core/lib/styles/index.css';

import {Flex, Input, List, Tabs, Typography} from "antd";
const Item = List.Item;

const OperatorViewer: React.FC<{ ocrText: string,isOcrEnabled: boolean }> = ({ ocrText, isOcrEnabled }) => {

	console.log("ocrText",ocrText)
	// 遍历ocrText，将每一行数据存入data数组
	const data = ocrText.split('\n');


	return (
		<>
			{
				<>
				<Tabs
					defaultActiveKey="1"
					items={[
						{
							label: 'ocr识别结果',
							key: '1',
							children: isOcrEnabled ?
								<Flex justify="center" align="center" style={{ height: '100%' }}>
									<Typography.Text copyable>{ocrText}</Typography.Text>
								</Flex>:
								<Flex justify="center" align="center" style={{ height: '100%' }}>
									<Typography.Title type="secondary" level={5} style={{ whiteSpace: 'nowrap' }}>
										操作界面
									</Typography.Title>
								</Flex>
						},
						{
							label: '数据项编辑',
							key: '2',
							children:
								<List
									header={<div>各行数据项</div>}
									bordered
									dataSource={data}
									renderItem={(item,index) => (
										<Item>
											<Typography.Text
												mark
												style={{flexShrink: 0,marginRight: '8px'}}

											>
												第{index+1}行:
											</Typography.Text>
											<Input placeholder="Basic usage" defaultValue={item}/>
										</Item>
									)}
								/>
							,
						},
						{
							label: '上传档案系统',
							key: '3',
							children: 'Tab 3',
							disabled: true,//todo 用户上传文档后开放
						},
					]}
				/>
				</>

			}
		</>
	)
}

export default OperatorViewer;
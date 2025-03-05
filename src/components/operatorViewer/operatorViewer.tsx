import React from "react";
import '@react-pdf-viewer/core/lib/styles/index.css';

import {Flex, Input, List, Segmented, Tabs, Typography} from "antd";
import {AppstoreOutlined, BarsOutlined} from "@ant-design/icons";
const Item = List.Item;

const OperatorViewer: React.FC<{ ocrText: string,isOcrEnabled: boolean }> = ({ ocrText, isOcrEnabled }) => {

	const [tabOption, setTabOption] = React.useState('ocrPage');

	console.log("ocrText",ocrText)
	// 遍历ocrText，将每一行数据存入data数组
	const data = ocrText.split('\n');


	return (
		<>
			{
				<>
					<Segmented
						options={[
							{ label: 'ocr识别结果', value: 'ocrPage', icon: <BarsOutlined /> },
							{ label: '数据项编辑', value: 'dataEditPage', icon: <AppstoreOutlined /> },
							{ label: '上传档案系统', value: 'fileSystemPage', icon: <AppstoreOutlined /> },
						]}
						onChange={(value) => {
							setTabOption(value);
						}}
						block
					/>
					{tabOption === 'ocrPage' &&
					  <>
						  {isOcrEnabled ?
                        <Flex justify="center" align="center" style={{ height: '100%' }}>
                          <Typography.Text copyable>{ocrText}</Typography.Text>
                        </Flex>:
                        <Flex justify="center" align="center" style={{ height: '100%' }}>
                          <Typography.Title type="secondary" level={5} style={{ whiteSpace: 'nowrap' }}>
                            操作界面
                          </Typography.Title>
                        </Flex>}
					  </>
					}
					{tabOption === 'dataEditPage' &&
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
					}
					{tabOption === 'fileSystemPage' &&
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
					}

				</>

			}
		</>
	)
}

export default OperatorViewer;
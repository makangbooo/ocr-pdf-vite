import React, {JSX, useEffect, useState} from "react";
import {Button, Col, message, Row} from "antd";  // Removed Form since it's not used
import { CurrentFileNew } from "../../types/entityTypesNew.ts";
import axios from "axios";  // Removed unused FileItemNew

interface SubHeaderFileType {
	currentFile?: CurrentFileNew;
	setCurrentFile: (currentFile: CurrentFileNew) => void;

	currentHeaderButton: string;
}

const SubHeader: React.FC<SubHeaderFileType> = ({ currentFile, currentHeaderButton, setCurrentFile }) => {
	// Use useState to manage RowList since it needs to be reactive
	const [RowList, setRowList] = useState<JSX.Element | null>(null);
	const curretnFileOri = currentFile;


	// 转化为双层pdf
	const prossImage = async (requestType : string): Promise<void> => {
		// 1. 输入验证
		if (!currentFile) {
			message.error('No file selected.')
			return;
		}

		try {
			const formData = new FormData();
			formData.append('file', currentFile.file);

			// 4. 发送请求
			const response = await axios.post(
				`${process.env.VITE_API_BASE_URL}/ImageProcess/${requestType}`,
				formData
			);
			const newFile = {
				name: currentFile.name,
				type: currentFile.type,
				file: response.data.file,
				data: response.data.file,
				path: currentFile.path,
			};
			// 唯一定义currentFile
			setCurrentFile(newFile);

			console.log("response",response)
		} catch (error) {
			message.error(`PDF conversion failed: ${error}`);
			throw error; // 或根据需求处理错误
		}
	};

	useEffect(() => {
		let newRowList: JSX.Element | null = null;

		switch (currentHeaderButton) {
			case "ImageOperation":
				newRowList = (
					<Row justify="center" align="middle" >
						<Col span={2}>
							<Button
								block
								type="primary"
								size="small"

								onClick={()=>
									{
										if (curretnFileOri) setCurrentFile(curretnFileOri)
									}
								}
							>
								原图
							</Button>
						</Col>
						<Col span={3}>
							<Button
								block
								type="default"
								size="small"
								style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)' }}
								onClick={()=>prossImage("Perspective")}
							>
								透视校正
							</Button>
						</Col>
						<Col span={3} >
							<Button
								block
								type="default"
								size="small"
								style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)' }}
								onClick={()=>prossImage("Noise")}
							>
								降噪
							</Button>
						</Col>
						<Col span={3} >
							<Button
								block
								type="default"
								size="small"
								style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)' }}
								onClick={()=>prossImage("Balance")}
							>
								白平衡
							</Button>
						</Col>
						<Col span={3}>
							<Button
								block
								type="default"
								size="small"
								style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)' }}
								onClick={()=>prossImage("Whitening")}
							>
								边缘抹白
							</Button>
						</Col>
						<Col span={3} >
							<Button
								block
								type="default"
								size="small"
								style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)' }}
								onClick={()=>prossImage("Binary")}
							>
								锐化
							</Button>
						</Col>
					</Row>
				);
				break;
			case "识别结果保存":
				// Add implementation for saving recognition results
				newRowList = null;  // or add appropriate JSX
				break;
			case "档案上传":
				// Add implementation for file upload
				newRowList = null;  // or add appropriate JSX
				break;
			default:
				newRowList = null;
				break;
		}

		setRowList(newRowList);
	}, [currentHeaderButton]);

	return <>{RowList}</>;
};

export default SubHeader;
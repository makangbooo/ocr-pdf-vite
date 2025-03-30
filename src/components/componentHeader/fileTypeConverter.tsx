import React, { useState } from "react";
import {Button, Col, Form, Input, message, Modal, Progress, Row, Select, Spin} from "antd";
import {FileItemNew} from "../../types/entityTypesNew.ts";
import { getBase64ByPath_Electron, getFileType} from "../../utils/fileTypeIdentify.tsx";
import axios from "axios";

interface FileTypeConverter {
	fileTypeConvertModal: boolean;
	setFileTypeConvertModal: (fileTypeConvertModal: boolean) => void;
}

const FileTypeConverter: React.FC<FileTypeConverter> = ({
															fileTypeConvertModal,
															setFileTypeConvertModal
														}) => {
	const [form] = Form.useForm();
	const [inputTypeValue, setInputTypeValue] = useState<string|undefined>(undefined); // 存储选中的文件夹路径
	const [outputTypeValue, setOutputTypeValue] = useState<string|undefined>(undefined); // 存储选中的文件夹路径

	const [inputFolderPath, setInputFolderPath] = useState<string>(""); // 存储选中的文件夹路径
	const [inputFileCount, setInputFileCount] = useState<number>();
	const [inputFiles, setInputFiles] = useState<FileItemNew | null>(null);

	const [modalLoading, setModalLoading] = useState<boolean>(false);
	const [progress, setProgress] = useState<number>(0); // 进度状态


	const inputType = [
		{ label: "图片", value: "image" },
		{ label: "PDF", value: "pdf" },
		{ label: "OFD", value: "ofd" },
	];

	const outputType = [
		{ label: "图片", value: "image" },
		{ label: "双层PDF", value: "pdf" },
		{ label: "双层OFD", value: "ofd" },
		{ label: "文本格式（txt）", value: "txt" },
	];

	// 处理输入路径选择
	const onInputPathSelect = async () => {
		try {
			if (!inputTypeValue) return
			// 调用 Electron 的 selectFolder 方法
			const selectFolder:FileItemNew = await (window as any).electronAPI.selectFolder();
			const result = filterFileItemNew(selectFolder, inputTypeValue);
			const selectFolderOnlyType = result.filteredItem
			// 更新selectFolderOnlyType的name为path中最后一个/或\后的字符串
			if (selectFolderOnlyType) {
				selectFolderOnlyType.name = selectFolderOnlyType.path.split(/[\\/]/).pop() as string;
			}
			const count = result.count
			if (count === 0) {
				message.error("所选文件夹中没有符合条件的文件");
				form.setFieldsValue({ InputPath: "" });
				return
			}

			console.log("inputTypeValue", inputTypeValue);
			console.log("selectFolder", selectFolder);
			console.log("selectFolderOnlyType", selectFolderOnlyType);
			console.log("count", count);

			const folderPath = selectFolder.path;
			// console.log("folderPath", folderPath);
			if (folderPath) {
				setInputFolderPath(folderPath);
				setInputFileCount(count)
				setInputFiles(selectFolderOnlyType)
				form.setFieldsValue({ InputPath: folderPath });
			} else {
				console.log("用户取消了选择");
			}
		} catch (error) {
			console.error("选择文件夹时出错:", error);
		}
	};

	// 处理输出路径选择
	const onOutputPathSelect = async () => {
		try {
			const selectFolder:FileItemNew = await (window as any).electronAPI.selectFolder();
			const folderPath = selectFolder.path
			if (folderPath) {
				form.setFieldsValue({ Outpath: folderPath });
			}
		} catch (error) {
			console.error("选择输出文件夹时出错:", error);
		}
	};

	// todo 提交表单时的处理，加loading
	const handleOk = () => {
		form.validateFields()
			.then(async (values) => {
				setModalLoading(true);
				const outpath: string = values.Outpath // electron下载的根地址
				let processedCount = 0; // 已处理文件计数

				// 递归处理文件的函数
				const processFileItem = async (fileItem: FileItemNew, relativePath: string = '') => {
					// 如果是目录，递归处理子文件
					if (fileItem.isDirectory && fileItem.children) {
						for (const child of fileItem.children) {
							await processFileItem(child, `${relativePath}${fileItem.name}/`);
						}
						return;
					}

					// 处理单个文件
					try {
						const currentFile = await getBase64ByPath_Electron(fileItem)

						console.log("currentFile", currentFile);

						// 构造请求数据
						const fileData = {
							name: currentFile?.name,
							file: currentFile?.data,
						};
						// 将fileData存入数组
						const fileDataArray = []
						fileDataArray.push(fileData)

						// 发送到后端转换
						// 4. 发送请求
						let url;
						if (inputTypeValue === "image" && outputTypeValue === "pdf") {
							url = "imageToPDF";
						} else if (inputTypeValue === "image" && outputTypeValue === "ofd") {
							url = "imageToOFD";
						} else if (inputTypeValue === "pdf" && outputTypeValue === "ofd") {
							url = "pdfToOFD";
						} else if (inputTypeValue === "pdf" && outputTypeValue === "pdf") {
							url = "pdf2pdf";
						} else if (inputTypeValue === "ofd" && outputTypeValue === "ofd") {
							url = "ofd2ofd";
						} else{
							// 报错
							message.error("不支持的转换类型");
							return
						}
						const response = await axios.post(`${process.env.VITE_API_BASE_URL}/FileTypeConvert/${url}`, fileDataArray);

						// 获取转换后的下载链接
						const downloadUrl = `${process.env.VITE_API_BASE_URL}/${response.data.name}`

						// 构造保存路径，保留原有文件树结构
						const savePath = `${outpath}/${relativePath}${fileItem.name}.${outputTypeValue}`;
						console.log("savePath", savePath);
						// 使用 Electron 的 ipcRenderer 下载文件
						await (window as any).electronAPI.downloadFileUrlSavePath(downloadUrl, savePath);

						// 更新进度
						processedCount++;
						setProgress(Math.round((processedCount / (inputFileCount || 1)) * 100));
					} catch (error) {
						console.error(`处理文件 ${fileItem.name} 时出错:`, error);
					}
				};
				if (!inputFiles) return
				// 开始处理文件树
				await processFileItem(inputFiles);
				setFileTypeConvertModal(false);

				// 处理完成后，重置表单和状态
				form.resetFields();
				setInputFolderPath("");
				setInputFileCount(0);
				setInputFiles(null);
				setInputTypeValue(undefined);
				setOutputTypeValue(undefined);
				setProgress(0);
				setModalLoading(false);
			})
			.catch((error) => {
				console.error("表单验证失败:", error);
			});
	};

	// 递归遍历FileItemNew文件树，只保留FileItemNew中type为inputTypeValue的文件，并统计符合条件的文件数量
	const filterFileItemNew = (fileItemNew: FileItemNew, inputTypeValue: string): { filteredItem: FileItemNew | null, count: number } => {
		const fileType = getFileType(fileItemNew.name);
		fileItemNew.type = fileType;
		let count = 0;

		if (fileType === inputTypeValue) {
			count = 1;
			return { filteredItem: { ...fileItemNew }, count };
		} else if (fileItemNew.children) {
			const filteredChildren = fileItemNew.children
				.map(child => filterFileItemNew(child, inputTypeValue))
				.filter(child => child.filteredItem !== null);

			count = filteredChildren.reduce((acc, child) => acc + child.count, 0);

			if (filteredChildren.length > 0) {
				return {
					filteredItem: {
						...fileItemNew,
						children: filteredChildren.map(child => child.filteredItem as FileItemNew),
					},
					count,
				};
			}
		}
		return { filteredItem: null, count };
	};

	return (
		<Modal
			title="批量转换"
			open={fileTypeConvertModal}
			onOk={handleOk}
			onCancel={() => setFileTypeConvertModal(false)}
			okText="开始转换"
			cancelText="取消"
			wrapClassName="vertical-center-modal"
			width={900}
			mask={true}
			maskClosable={false}
			closable={false}
			footer={[
				<Button key="back" type={'primary'} disabled={modalLoading} onClick={() => setFileTypeConvertModal(false)}>
					取消
				</Button>,
				<Button key="back" type={'primary'} disabled={modalLoading} onClick={handleOk}>
					开始转换
				</Button>,
				]}
		>
			<Spin spinning={modalLoading} delay={500}>
			<Form
				form={form}
				layout="vertical"
				wrapperCol={{ span: 20 }}
				initialValues={{}}
			>
				<Row gutter={24}>
					<Col span={12}>
						<Form.Item
							label="输入格式"
							name="InputType"
							hasFeedback
							rules={[{ required: true, message: "请选择输入格式" }]}
						>
							<Select placeholder="请选择输入格式" options={inputType} onChange={value => setInputTypeValue(value)}/>
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item
							label="输出格式"
							name="OutputType"
							hasFeedback
							rules={[
								{ required: true, message: "请选择输出格式" },
								{
									validator: (_, value) => {
										const inputTypeValue = form.getFieldValue("InputType");
										if (inputTypeValue === "image" && value === "image") {
											return Promise.reject(
												new Error("不支持图片到图片的转换")
											);
										}
										if (inputTypeValue === "pdf" && value === "image") {
											return Promise.reject(
												new Error("不支持pdf到图片的转换")
											);
										}
										if (inputTypeValue === "pdf" && value === "pdf") {
											return Promise.reject(
												new Error("不支持pdf到pdf的转换")
											);
										}
										return Promise.resolve();
									},
								},
							]}
						>
							<Select placeholder="请选择输出格式" options={outputType} onChange={value => setOutputTypeValue(value)}/>
						</Form.Item>
					</Col>
					{inputTypeValue &&
						<Col span={12}>
							<Form.Item
								label={inputFileCount ? <>输入路径<span style={{color: "blue", fontSize: "small"}}>（已选中{inputFileCount}个{inputTypeValue}文件）</span></> : "输入路径"}

								name="InputPath"
								hasFeedback
								rules={[{ required: true, message: "请选择输入路径" }]}
							>
								<Input
									placeholder="点击选择输入路径"
									readOnly
									onClick={onInputPathSelect}
									value={inputFolderPath}
								/>
							</Form.Item>
						</Col>
					}
					{outputTypeValue &&
					  <>
						  {!inputTypeValue && <Col span={12}></Col>}
						<Col span={12}>
							<Form.Item
								label="输出路径"
								name="Outpath"
								hasFeedback
								rules={[{ required: true, message: "请选择输出路径" }]}
							>
								<Input
									placeholder="点击选择输出路径"
									readOnly
									onClick={onOutputPathSelect}
								/>
							</Form.Item>
						</Col>
                      </>
					}
				</Row>
				{modalLoading && <Progress percent={progress} />}
			</Form>
			</Spin>
		</Modal>
	);
};

export default FileTypeConverter;
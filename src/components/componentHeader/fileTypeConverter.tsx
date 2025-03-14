import React, { useState } from "react";
import { Col, Form, Input, Modal, Row, Select } from "antd";

interface FileTypeConverter {
	fileTypeConvertModal: boolean;
	setFileTypeConvertModal: (fileTypeConvertModal: boolean) => void;
}

const FileTypeConverter: React.FC<FileTypeConverter> = ({
															fileTypeConvertModal,
															setFileTypeConvertModal
														}) => {
	const [form] = Form.useForm();
	const [inputFolderPath, setInputFolderPath] = useState<string>(""); // 存储选中的文件夹路径

	const inputType = [
		{ label: "图片", value: "image" },
		{ label: "PDF", value: "PDF" },
		{ label: "OFD", value: "OFD" },
	];

	const outputType = [
		{ label: "图片", value: "image" },
		{ label: "双层PDF", value: "PDF" },
		{ label: "双层OFD", value: "OFD" },
	];

	// 处理输入路径选择
	const onInputPathSelect = async () => {
		try {
			// 调用 Electron 的 openFolder 方法
			const folderPath = await window.electronAPI.openFolder();
			console.log("folderPath", folderPath);
			if (folderPath) {
				setInputFolderPath(folderPath);
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
			const folderPath = await window.electronAPI.openFolder();
			if (folderPath) {
				form.setFieldsValue({ Outpath: folderPath });
			}
		} catch (error) {
			console.error("选择输出文件夹时出错:", error);
		}
	};

	// 提交表单时的处理
	const handleOk = () => {
		form
			.validateFields()
			.then((values) => {
				console.log("表单值:", values);
				setFileTypeConvertModal(false);
			})
			.catch((error) => {
				console.error("表单验证失败:", error);
			});
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
		>
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
							<Select placeholder="请选择输入格式" options={inputType} />
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
										return Promise.resolve();
									},
								},
							]}
						>
							<Select placeholder="请选择输出格式" options={outputType} />
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item
							label="输入路径"
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
				</Row>
			</Form>
		</Modal>
	);
};

export default FileTypeConverter;
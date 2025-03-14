import React  from "react";
import { Col, Form, Input, Modal, Row, Select } from "antd";

interface FileTypeConverter{
	fileTypeConvertModal: boolean;
	setFileTypeConvertModal: ( fileTypeConvertModal: boolean) => void;
}

const FileTypeConverter: React.FC<FileTypeConverter> = ({fileTypeConvertModal,setFileTypeConvertModal}) => {

	const [form] = Form.useForm();
	// const [inputFileTree, setInputFileTree] = useState<FileItem[]>(); // 输入文件树
	// const [inputFileTree, setInputFileTree] = useState<string>(); // 输出路径
	// const [outputFilePath, setOutputPath] = useState<string>(); // 输出路径


	const inputType = [
		{
			label: '图片',
			value: 'image',
		},
		{
			label: 'PDF',
			value: 'PDF',
		},
		{
			label: 'OFD',
			value: 'OFD',
		},
	]
	const outputType = [
		{
			label: '图片',
			value: 'image',
		},
		{
			label: '双层PDF',
			value: 'PDF',
		},
		{
			label: '双层OFD',
			value: 'OFD',
		},
	]

// 处理输入路径选择
	const onInputPathSelect = async ()=>{
		// console.log('开始选择文件夹');
		// const path = await window.electronAPI.openFolder();
		// if (path) {
		// 	setInputFileTree(path); // 更新状态，显示文件夹路径
		// } else {
		// 	console.log('用户取消了选择');
		// }
		// console.log('结束选择文件夹');





		// async () => {
		// try {
		// 	// 使用 showOpenFilePicker API 选择文件或文件夹
		// 	// @ts-expect-error showOpenFilePicker不支持老版本的浏览器，且只支持https以及localhost请求
		// 	// const fileHandles = await window.showOpenFilePicker({
		// 	// 	multiple: true,
		// 	// 	types: inputType.map(type => ({
		// 	// 		description: type.label,
		// 	// 		accept: {
		// 	// 			[type.value === 'image' ? 'image/*' : `application/${type.value}`]:
		// 	// 				type.value === 'image' ? ['.png', '.jpg', '.jpeg'] : `.${type.value.toLowerCase()}`
		// 	// 		}
		// 	// 	}))
		// 	// });
		//
		// 	const fileHandles = await window.showOpenFilePicker()
		//
		// 	console.log("fileHandles", fileHandles);
		//
		//
		//
		//
		//
		// 	// const fileItems: FileItem[] = await Promise.all(
		// 	// 	fileHandles.map(async (handle: any) => {
		// 	// 		const file = await handle.getFile();
		// 	// 		return {
		// 	// 			name: file.name,
		// 	// 			type: 'file' as const,
		// 	// 			path: file.path || file.name,
		// 	// 			file: file
		// 	// 		};
		// 	// 	})
		// 	// );
		// 	//
		// 	// setInputFileTree(fileItems);
		// 	// form.setFieldsValue({ InputPath: fileItems.map(item => item.path).join(', ') });
		// } catch (error) {
		// 	console.log('取消选择或发生错误:', error);
		// }
	};

// 处理输出路径选择
// 修改 onOutputPathSelect 函数
	const onOutputPathSelect = () => {
		// const input = document.createElement('input');
		// input.type = 'file';
		// input.webkitdirectory = true; // 允许选择文件夹
		//
		// input.onchange = (e: any) => {
		// 	const files = e.target.files;
		// 	if (files && files.length > 0) {
		// 		// 获取第一个文件的绝对路径并提取目录
		// 		const absolutePath = files[0].path.replace(/[^/\\]+$/, '');
		// 		setOutputPath(absolutePath);
		// 		form.setFieldsValue({ Outpath: absolutePath });
		// 	}
		// };
		//
		// input.click();
	};

	return (
		<Modal
			title="批量转换"
			open={fileTypeConvertModal}
			onOk={() => setFileTypeConvertModal(false)}
			onCancel={() => setFileTypeConvertModal(false)}
			okText="开始转换"
			cancelText="取消"
			wrapClassName={'vertical-center-modal'}
			width={900}
			mask={true}
			maskClosable={false}
		>
			<Form
				form={form}
				layout="vertical"
				wrapperCol={{span: 20}}
				initialValues={{

				}}
			>
				<Row gutter={24}>
					<Col span={12}>
						<Form.Item label='输入格式' name='InputType' hasFeedback
								   rules={[{required: true}]}>
							<Select
								placeholder="请选择输入格式"
								options={inputType}
							/>
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item label='输出格式' name='OutputType' hasFeedback
								   rules={[
									   {required: true},
									   {validator: (_, value) => {
											   const inputTypeValue = form.getFieldValue('InputType');
											   if (inputTypeValue === 'image' && value === 'image') {
												   return Promise.reject(new Error('不支持图片到图片的转换'));
											   }
											   return Promise.resolve();
										   }}
								   ]}

						>
							<Select
								placeholder="请选择输出格式"
								options={outputType}
							/>
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item label='输入路径' name='InputPath' hasFeedback rules={[{required: true}]}>
							<Input placeholder="点击选择输入路径" readOnly onClick={onInputPathSelect}/>
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item label='输出路径' name='Outpath' hasFeedback rules={[{required: true}]}>
							<Input placeholder="点击选择输出路径" readOnly onClick={onOutputPathSelect}/>
						</Form.Item>
					</Col>
				</Row>
			</Form>
		</Modal>
	)
}


export default FileTypeConverter;
"use client";
import React from 'react';
import { useState } from "react";
import axios from "axios";
import {PlusOutlined} from '@ant-design/icons';
import {Button, Divider, Image, Space, Upload} from 'antd';
import type { GetProp, UploadFile, UploadProps } from 'antd';

interface ImageItem {
	path: string;
	name: string;
}


type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

const getBase64 = (file: FileType): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = (error) => reject(error);
	});



const UploadViewer: React.FC<{ refreshPdfUrl: (url:string, imageUrlList: ImageItem[]) => void }>= ({refreshPdfUrl} ) => {

	const [previewOpen, setPreviewOpen] = useState(false);
	const [convertLoading, setConvertLoading] = useState(false);
	const [previewImage, setPreviewImage] = useState('');

	const handlePreview = async (file: UploadFile) => {
		if (!file.url && !file.preview) {
			file.preview = await getBase64(file.originFileObj as FileType);
		}

		setPreviewImage(file.url || (file.preview as string));
		setPreviewOpen(true);
	};

	const [fileList, setFileList] = useState<UploadFile[]>([]);

	const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
		setFileList(newFileList);
	}

	const onClear = () => {
		setFileList([]);
	}
	const onConvert = async () => {
		setConvertLoading(true);
		// const formData = new FormData();
		// 参数为对象数组，遍历数组，将每个对象中的name、originFileObj属性赋值给requestData
		const requestData = fileList.map((file) => {
			return {
				name: file.response.name,
				url: file.response.path
			}
		});
		try {

			const response = await axios.post("http://localhost:8080/OCRToPDF/imageToPDF", requestData);
			const pdfUrl = response.data.path;

			//遍历fileList数组，获取每个对象中的response属性，赋值给imageUrlList数组
			const imageUrlList = fileList.map((file) => {
				return {
					name: file.response.name,
					path: file.response.path
				}
			});
			refreshPdfUrl(pdfUrl,imageUrlList);
		} catch (error) {
			console.error("上传失败:", error);
		}
		setConvertLoading(false);
	}


	const uploadButton = (
		<button style={{ border: 0, background: 'none' }} type="button">
			<PlusOutlined />
			<div style={{ marginTop: 8 }}>点击上传</div>
		</button>
	);
	return(
	<>
		<Space>
			<Button onClick={onClear}>一键清空</Button>
			<Button type="primary" onClick={onConvert} loading={convertLoading}>
				开始转换
			</Button>
		</Space>
		<Divider />
		<Upload
			action="http://localhost:8080/OCRToPDF/uploadImage"
			listType="picture-card"
			fileList={fileList}
			onPreview={handlePreview}
			onChange={handleChange}
			multiple={true}
		>
			{fileList.length >= 8 ? null : uploadButton}
		</Upload>
		{previewImage && (

			<Image
				alt={previewImage}
				wrapperStyle={{ display: 'none' }}
				preview={{
					visible: previewOpen,
					onVisibleChange: (visible) => setPreviewOpen(visible),
					afterOpenChange: (visible) => !visible && setPreviewImage(''),
				}}
				src={previewImage}
			/>
		)}

	</>
	)
}
export default UploadViewer;
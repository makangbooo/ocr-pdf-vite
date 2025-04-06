import React, {useEffect} from "react";
import {Worker, Viewer} from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';


import axios from "axios";
import {CurrentFileNew} from "../../types/entityTypesNew.ts";
import {Image} from "antd";

const FileRender: React.FC<{ currentFile: CurrentFileNew;} > = ({currentFile}) => {

	const [fileUrl, setFileUrl] = React.useState("");

	// 在组件挂载时将currentFile发送给后端，将ofd文件转换成pdf文件预览
	useEffect(() => {
		if (currentFile && currentFile.file && currentFile.type === "ofd") {
			setFileUrl("");
			const formData = new FormData();
			formData.append('file', currentFile.file);

			const uploadFile = async () => {
				try {
					const response = await axios.post(`${process.env.VITE_API_BASE_URL}/FileTypeConvert/ofd2pdf`, formData);
					const fileUrl = response.data.file;
					setFileUrl(fileUrl);
				} catch (error) {
					console.error('上传文件出错:', error);
				}
			};

			uploadFile();
		} else {
			setFileUrl(currentFile.data);
		}

	}, [currentFile]);

	const defaultLayoutPluginInstance = defaultLayoutPlugin();
	return (
		<>
			{
				currentFile.type === 'image' &&
              		<Image key={currentFile.data} src={currentFile.data} style={{height:  "88vh" }} preview={false}/>
			}
			{
				currentFile.type === 'pdf' &&
				  <Worker workerUrl="/pdfjs/pdf.worker.js">
					<Viewer
					  fileUrl={currentFile.data}
					  plugins={[
						  defaultLayoutPluginInstance,
					  ]}/>
				  </Worker>
			}


			{
				currentFile.type === 'ofd' &&
			  		<>
						{
							fileUrl !== "" &&
							  <Worker workerUrl="/pdfjs/pdf.worker.js">
								<Viewer
								  fileUrl={`data:application/pdf;base64,${fileUrl}`}
								  plugins={[defaultLayoutPluginInstance,]}
								/>
							  </Worker>
						}
					</>
			}
		</>
	);
};

export default FileRender;
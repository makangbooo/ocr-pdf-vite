import React, {useEffect} from "react";
import {Worker, Viewer} from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';


import axios from "axios";
import {CurrentFileNew} from "../../types/entityTypesNew.ts";

const OfdViewer: React.FC<{ currentFile: CurrentFileNew;} > = ({currentFile}) => {

	const [fileUrl, setFileUrl] = React.useState("");

	// 在组件挂载时将currentFile发送给后端{`${process.env.VITE_API_BASE_URL}/OCRToPDF/uploadImage`}
	useEffect(() => {
		if (currentFile && currentFile.file) {
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
		}
	}, [currentFile]);

	const defaultLayoutPluginInstance = defaultLayoutPlugin();
	return (
		<>
			<div
				style={{
					position: "relative",
					width: "100%",
					height: "100%",
					overflow: "hidden" }}
			>
				<div
					style={{
						position: "relative",
						width: "100%",
						height: "100%",
						backgroundColor: "#f0f0f0",
						overflow: "hidden",
						// userSelect: isOcrEnabled ? "none" : "text",
					}}
				>
					{fileUrl!=="" &&
					  <Worker workerUrl="/pdfjs/pdf.worker.js">
						<Viewer
						  fileUrl={`data:application/pdf;base64,${fileUrl}`}
						  plugins={[defaultLayoutPluginInstance,]}
						/>
					  </Worker>
					}
				</div>
			</div>
		</>
	);
};

export default OfdViewer;
import React, {useEffect} from "react";
import {Worker, Viewer} from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';

// Import the styles provided by the react-pdf-viewer packages
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';


import { CurrentFile } from "../entityTypes.ts";
import axios from "axios";

const OfdViewer: React.FC<{ currentFile: CurrentFile;} > = ({currentFile}) => {

	const [fileUrl, setFileUrl] = React.useState("");

	// 在组件挂载时将currentFile发送给后端{`${process.env.VITE_API_BASE_URL}/OCRToPDF/uploadImage`}
	useEffect(() => {
		if (currentFile && currentFile.file) {
			const formData = new FormData();
			formData.append('file', currentFile.file);

			const uploadFile = async () => {
				try {
					const response = await axios.post(
						`${process.env.VITE_API_BASE_URL}/FileTypeConvert/ofd2pdf`,
						formData,
						{ responseType: 'blob' } // 告诉 axios 接收文件流
					);

					// 创建 URL 并设置给 Viewer
					const fileUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
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

					{fileUrl!=="" &&<Worker workerUrl="/pdfjs/pdf.worker.js">
						{/*<Worker workerUrl="https://unpkg.com/pdfjs-dist@2.15.349/build/pdf.worker.js">*/}
						{/*<Viewer fileUrl={"http://localhost:8081/df0ff600-66ee-4336-8c7b-db52c89d4edf_ofdTest.pdf"}*/}
						<Viewer fileUrl={fileUrl}
							// onDocumentLoad={onLoadSuccess}
								plugins={[
									defaultLayoutPluginInstance,
								]}/>
					</Worker>}
				</div>
			</div>
		</>
	);
};

export default OfdViewer;
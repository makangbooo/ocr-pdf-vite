import React from "react";
import {Worker, Viewer} from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';

// Import the styles provided by the react-pdf-viewer packages
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';


import { CurrentFile } from "../entityTypes.ts";

const PdfViewer: React.FC<{ 	currentFile: CurrentFile;} > = ({currentFile}) => {

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

						<Worker workerUrl="/pdfjs/pdf.worker.js">
						{/*<Worker workerUrl="https://unpkg.com/pdfjs-dist@2.15.349/build/pdf.worker.js">*/}
							<Viewer fileUrl={currentFile.data}
									// onDocumentLoad={onLoadSuccess}
									plugins={[
										defaultLayoutPluginInstance,
									]}/>
						</Worker>
					</div>
				</div>
		</>
	);
};

export default PdfViewer;
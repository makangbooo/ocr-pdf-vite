import React, {useState} from "react";
import {Button, Modal} from "antd"
import './scannerControl.css'


interface FileTypeConverter {
	scannerControlModal: boolean;
	setScannerControlModal: (scannerControlModal: boolean) => void;
}

const ScannerControl: React.FC<FileTypeConverter> = ({scannerControlModal, setScannerControlModal}) => {


	const [scanStatus, setScanStatus] = useState('')

	const handleScan = async () => {
		try {
			setScanStatus('正在启动扫描程序...');
			console.log('正在启动扫描程序...')
			const result = await (window as any).electronAPI.startScan();

			if (result.success) {
				setScanStatus('扫描程序已启动');
			} else {
				setScanStatus(`启动失败: ${result.error}`);
			}
		} catch (error) {
			setScanStatus('未知错误');
		}
	};

	return (
		<Modal
			title="扫描仪控制"
			open={scannerControlModal}
			cancelText="取消"
			wrapClassName="vertical-center-modal"
			width={900}
			mask={true}
			maskClosable={false}
			closable={false}
			footer={[
				<Button key="back" type={'primary'} onClick={() => setScannerControlModal(false)}>
					取消
				</Button>,
			]}
		>
			<div className="app">
				<header className="app-header">
					<h1>文档扫描工具</h1>
				</header>
				<main className="app-content">
					<button className="scan-button" onClick={handleScan}>
						开始扫描
					</button>
					{scanStatus && <p className="status-message">{scanStatus}</p>}
				</main>
			</div>
		</Modal>
	);
};

export default ScannerControl;
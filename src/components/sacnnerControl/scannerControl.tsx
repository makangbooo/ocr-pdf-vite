import { useState, useEffect } from 'react'
import {Button, Modal} from "antd";



interface FileTypeConverter {
	scannerControlModal: boolean;
	setScannerControlModal: (scannerControlModal: boolean) => void;
}

const ScannerControl: React.FC<FileTypeConverter> = ({scannerControlModal, setScannerControlModal}) => {
	const [status, setStatus] = useState('就绪');
	const [isProcessing, setIsProcessing] = useState(false);
	const [devices, setDevices] = useState([]);
	const [selectedDevice, setSelectedDevice] = useState('');
	const [installProgress, setInstallProgress] = useState('');

	// 改进的进度监听
	useEffect(() => {
		const progressHandler = (data: string) => {
			setInstallProgress(prev => prev + data);
		};

		(window as any).electronAPI?.onInstallProgress?.(progressHandler);

		return () => {
			// 明确移除监听器
			(window as any).electronAPI?.onInstallProgress?.(() => {});
		};
	}, []);

	// 自动继续扫描逻辑
	useEffect(() => {
		if (selectedDevice && devices.length > 0) {
			handleScan();
		}
	}, [selectedDevice]);

	const handleScan = async () => {
		setIsProcessing(true)
		setStatus('正在检测扫描仪...')
		console.log('开始扫描')

		try {
			// 检查 SANE
			const saneCheck = await (window as any).electronAPI.checkSane()
			if (!saneCheck.installed) {
				setStatus('未检测到 SANE，开始安装...')
				console.log('未检测到 SANE，开始安装...')
				await (window as any).electronAPI.installSane()
				setStatus('安装完成')
			}

			// 检查扫描仪
			const scannerCheck = await (window as any).electronAPI.checkScanner()
			if (!scannerCheck.found) {
				setStatus('未检测到扫描仪，请检查连接')
				return
			}

			// 选择设备逻辑保持不变...
			// 完善设备选择逻辑
			if (scannerCheck.devices.length > 1 && !selectedDevice) {
				setDevices(scannerCheck.devices);
				setStatus('请选择扫描仪');
				return;
			}

			//  启动 XSANE 明确传递设备参数
			await (window as any).electronAPI.launchXsane(
				selectedDevice || scannerCheck.devices[0]
			);

			setStatus('就绪')
		} catch (error) {
			setStatus(`操作失败`)
			console.log('操作失败', error)
		} finally {
			setIsProcessing(false)
		}
	}

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
		<div className="scanner-container">
			<div className="status-display">
				<p>状态: {status}</p>
				{installProgress && (
					<pre className="install-progress">
            {installProgress}
          </pre>
				)}
				{devices.length > 0 && (
					<div className="device-selector">
						<select
							value={selectedDevice}
							onChange={e => setSelectedDevice(e.target.value)}
						>
							<option value="">请选择扫描仪</option>
							{devices.map(device => (
								<option key={device} value={device}>
									{device}
								</option>
							))}
						</select>
					</div>
				)}
			</div>
			<button
				onClick={handleScan}
				disabled={isProcessing || (devices.length > 0 && !selectedDevice)}
			>
				{isProcessing ? '处理中...' : '扫描'}
			</button>
		</div>
		</Modal>
	);
};

export default ScannerControl;
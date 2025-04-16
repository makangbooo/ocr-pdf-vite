const { contextBridge, ipcRenderer } = require('electron');


// 预加载脚本（preload.js）用于在渲染进程和主进程之间建立桥梁，将主进程的功能安全地暴露给 React。
contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'), // 暴露打开文件夹的方法
  syncFolder: (folderPath) => ipcRenderer.invoke('sync-folder',folderPath), // 暴露打开文件夹的方法
  readFile: (path) => ipcRenderer.invoke('read-file',path), // 暴露打开文件夹的方法
  downloadFile: (url, fileName) => ipcRenderer.invoke('download-file',url,fileName), // 下载组件
  downloadFileUrlSavePath: (downloadUrl, savePath) => ipcRenderer.invoke('download-file-url-save',downloadUrl,savePath), // 下载组件

  // startScan: () => ipcRenderer.invoke('start-scan'), // 仅作为windows

  checkSane: () => ipcRenderer.invoke('scan:check-sane'),
  installSane: () => ipcRenderer.invoke('scan:install-sane'),
  checkScanner: () => ipcRenderer.invoke('scan:check-scanner'),
  launchXsane: (device) => ipcRenderer.invoke('scan:launch-xsane', device),

  // 接收实时进度更新
  onInstallProgress: (callback) => {
    ipcRenderer.on('scan:install-progress', (event, data) => callback(data))
  }

});





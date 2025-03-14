const { contextBridge, ipcRenderer } = require('electron');


// 预加载脚本（preload.js）用于在渲染进程和主进程之间建立桥梁，将主进程的功能安全地暴露给 React。
contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'), // 暴露打开文件夹的方法
  readFile: (path) => ipcRenderer.invoke('read-file',path), // 暴露打开文件夹的方法
});
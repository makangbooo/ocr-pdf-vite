const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const isDev = process.env.NODE_ENV === 'development';
  console.log('NODE_ENV:', process.env.NODE_ENV, 'isDev:', isDev); // 调试环境变量
  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  win.webContents.openDevTools(); // 打开开发者工具
}


// 处理打开文件夹的 IPC 请求
ipcMain.handle('open-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'], // 限制只能选择文件夹
  });

  if (!result.canceled) {
    return result.filePaths[0]; // 返回选中的文件夹路径
  } else {
    return null; // 用户取消选择
  }
});


app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow; // 定义全局主窗口变量

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      nodeIntegration: false, // 建议设置为 false 以提高安全性
      contextIsolation: true, // 建议设置为 true
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "dist/index.html"));
  }

  mainWindow.webContents.openDevTools();
}

// 处理打开文件夹的 IPC 请求
// ipcMain.handle("open-folder", async () => {
//   const result = await dialog.showOpenDialog(mainWindow, {
//     properties: ["openDirectory"],
//   });
//
//   return result.canceled ? null : result.filePaths[0];
// });


function getFilesRecursive(folderPath) {
  const files = fs.readdirSync(folderPath).map(file => {
    const filePath = path.join(folderPath, file);
    const isDirectory = fs.statSync(filePath).isDirectory();

    return {
      name: file,
      path: filePath,
      isDirectory,
      children: isDirectory ? getFilesRecursive(filePath) : []
    };
  });

  return files;
}
// 处理文件夹选择请求
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  console.log("result11111",result);

  if (result.canceled) return null;

  // 获取name
  const name = result.filePaths[0]
  const path = result.filePaths[0];
  const children = getFilesRecursive(path);
  const isDirectory = fs.statSync(path).isDirectory();

  return { name, path, children, isDirectory };
});

ipcMain.handle("read-file", async (_, filePath) => {
  try {
    // 读取文件内容（Buffer）
    const fileBuffer = fs.readFileSync(filePath);

    // 获取 MIME 类型（可选）
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".pdf": "application/pdf",
      ".txt": "text/plain",
    };
    const mimeType = mimeTypes[ext] || "application/octet-stream";

    // 转换为 Base64
    const base64Data = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;

    return { success: true, base64: base64Data, mimeType };
  } catch (error) {
    console.error("Error reading file:", error);
    return { success: false, error: error.message };
  }
});





app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
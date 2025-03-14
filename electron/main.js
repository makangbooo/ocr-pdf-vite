const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const https = require("https");// 用于下载 HTTPS 文件
const http = require("http");// 用于下载 HTTPS 文件

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
// 用户导入文件
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (result.canceled) return null;

  // 获取name
  const name = result.filePaths[0]
  const path = result.filePaths[0];
  const children = getFilesRecursive(path);
  const isDirectory = fs.statSync(path).isDirectory();

  return { name, path, children, isDirectory };
});

// 用户将文件夹与本地同步，根据导入路径
ipcMain.handle("sync-folder", async (_, folderPath) => {
  if (!folderPath) return null;

  try {
    const children = getFilesRecursive(folderPath);
    return {success: true, name:folderPath, path: folderPath, children, isDirectory:true };
  } catch (error) {
    console.error("❌ 文件夹同步失败:", error);
    return null;
  }
});

// 根据路径去获取文件信息（如base64信息）
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

// 处理下载请求
ipcMain.handle("download-file", async (_, url, defaultFileName) => {
  try {
    // 让用户选择下载路径
    const { filePath } = await dialog.showSaveDialog({
      title: "选择下载位置",
      defaultPath: path.join(require("os").homedir(), "Downloads", defaultFileName),
      buttonLabel: "保存",
      filters: [{ name: "All Files", extensions: ["*"] }],
    });

    // 如果用户取消了选择，返回 null
    if (!filePath) {
      return { success: false, error: "用户取消下载" };
    }

    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(filePath);
      const client = url.startsWith("https") ? https : http;

      client.get(url, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve({ success: true, filePath });
        });
      }).on("error", (err) => {
        fs.unlink(filePath, () => {}); // 删除未完成的文件
        reject({ success: false, error: err.message });
      });
    });
  } catch (error) {
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
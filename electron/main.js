const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const log = require('electron-log');
const { autoUpdater } = require('electron-updater');
const { machineIdSync } = require('node-machine-id');

let mainWindow;
log.initialize();
autoUpdater.logger = log;
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

const isDev = !app.isPackaged;
const EXPORTS_DIR = path.join(app.getPath('documents'), 'Mafia Vape', 'exports');
const DAILY_DIR = path.join(EXPORTS_DIR, 'daily');
const MONTHLY_DIR = path.join(EXPORTS_DIR, 'monthly');
const LOCAL_STATE_DIR = path.join(app.getPath('userData'), 'local');

for (const dir of [EXPORTS_DIR, DAILY_DIR, MONTHLY_DIR, LOCAL_STATE_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 760,
    frame: false,
    show: false,
    title: 'Mafia Vape',
    backgroundColor: '#111111',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const url = isDev ? 'http://127.0.0.1:5173' : `file://${path.join(__dirname, '..', 'dist', 'index.html')}`;
  mainWindow.loadURL(url);
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });
}

function getVersionPayload() {
  return {
    version: app.getVersion(),
    name: app.getName()
  };
}

function getDeviceInfo() {
  const machineId = machineIdSync(true);
  return {
    deviceId: machineId,
    deviceName: os.hostname(),
    platform: process.platform,
    appVersion: app.getVersion()
  };
}

function writeExportFile({ relativePath, buffer }) {
  const fullPath = path.join(EXPORTS_DIR, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, Buffer.from(buffer));
  return fullPath;
}

ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize-toggle', () => {
  if (!mainWindow) return { isMaximized: false };
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
  return { isMaximized: mainWindow.isMaximized() };
});
ipcMain.handle('window:close', () => mainWindow?.close());
ipcMain.handle('app:get-version', () => getVersionPayload());
ipcMain.handle('app:get-device-info', () => getDeviceInfo());
ipcMain.handle('app:open-exports-folder', async () => {
  await shell.openPath(EXPORTS_DIR);
  return true;
});
ipcMain.handle('app:write-export', async (_, payload) => {
  const filePath = writeExportFile(payload);
  return { filePath };
});
ipcMain.handle('app:open-file', async (_, filePath) => {
  await shell.openPath(filePath);
  return true;
});
ipcMain.handle('app:choose-export-location', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return result.canceled ? null : result.filePaths[0];
});

function sendUpdateStatus(channel, payload) {
  if (mainWindow?.webContents) mainWindow.webContents.send(channel, payload);
}

autoUpdater.on('checking-for-update', () => sendUpdateStatus('update:status', { type: 'checking' }));
autoUpdater.on('update-not-available', () => sendUpdateStatus('update:status', { type: 'none' }));
autoUpdater.on('error', (err) => sendUpdateStatus('update:status', { type: 'error', message: err.message }));
autoUpdater.on('download-progress', (progress) => sendUpdateStatus('update:status', { type: 'downloading', progress }));
autoUpdater.on('update-downloaded', (info) => sendUpdateStatus('update:status', { type: 'downloaded', info }));

ipcMain.handle('update:check', async () => {
  if (isDev) return { skipped: true, reason: 'dev-mode' };
  try {
    const result = await autoUpdater.checkForUpdates();
    return { skipped: false, result: result?.updateInfo ?? null };
  } catch (error) {
    return { skipped: false, error: error.message };
  }
});
ipcMain.handle('update:install', async () => {
  autoUpdater.quitAndInstall();
  return true;
});

app.whenReady().then(() => {
  createWindow();
  if (!isDev) {
    setTimeout(() => autoUpdater.checkForUpdates().catch(() => undefined), 3000);
  }
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
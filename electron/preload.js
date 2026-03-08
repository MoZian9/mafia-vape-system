const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopAPI', {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximizeToggle: () => ipcRenderer.invoke('window:maximize-toggle'),
  close: () => ipcRenderer.invoke('window:close'),
  getVersion: () => ipcRenderer.invoke('app:get-version'),
  getDeviceInfo: () => ipcRenderer.invoke('app:get-device-info'),
  openExportsFolder: () => ipcRenderer.invoke('app:open-exports-folder'),
  writeExport: (payload) => ipcRenderer.invoke('app:write-export', payload),
  openFile: (filePath) => ipcRenderer.invoke('app:open-file', filePath),
  chooseExportLocation: () => ipcRenderer.invoke('app:choose-export-location'),
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  onUpdateStatus: (callback) => {
    const listener = (_, payload) => callback(payload);
    ipcRenderer.on('update:status', listener);
    return () => ipcRenderer.removeListener('update:status', listener);
  }
});
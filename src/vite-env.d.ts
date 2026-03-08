/// <reference types="vite/client" />

declare global {
  interface Window {
    desktopAPI: {
      minimize: () => Promise<void>;
      maximizeToggle: () => Promise<{ isMaximized: boolean }>;
      close: () => Promise<void>;
      getVersion: () => Promise<{ version: string; name: string }>;
      getDeviceInfo: () => Promise<{ deviceId: string; deviceName: string; platform: string; appVersion: string }>;
      openExportsFolder: () => Promise<boolean>;
      writeExport: (payload: { relativePath: string; buffer: ArrayBuffer }) => Promise<{ filePath: string }>;
      openFile: (filePath: string) => Promise<boolean>;
      chooseExportLocation: () => Promise<string | null>;
      checkForUpdates: () => Promise<any>;
      installUpdate: () => Promise<boolean>;
      onUpdateStatus: (callback: (payload: any) => void) => () => void;
    };
  }
}

export {};
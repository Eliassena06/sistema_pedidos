const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  printReport: (html) => ipcRenderer.invoke('print-report', html)
});

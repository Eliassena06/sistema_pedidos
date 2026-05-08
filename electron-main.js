const path = require('node:path');
const fs = require('node:fs');
const { app, BrowserWindow, ipcMain, shell } = require('electron');

const HOST = '127.0.0.1';
const PORT = '3000';
const APP_URL = `http://${HOST}:${PORT}`;

process.env.HOST = HOST;
process.env.PORT = PORT;
process.env.APP_DATA_DIR = path.join(app.getPath('userData'), 'data');

const packagedDbPath = path.join(__dirname, 'data', 'sistema_pedidos.sqlite');
const userDbPath = path.join(process.env.APP_DATA_DIR, 'sistema_pedidos.sqlite');

if (!fs.existsSync(userDbPath) && fs.existsSync(packagedDbPath)) {
  fs.mkdirSync(process.env.APP_DATA_DIR, { recursive: true });
  fs.copyFileSync(packagedDbPath, userDbPath);
}

require('./server');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    title: 'Sistema de Pedidos',
    icon: path.join(__dirname, 'logoJECS.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadURL(APP_URL);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(APP_URL) || url === 'about:blank') {
      return { action: 'allow' };
    }

    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function printHtml(html) {
  return new Promise((resolve, reject) => {
    const printWindow = new BrowserWindow({
      width: 900,
      height: 700,
      show: false,
      title: 'Relatorio de Pedidos',
      autoHideMenuBar: true,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;

      if (!printWindow.isDestroyed()) {
        printWindow.close();
      }

      if (error) {
        reject(error);
        return;
      }

      resolve({ ok: true });
    };

    printWindow.webContents.once('did-finish-load', () => {
      setTimeout(() => {
        if (printWindow.isDestroyed()) {
          finish(new Error('Janela de impressao fechada antes de imprimir.'));
          return;
        }

        printWindow.webContents.print({
          silent: false,
          printBackground: true
        }, (success, failureReason) => {
          if (!success && failureReason) {
            finish(new Error(failureReason));
            return;
          }

          finish();
        });
      }, 350);
    });

    printWindow.webContents.once('did-fail-load', (_event, _code, description) => {
      finish(new Error(description || 'Nao foi possivel carregar o relatorio.'));
    });

    printWindow.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(html)}`);
  });
}

ipcMain.handle('print-report', (_event, html) => {
  if (typeof html !== 'string' || !html.trim()) {
    throw new Error('Relatorio vazio.');
  }

  return printHtml(html);
});

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

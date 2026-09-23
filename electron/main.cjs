const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const http = require('http');

let mainWindow = null;

function checkDevServerReady(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    transparent: true,
    backgroundMaterial: 'acrylic', // Windows 11 Acrylic blur
    backgroundColor: '#00000000',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const port = process.env.PORT || 1420;
  const devUrl = `http://127.0.0.1:${port}/`;
  const distIndex = path.join(__dirname, '..', 'dist', 'index.html');

  // Poll for dev server readiness for up to 5 seconds
  let isDevReady = false;
  for (let i = 0; i < 10; i++) {
    isDevReady = await checkDevServerReady(devUrl);
    if (isDevReady) break;
    await new Promise((r) => setTimeout(r, 500));
  }

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.warn(`[Electron] Page failed to load (${errorDescription}). Loading local dist fallback...`);
    mainWindow.loadFile(distIndex);
  });

  // F12 or Ctrl+Shift+I to open DevTools
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDevReady) {
    console.log('[Electron] Loading from Vite dev server:', devUrl);
    await mainWindow.loadURL(devUrl);
  } else {
    console.log('[Electron] Loading from compiled dist:', distIndex);
    await mainWindow.loadFile(distIndex);
  }

  // Window Controls IPC
  ipcMain.on('window-min', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.on('window-max', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.handle('window-is-max-sync', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
  });

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximized-state', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-maximized-state', false);
  });

  ipcMain.on('window-close', () => {
    if (mainWindow) mainWindow.close();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

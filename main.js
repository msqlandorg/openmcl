const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const config = require('./src/config');

let mainWindow;

function ensureDir(dir) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (e) {}
}

function initPaths() {
  config.initPaths(app);
  
  ensureDir(config.APP_DATA);
  ensureDir(config.GAME_DIR);
  ensureDir(path.join(config.GAME_DIR, 'versions'));
  ensureDir(path.join(config.GAME_DIR, 'libraries'));
  ensureDir(path.join(config.GAME_DIR, 'assets'));
  ensureDir(path.join(config.GAME_DIR, 'instances'));
  ensureDir(path.join(config.GAME_DIR, 'mods_cache'));

  try {
    app.setPath('userData', path.join(config.APP_DATA, 'userData'));
    app.setPath('cache', path.join(config.APP_DATA, 'cache'));
  } catch (e) {}
}

module.exports = { APP_DATA: config.APP_DATA, GAME_DIR: config.GAME_DIR };

require('./src/api/settings');
require('./src/api/minecraft');
require('./src/api/mods');
require('./src/api/installer');
require('./src/api/javaInstaller');
require('./src/api/auth');
require('./src/utils/launcher');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 768,
    minWidth: 1024,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    icon: path.join(__dirname, 'assets', 'logo.jpg'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer] ${message} (${sourceId}:${line})`);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Main] Page loaded successfully');
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('[Main] Render process gone:', details);
  });

  process.on('uncaughtException', (err) => {
    console.error('[Main] Uncaught exception:', err);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.setMenuBarVisibility(false);

  ipcMain.on('minimize', () => { if (mainWindow) mainWindow.minimize(); });
  ipcMain.on('maximize', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.on('close', () => { if (mainWindow) mainWindow.close(); });

  ipcMain.handle('select-directory', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    return result.filePaths[0] || null;
  });

  ipcMain.handle('get-app-data', () => ({
    appData: config.APP_DATA,
    gameDir: config.GAME_DIR
  }));
}

app.whenReady().then(() => {
  initPaths();
  
  ensureDir(config.GAME_DIR);
  ensureDir(path.join(config.GAME_DIR, 'versions'));
  ensureDir(path.join(config.GAME_DIR, 'libraries'));
  ensureDir(path.join(config.GAME_DIR, 'assets'));
  ensureDir(path.join(config.GAME_DIR, 'instances'));
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

const { ipcMain, app } = require('electron');
const https = require('https');
const fs = require('fs');
const path = require('path');

let GAME_DIR = path.join(process.env.APPDATA || process.env.HOME || '', 'CraftLauncher', 'games');

if (app && app.getPath) {
  try {
    GAME_DIR = path.join(app.getPath('appData'), 'CraftLauncher', 'games');
  } catch (e) {}
}

const MODRINTH_API = 'https://api.modrinth.com/v2';

function ensureDir(dir) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (e) {}
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

function httpDownload(url, dest, progressCallback) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const file = fs.createWriteStream(dest);
      const total = parseInt(res.headers['content-length'], 10);
      let downloaded = 0;
      
      res.on('data', (chunk) => {
        downloaded += chunk.length;
        if (progressCallback && total) {
          progressCallback(Math.round((downloaded / total) * 100));
        }
      });
      
      res.pipe(file);
      
      file.on('finish', () => {
        file.close(resolve);
      });
      
      file.on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

ipcMain.handle('search-mods', async (event, query) => {
  try {
    const url = `${MODRINTH_API}/search?query=${encodeURIComponent(query)}&limit=20&facets=%5B%5B%22project_type%3Amod%22%5D%5D`;
    const response = await httpGet(url);
    return JSON.parse(response);
  } catch (error) {
    
    return { hits: [] };
  }
});

// 获取模组详细信息
ipcMain.handle('get-mod-detail', async (event, modId) => {
  try {
    const response = await httpGet(`${MODRINTH_API}/project/${modId}`);
    return JSON.parse(response);
  } catch (error) {
    return null;
  }
});

// 获取模组所有版本
ipcMain.handle('get-mod-versions', async (event, modId) => {
  try {
    const response = await httpGet(`${MODRINTH_API}/project/${modId}/version`);
    return JSON.parse(response);
  } catch (error) {
    return [];
  }
});

function getInstanceModsDir(instanceId) {
  return path.join(GAME_DIR, 'instances', instanceId, 'mods');
}

ipcMain.handle('download-mod', async (event, modId, versionId) => {
  try {
    const versionResponse = await httpGet(`${MODRINTH_API}/version/${versionId}`);
    const version = JSON.parse(versionResponse);
    
    const downloadUrl = version.files[0]?.url;
    if (!downloadUrl) throw new Error('No download URL found');

    const filename = version.files[0]?.filename || `${modId}.jar`;
    
    const modsDir = path.join(GAME_DIR, 'mods_cache');
    ensureDir(modsDir);
    
    const destPath = path.join(modsDir, filename);
    
    await httpDownload(downloadUrl, destPath, (progress) => {
      event.sender.send('download-progress', { 
        type: 'mod', 
        progress: progress 
      });
    });
    
    return destPath;
  } catch (error) {
    
    throw error;
  }
});

ipcMain.handle('get-installed-mods', (event, instanceId) => {
  const modsDir = getInstanceModsDir(instanceId);
  if (!fs.existsSync(modsDir)) return [];

  return fs.readdirSync(modsDir)
    .filter(file => file.endsWith('.jar'))
    .map(file => ({
      name: file,
      path: path.join(modsDir, file)
    }));
});

ipcMain.handle('uninstall-mod', (event, instanceId, modFileName) => {
  const modsDir = getInstanceModsDir(instanceId);
  const modPath = path.join(modsDir, modFileName);
  if (fs.existsSync(modPath)) {
    fs.unlinkSync(modPath);
  }
  return true;
});
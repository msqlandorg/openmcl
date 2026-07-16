const { ipcMain } = require('electron');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { getDownloadSource } = require('./settings');

let versionList = [];

function getGameDir() {
  const gameDir = config.GAME_DIR;
  if (gameDir && typeof gameDir === 'string') return gameDir;
  return path.join(process.env.APPDATA || process.env.HOME || process.cwd(), 'CraftLauncher', 'games');
}

function ensureDir(dir) {
  try {
    if (dir && typeof dir === 'string' && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return true;
  } catch (e) {
    return false;
  }
}

ensureDir(getGameDir());
ensureDir(path.join(getGameDir(), 'versions'));
ensureDir(path.join(getGameDir(), 'libraries'));
ensureDir(path.join(getGameDir(), 'assets'));
ensureDir(path.join(getGameDir(), 'instances'));
ensureDir(path.join(getGameDir(), 'mods_cache'));

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const options = { headers: { 'User-Agent': 'CraftLauncher/1.0' } };
    protocol.get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpGet(res.headers.location).then(resolve).catch(reject);
      }
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

// 启用 keep-alive 的 HTTP/HTTPS Agent，复用 TCP 连接，大幅提升并发下载性能
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 64 });
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 64 });

function httpDownload(url, dest, progressCallback) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const protocol = isHttps ? https : http;
    const options = {
      headers: { 'User-Agent': 'CraftLauncher/1.0' },
      agent: isHttps ? httpsAgent : httpAgent
    };

    const request = protocol.get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpDownload(res.headers.location, dest, progressCallback).then(resolve).catch(reject);
      }
      
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      
      const total = parseInt(res.headers['content-length'], 10);
      let downloaded = 0;
      const file = fs.createWriteStream(dest);

      res.on('data', (chunk) => {
        downloaded += chunk.length;
        if (progressCallback && total) {
          progressCallback(Math.round((downloaded / total) * 100));
        }
      });

      res.pipe(file);
      
      file.on('finish', () => {
        file.close(() => {
          if (total && downloaded < total * 0.9) {
            fs.unlink(dest, () => {});
            reject(new Error(`Incomplete download: ${downloaded}/${total} bytes`));
          } else {
            resolve();
          }
        });
      });
      
      file.on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
      
      res.on('error', (err) => {
        file.close();
        fs.unlink(dest, () => {});
        reject(err);
      });
    });
    
    request.on('error', reject);
    request.on('socket', (socket) => {
      socket.setTimeout(60000);
      socket.on('timeout', () => {
        request.destroy();
        reject(new Error('Download timeout'));
      });
    });
  });
}

// 并发下载池：同时下载多个文件，提升下载速度
async function downloadPool(tasks, concurrency, onProgress) {
  let completed = 0;
  const total = tasks.length;
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const currentIndex = index++;
      const task = tasks[currentIndex];
      try {
        await task();
      } catch (e) {
        // 单个文件失败不影响其它下载
      }
      completed++;
      if (onProgress) onProgress(completed, total);
    }
  }

  const workers = [];
  const maxWorkers = Math.min(concurrency, total);
  for (let i = 0; i < maxWorkers; i++) {
    workers.push(worker());
  }
  await Promise.all(workers);
}

async function fetchVersionList() {
  try {
    const source = getDownloadSource();
    const response = await httpGet(source.versionManifest);
    versionList = JSON.parse(response);
    return versionList;
  } catch (error) {
    
    return { versions: [], latest: { release: '1.21.4', snapshot: '1.21.4' } };
  }
}

ipcMain.handle('get-version-list', async () => {
  if (!versionList.versions) await fetchVersionList();
  return versionList;
});

ipcMain.handle('refresh-version-list', async () => {
  versionList = [];
  await fetchVersionList();
  return versionList;
});

function getVersionDir(versionId) {
  return path.join(getGameDir(), 'versions', versionId);
}

function getVersionJarPath(versionId) {
  return path.join(getVersionDir(versionId), `${versionId}.jar`);
}

function getVersionJsonPath(versionId) {
  return path.join(getVersionDir(versionId), `${versionId}.json`);
}

ipcMain.handle('download-version', async (event, versionId) => {
  const source = getDownloadSource();
  const { versions } = await fetchVersionList();
  const version = versions.find(v => v.id === versionId);
  if (!version) throw new Error('Version not found: ' + versionId);

  const versionDir = getVersionDir(versionId);
  if (!ensureDir(versionDir)) {
    throw new Error('Failed to create version directory: ' + versionDir);
  }

  // Download version JSON
  const jsonPath = getVersionJsonPath(versionId);
  try { event.sender.send('download-progress', { type: 'version-json', progress: 5, status: 'downloading' }); } catch(e) {}
  let versionUrl = version.url;
  // Use mirror for version manifest URL
  if (source.id !== 'official') {
    versionUrl = version.url.replace('https://launchermeta.mojang.com/', source.versionManifest.replace(/\/mc\/game\/.*$/, '/'));
  }
  await httpDownload(versionUrl, jsonPath);

  const versionJson = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // Download client JAR
  event.sender.send('download-progress', { type: 'client-jar', progress: 15, status: 'downloading' });
  const jarPath = getVersionJarPath(versionId);
  let clientUrl = versionJson.downloads.client.url;
  if (source.id !== 'official') {
    clientUrl = clientUrl.replace('https://piston-data.mojang.com/', source.assets);
    clientUrl = clientUrl.replace('https://piston-meta.mojang.com/', source.versionManifest.replace(/\/mc\/game\/.*$/, '/'));
  }
  await httpDownload(clientUrl, jarPath, (p) => {
    event.sender.send('download-progress', { type: 'client-jar', progress: 15 + Math.round(p * 0.15) });
  });

  // Download libraries (并发下载，16路同时进行)
  event.sender.send('download-progress', { type: 'libraries', progress: 30, status: 'downloading' });
  const librariesDir = path.join(getGameDir(), 'libraries');
  fs.mkdirSync(librariesDir, { recursive: true });

  const libTasks = [];
  for (const lib of versionJson.libraries) {
    if (lib.downloads && lib.downloads.artifact) {
      const artifact = lib.downloads.artifact;
      const libPath = path.join(librariesDir, artifact.path);
      fs.mkdirSync(path.dirname(libPath), { recursive: true });
      if (!fs.existsSync(libPath)) {
        let libUrl = artifact.url;
        if (source.id !== 'official') {
          libUrl = libUrl.replace('https://libraries.minecraft.net/', source.libraries);
        }
        libTasks.push(() => httpDownload(libUrl, libPath));
      }
    }
  }
  await downloadPool(libTasks, 16, (completed, total) => {
    event.sender.send('download-progress', { type: 'libraries', progress: 30 + Math.round((completed / Math.max(total, 1)) * 40) });
  });

  // Download assets
  event.sender.send('download-progress', { type: 'assets', progress: 70, status: 'downloading' });
  const assetsDir = path.join(getGameDir(), 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });

  if (versionJson.assetIndex) {
    const assetsIndexPath = path.join(assetsDir, 'indexes', `${versionJson.assetIndex.id}.json`);
    fs.mkdirSync(path.dirname(assetsIndexPath), { recursive: true });

    let assetIndexUrl = versionJson.assetIndex.url;
    if (source.id !== 'official') {
      assetIndexUrl = assetIndexUrl.replace('https://launchermeta.mojang.com/', source.versionManifest.replace(/\/mc\/game\/.*$/, '/'));
      assetIndexUrl = assetIndexUrl.replace('https://piston-meta.mojang.com/', source.versionManifest.replace(/\/mc\/game\/.*$/, '/'));
    }
    await httpDownload(assetIndexUrl, assetsIndexPath);

    const assetsIndex = JSON.parse(fs.readFileSync(assetsIndexPath, 'utf8'));
    const objects = assetsIndex.objects || {};

    // 并发下载所有资源文件（32路同时进行，资源文件小且多）
    const assetTasks = [];
    for (const [name, hashInfo] of Object.entries(objects)) {
      const hash = hashInfo.hash;
      const assetPath = path.join(assetsDir, 'objects', hash.substring(0, 2), hash);
      fs.mkdirSync(path.dirname(assetPath), { recursive: true });
      if (!fs.existsSync(assetPath)) {
        const url = `${source.assets}${hash.substring(0, 2)}/${hash}`;
        assetTasks.push(() => httpDownload(url, assetPath));
      }
    }
    await downloadPool(assetTasks, 32, (completed, total) => {
      event.sender.send('download-progress', { type: 'assets', progress: 70 + Math.round((completed / Math.max(total, 1)) * 25) });
    });
  }

  event.sender.send('download-progress', { type: 'complete', progress: 100, status: 'complete' });
  return true;
});

ipcMain.handle('get-installed-versions', () => {
  const versionsDir = path.join(getGameDir(), 'versions');
  if (!fs.existsSync(versionsDir)) return [];

  return fs.readdirSync(versionsDir)
    .filter(dir => {
      const jsonPath = getVersionJsonPath(dir);
      return fs.existsSync(jsonPath);
    })
    .map(dir => {
      const jsonPath = getVersionJsonPath(dir);
      try {
        const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        return {
          id: dir,
          type: json.type || 'release',
          releaseTime: json.releaseTime,
          isForge: dir.includes('forge'),
          isFabric: dir.includes('fabric'),
          inheritsFrom: json.inheritsFrom
        };
      } catch (e) {
        return { id: dir, type: 'unknown', releaseTime: null };
      }
    });
});

ipcMain.handle('delete-version', (event, versionId) => {
  const versionDir = getVersionDir(versionId);
  if (fs.existsSync(versionDir)) {
    fs.rmSync(versionDir, { recursive: true, force: true });
  }
  return true;
});

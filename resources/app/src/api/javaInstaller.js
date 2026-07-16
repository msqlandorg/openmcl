const { ipcMain } = require('electron');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawn } = require('child_process');
const { APP_DATA, GAME_DIR } = require('../../main');
const { getSettings, saveSettings } = require('./settings');

const JAVA_DIR = path.join(APP_DATA, 'java');

function ensureDir(dir) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return true;
  } catch (e) {
    return false;
  }
}

ensureDir(JAVA_DIR);

const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 8 });
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 8 });

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
      file.on('error', (err) => { fs.unlink(dest, () => {}); reject(err); });
      res.on('error', (err) => { file.close(); fs.unlink(dest, () => {}); reject(err); });
    });
    request.on('error', reject);
    request.on('socket', (socket) => {
      socket.setTimeout(120000);
      socket.on('timeout', () => { request.destroy(); reject(new Error('Download timeout')); });
    });
  });
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const protocol = isHttps ? https : http;
    const options = {
      headers: { 'User-Agent': 'CraftLauncher/1.0' },
      agent: isHttps ? httpsAgent : httpAgent
    };
    const req = protocol.get(url, options, (res) => {
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
    req.on('socket', (socket) => {
      socket.setTimeout(30000);
      socket.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    });
  });
}

// 获取 Adoptium Java 版本列表
async function getJavaVersions(featureVersion) {
  const arch = process.arch === 'x64' ? 'x64' : (process.arch === 'arm64' ? 'aarch64' : 'x86');
  const url = `https://api.adoptium.net/v3/assets/latest/${featureVersion}/hotspot?architecture=${arch}&image_type=jre&os=windows&vendor=eclipse`;
  try {
    const data = await httpGet(url);
    const releases = JSON.parse(data);
    return releases.map(r => ({
      name: r.release_name,
      version: r.version_data.semver,
      downloadUrl: r.binary.package.link,
      size: r.binary.package.size,
      checksum: r.binary.package.checksum
    }));
  } catch (e) {
    return [];
  }
}

// 检测已安装的 Java
function detectJava() {
  const javaPaths = [
    process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', 'java.exe') : null,
    'C:\\Program Files\\Java\\jdk-21\\bin\\java.exe',
    'C:\\Program Files\\Java\\jdk-17\\bin\\java.exe',
    'C:\\Program Files\\Java\\jre-21\\bin\\java.exe',
    'C:\\Program Files\\Java\\jre-17\\bin\\java.exe',
    'C:\\Program Files (x86)\\Java\\jre-21\\bin\\java.exe',
    'C:\\Program Files (x86)\\Java\\jre-17\\bin\\java.exe',
    'C:\\Program Files\\Eclipse Adoptium\\jdk-21\\bin\\java.exe',
    'C:\\Program Files\\Eclipse Adoptium\\jdk-17\\bin\\java.exe',
    'C:\\Program Files\\Eclipse Adoptium\\jre-21\\bin\\java.exe',
    'C:\\Program Files\\Eclipse Adoptium\\jre-17\\bin\\java.exe',
    'C:\\Program Files\\Microsoft\\jdk-21\\bin\\java.exe',
    'C:\\Program Files\\Microsoft\\jdk-17\\bin\\java.exe',
    'C:\\Program Files\\Java\\jdk1.8.0\\bin\\java.exe',
    'C:\\Program Files\\Java\\jre1.8.0\\bin\\java.exe',
    'C:\\Program Files (x86)\\Java\\jdk1.8.0\\bin\\java.exe',
    'C:\\Program Files (x86)\\Java\\jre1.8.0\\bin\\java.exe'
  ].filter(Boolean);

  const found = [];
  for (const javaPath of javaPaths) {
    if (fs.existsSync(javaPath)) {
      const version = getJavaVersion(javaPath);
      found.push({ path: javaPath, version: version || 'unknown' });
    }
  }

  // 搜索启动器内置 Java 目录
  const builtInDir = JAVA_DIR;
  if (fs.existsSync(builtInDir)) {
    try {
      const entries = fs.readdirSync(builtInDir);
      for (const entry of entries) {
        const javaExe = path.join(builtInDir, entry, 'bin', 'java.exe');
        if (fs.existsSync(javaExe)) {
          const version = getJavaVersion(javaExe);
          found.push({ path: javaExe, version: version || 'unknown', builtIn: true });
        }
      }
    } catch (e) {}
  }

  // 搜索常见目录
  const searchDirs = ['C:\\Program Files\\Java', 'C:\\Program Files\\Eclipse Adoptium', 'C:\\Program Files\\Microsoft', 'C:\\Program Files (x86)\\Java'];
  for (const dir of searchDirs) {
    if (fs.existsSync(dir)) {
      try {
        const entries = fs.readdirSync(dir);
        for (const entry of entries) {
          const javaExe = path.join(dir, entry, 'bin', 'java.exe');
          if (fs.existsSync(javaExe) && !found.some(f => f.path === javaExe)) {
            const version = getJavaVersion(javaExe);
            found.push({ path: javaExe, version: version || 'unknown' });
          }
        }
      } catch (e) {}
    }
  }

  // where java 兜底
  try {
    const output = execSync('where java 2>&1', { encoding: 'utf8' });
    const lines = output.trim().split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.endsWith('java.exe') && fs.existsSync(trimmed) && !found.some(f => f.path === trimmed)) {
        const version = getJavaVersion(trimmed);
        found.push({ path: trimmed, version: version || 'unknown' });
      }
    }
  } catch (e) {}

  return found;
}

function getJavaVersion(javaPath) {
  try {
    const output = execSync(`"${javaPath}" -version 2>&1`, { encoding: 'utf8' });
    const match = output.match(/version\s+"([^"]+)"/);
    if (match) return match[1];
    const match2 = output.match(/(\d+\.\d+\.\d+[_\d]*)/);
    if (match2) return match2[1];
  } catch (e) {}
  return null;
}

// 下载并安装 Java
async function installJava(featureVersion, event) {
  const versions = await getJavaVersions(featureVersion);
  if (versions.length === 0) {
    throw new Error('未找到可用的 Java ' + featureVersion + ' 版本');
  }

  const latest = versions[0];
  const versionDirName = `jdk-${featureVersion}-jre`;
  const versionDir = path.join(JAVA_DIR, versionDirName);
  const zipPath = path.join(JAVA_DIR, `java-${featureVersion}.zip`);

  if (fs.existsSync(versionDir)) {
    const javaExe = path.join(versionDir, 'bin', 'java.exe');
    if (fs.existsSync(javaExe)) {
      saveSettings({ javaPath: javaExe });
      return { path: javaExe, version: latest.version };
    }
  }

  ensureDir(JAVA_DIR);

  try {
    event.sender.send('download-progress', { type: 'java-download', progress: 0, status: 'downloading' });
    await httpDownload(latest.downloadUrl, zipPath, (p) => {
      event.sender.send('download-progress', { type: 'java-download', progress: Math.round(p * 0.8), status: 'downloading' });
    });

    event.sender.send('download-progress', { type: 'java-download', progress: 85, status: 'extracting' });

    // 使用 PowerShell 解压
    try {
      execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${JAVA_DIR}' -Force"`, {
        encoding: 'utf8',
        stdio: 'ignore'
      });
    } catch (e) {
      // 尝试使用 tar (Windows 10+ 自带)
      try {
        execSync(`tar -xzf "${zipPath}" -C "${JAVA_DIR}"`, { encoding: 'utf8', stdio: 'ignore' });
      } catch (e2) {
        throw new Error('Java 解压失败,请手动解压');
      }
    }

    // 查找解压后的目录
    let extractedDir = null;
    const entries = fs.readdirSync(JAVA_DIR);
    for (const entry of entries) {
      const fullPath = path.join(JAVA_DIR, entry);
      if (entry.includes('jdk') || entry.includes('jre') || entry.includes('temurin')) {
        const binJava = path.join(fullPath, 'bin', 'java.exe');
        if (fs.existsSync(binJava)) {
          extractedDir = fullPath;
          break;
        }
      }
    }

    if (!extractedDir) {
      throw new Error('未找到解压后的 Java 目录');
    }

    // 重命名为规范名称
    if (path.basename(extractedDir) !== versionDirName) {
      const targetDir = path.join(JAVA_DIR, versionDirName);
      if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true });
      }
      fs.renameSync(extractedDir, targetDir);
      extractedDir = targetDir;
    }

    const javaExe = path.join(extractedDir, 'bin', 'java.exe');
    if (!fs.existsSync(javaExe)) {
      throw new Error('Java 安装失败:找不到 java.exe');
    }

    // 清理 zip
    try { fs.unlinkSync(zipPath); } catch (e) {}

    saveSettings({ javaPath: javaExe });

    event.sender.send('download-progress', { type: 'java-download', progress: 100, status: 'complete' });

    return { path: javaExe, version: latest.version };
  } catch (e) {
    try { if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath); } catch (e2) {}
    throw e;
  }
}

ipcMain.handle('detect-java', () => {
  return detectJava();
});

ipcMain.handle('get-java-versions', async (event, featureVersion) => {
  return await getJavaVersions(featureVersion || 21);
});

ipcMain.handle('install-java', async (event, featureVersion) => {
  return await installJava(featureVersion || 21, event);
});

module.exports = { detectJava, getJavaVersion, installJava, getJavaVersions };

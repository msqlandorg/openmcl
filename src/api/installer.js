const { ipcMain, app } = require('electron');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { getDownloadSource } = require('./settings');

let GAME_DIR = path.join(process.env.APPDATA || process.env.HOME || '', 'CraftLauncher', 'games');

if (app && app.getPath) {
  try {
    GAME_DIR = path.join(app.getPath('appData'), 'CraftLauncher', 'games');
  } catch (e) {}
}

function ensureDir(dir) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (e) {}
}

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

function httpDownload(url, dest, progressCallback) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const options = { headers: { 'User-Agent': 'CraftLauncher/1.0' } };
    protocol.get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpDownload(res.headers.location, dest, progressCallback).then(resolve).catch(reject);
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
      file.on('finish', () => file.close(resolve));
      file.on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

// Fabric API
const FABRIC_API = 'https://meta.fabricmc.net/v2';

ipcMain.handle('get-fabric-versions', async (event, mcVersion) => {
  try {
    const response = await httpGet(`${FABRIC_API}/versions/loader/${mcVersion}`);
    return JSON.parse(response);
  } catch (error) {
    
    return [];
  }
});

ipcMain.handle('install-fabric', async (event, mcVersion, loaderVersion) => {
  try {
    const loaderData = JSON.parse(await httpGet(`${FABRIC_API}/versions/loader/${mcVersion}/${loaderVersion}`));
    const meta = loaderData.loader || loaderData;

    const source = getDownloadSource();
    const versionId = `fabric-loader-${loaderVersion}-${mcVersion}`;
    const versionDir = path.join(GAME_DIR, 'versions', versionId);
    ensureDir(versionDir);

    const jsonPath = path.join(versionDir, `${versionId}.json`);

    // Download Fabric profile JSON
    const profileUrl = `${FABRIC_API}/versions/loader/${mcVersion}/${loaderVersion}/profile/json`;
    const profileJson = await httpGet(profileUrl);

    const profile = JSON.parse(profileJson);
    profile.id = versionId;
    profile.inheritsFrom = mcVersion;

    // Replace library URLs with mirror if needed
    if (source.id !== 'official' && profile.libraries) {
      profile.libraries.forEach(lib => {
        if (lib.url) {
          lib.url = lib.url.replace('https://maven.fabricmc.net/', source.libraries);
        }
      });
    }

    fs.writeFileSync(jsonPath, JSON.stringify(profile, null, 2));

    event.sender.send('download-progress', { type: 'fabric', progress: 100, status: 'complete' });
    return { success: true, versionId };
  } catch (error) {
    
    throw error;
  }
});

// Forge API
ipcMain.handle('get-forge-versions', async (event, mcVersion) => {
  try {
    const response = await httpGet(`https://files.minecraftforge.net/net/minecraftforge/forge/maven-metadata.json`);
    const data = JSON.parse(response);
    const versions = data[mcVersion];
    if (!versions) return [];
    // versions is an object: { "version": { ... } }
    return Object.entries(versions).map(([ver, info]) => ({
      version: ver,
      date: info.lastModified ? new Date(info.lastModified).toISOString().split('T')[0] : ''
    }));
  } catch (error) {
    
    return [];
  }
});

ipcMain.handle('install-forge', async (event, mcVersion, forgeVersion) => {
  try {
    const source = getDownloadSource();
    const versionId = `${mcVersion}-forge-${forgeVersion}`;
    const versionDir = path.join(GAME_DIR, 'versions', versionId);
    ensureDir(versionDir);

    // Download Forge installer
    const forgeBaseUrl = source.id === 'official'
      ? 'https://files.minecraftforge.net'
      : source.id === 'bmclapi'
      ? 'https://bmclapi2.bangbang93.com'
      : 'https://download.mcbbs.net';

    const installerUrl = `${forgeBaseUrl}/net/minecraftforge/forge/${mcVersion}-${forgeVersion}/forge-${mcVersion}-${forgeVersion}-installer.jar`;
    const installerPath = path.join(versionDir, 'forge-installer.jar');

    event.sender.send('download-progress', { type: 'forge-installer', progress: 0 });
    await httpDownload(installerUrl, installerPath, (progress) => {
      event.sender.send('download-progress', { type: 'forge-installer', progress });
    });

    // Run Forge installer in headless mode
    const { spawn } = require('child_process');
    const { getSettings } = require('./settings');
    const settings = getSettings();

    // Find Java
    const javaPaths = [
      settings.javaPath,
      process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', 'java.exe') : null,
      'C:\\Program Files\\Java\\jdk-21\\bin\\java.exe',
      'C:\\Program Files\\Java\\jdk-17\\bin\\java.exe'
    ].filter(Boolean);

    let javaPath = null;
    for (const p of javaPaths) {
      if (p && fs.existsSync(p)) { javaPath = p; break; }
    }
    if (!javaPath) throw new Error('Java not found for Forge installation');

    event.sender.send('download-progress', { type: 'forge-install', progress: 50 });

    const result = await new Promise((resolve, reject) => {
      const proc = spawn(javaPath, [
        '-jar', installerPath,
        '--installClient',
        path.dirname(versionDir)
      ], {
        cwd: versionDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      proc.stdout.on('data', (d) => output += d.toString());
      proc.stderr.on('data', (d) => output += d.toString());
      proc.on('close', (code) => {
        if (code === 0) resolve(output);
        else reject(new Error(`Forge installer exited with code ${code}: ${output}`));
      });
    });

    // Clean up installer
    try { fs.unlinkSync(installerPath); } catch (e) {}

    event.sender.send('download-progress', { type: 'forge', progress: 100, status: 'complete' });
    return { success: true, versionId };
  } catch (error) {
    
    throw error;
  }
});

// Java Runtime detection (handled by javaInstaller.js)

// Install mod to instance
ipcMain.handle('install-mod', async (event, instanceId, modId, versionId) => {
  try {
    const versionResponse = await httpGet(`https://api.modrinth.com/v2/version/${versionId}`);
    const version = JSON.parse(versionResponse);

    const file = version.files.find(f => f.primary) || version.files[0];
    if (!file) throw new Error('No download file found');

    const modsDir = path.join(GAME_DIR, 'instances', instanceId, 'mods');
    ensureDir(modsDir);

    const destPath = path.join(modsDir, file.filename);

    event.sender.send('download-progress', { type: 'mod', progress: 0, name: file.filename });
    await httpDownload(file.url, destPath, (progress) => {
      event.sender.send('download-progress', { type: 'mod', progress, name: file.filename });
    });

    return { success: true, path: destPath, filename: file.filename };
  } catch (error) {
    
    throw error;
  }
});

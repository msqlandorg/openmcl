const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const config = require('../config');

function getAppData() {
  return config.APP_DATA || path.join(process.env.APPDATA || process.env.HOME || process.cwd(), 'CraftLauncher');
}

function getSettingsFilePath() {
  return path.join(getAppData(), 'settings.json');
}

const DEFAULT_SETTINGS = {
  downloadSource: 'official',
  javaPath: '',
  memory: 4096,
  resolution: { width: 1280, height: 720 },
  javaArgs: '-XX:+UseG1GC -XX:+ParallelRefProcEnabled',
  closeBehavior: 'minimize',
  autoUpdate: true,
  backupBeforeLaunch: false,
  language: 'zh-CN',
  theme: 'dark',
  concurrentDownloads: 3,
  speedLimit: 0,
  gameDir: '',
  modSource: 'modrinth',
  playerName: 'Player',
  accountType: 'offline',
  microsoftAccount: null
};

const DOWNLOAD_SOURCES = {
  official: {
    name: '官方源 (Mojang)',
    versionManifest: 'https://launchermeta.mojang.com/mc/game/version_manifest.json',
    assetsIndex: 'https://launchermeta.mojang.com/mc/assets/indexes/',
    libraries: 'https://libraries.minecraft.net/',
    assets: 'https://resources.download.minecraft.net/'
  },
  bmclapi: {
    name: 'BMCLAPI (镜像)',
    versionManifest: 'https://bmclapi2.bangbang93.com/mc/game/version_manifest.json',
    assetsIndex: 'https://bmclapi2.bangbang93.com/mc/assets/indexes/',
    libraries: 'https://bmclapi2.bangbang93.com/maven/',
    assets: 'https://bmclapi2.bangbang93.com/assets/'
  },
  mcbbs: {
    name: 'MCBBS (镜像)',
    versionManifest: 'https://download.mcbbs.net/mc/game/version_manifest.json',
    assetsIndex: 'https://download.mcbbs.net/mc/assets/indexes/',
    libraries: 'https://download.mcbbs.net/maven/',
    assets: 'https://download.mcbbs.net/assets/'
  }
};

function getSettings() {
  if (fs.existsSync(getSettingsFilePath())) {
    try {
      const saved = JSON.parse(fs.readFileSync(getSettingsFilePath(), 'utf8'));
      return { ...DEFAULT_SETTINGS, ...saved };
    } catch (e) {
      return { ...DEFAULT_SETTINGS };
    }
  }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings) {
  const current = getSettings();
  const merged = { ...current, ...settings };
  fs.writeFileSync(getSettingsFilePath(), JSON.stringify(merged, null, 2));
  return merged;
}

function getDownloadSource() {
  const settings = getSettings();
  const sourceId = settings.downloadSource || 'official';
  return { id: sourceId, ...DOWNLOAD_SOURCES[sourceId] };
}

ipcMain.handle('get-settings', () => {
  return getSettings();
});

ipcMain.handle('save-settings', (event, settings) => {
  return saveSettings(settings);
});

ipcMain.handle('get-download-sources', () => {
  return Object.entries(DOWNLOAD_SOURCES).map(([key, val]) => ({
    id: key,
    name: val.name
  }));
});

module.exports = { getSettings, saveSettings, getDownloadSource, DOWNLOAD_SOURCES };

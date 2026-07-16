const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('appApi', {
  // Window controls
  minimize: () => ipcRenderer.send('minimize'),
  maximize: () => ipcRenderer.send('maximize'),
  close: () => ipcRenderer.send('close'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  getAppData: () => ipcRenderer.invoke('get-app-data'),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  getDownloadSources: () => ipcRenderer.invoke('get-download-sources'),

  // Minecraft versions
  getVersionList: () => ipcRenderer.invoke('get-version-list'),
  refreshVersionList: () => ipcRenderer.invoke('refresh-version-list'),
  downloadVersion: (versionId) => ipcRenderer.invoke('download-version', versionId),
  getInstalledVersions: () => ipcRenderer.invoke('get-installed-versions'),
  deleteVersion: (versionId) => ipcRenderer.invoke('delete-version', versionId),

  // Instances
  createInstance: (config) => ipcRenderer.invoke('create-instance', config),
  getInstances: () => ipcRenderer.invoke('get-instances'),
  deleteInstance: (instanceId) => ipcRenderer.invoke('delete-instance', instanceId),
  updateInstance: (instanceId, config) => ipcRenderer.invoke('update-instance', instanceId, config),
  
  // Instance management (PCL features)
  copyInstance: (instanceId, newName) => ipcRenderer.invoke('copy-instance', instanceId, newName),
  exportInstance: (instanceId, exportPath) => ipcRenderer.invoke('export-instance', instanceId, exportPath),
  importInstance: (zipPath) => ipcRenderer.invoke('import-instance', zipPath),
  backupInstance: (instanceId) => ipcRenderer.invoke('backup-instance', instanceId),
  getInstanceBackups: () => ipcRenderer.invoke('get-instance-backups'),
  restoreBackup: (backupPath) => ipcRenderer.invoke('restore-backup', backupPath),
  deleteBackup: (backupPath) => ipcRenderer.invoke('delete-backup', backupPath),

  // Game launch
  launchGame: (instanceId) => ipcRenderer.invoke('launch-game', instanceId),
  autoFix: (fixType, instanceId) => ipcRenderer.invoke('auto-fix', fixType, instanceId),

  // Mods
  searchMods: (query) => ipcRenderer.invoke('search-mods', query),
  getModDetail: (modId) => ipcRenderer.invoke('get-mod-detail', modId),
  getModVersions: (modId) => ipcRenderer.invoke('get-mod-versions', modId),
  downloadMod: (modId, versionId) => ipcRenderer.invoke('download-mod', modId, versionId),
  installMod: (instanceId, modId, versionId) => ipcRenderer.invoke('install-mod', instanceId, modId, versionId),
  getInstalledMods: (instanceId) => ipcRenderer.invoke('get-installed-mods', instanceId),
  uninstallMod: (instanceId, modFileName) => ipcRenderer.invoke('uninstall-mod', instanceId, modFileName),

  // Resource Packs (PCL feature)
  getResourcePacks: (instanceId) => ipcRenderer.invoke('get-resource-packs', instanceId),
  installResourcePack: (instanceId, packPath) => ipcRenderer.invoke('install-resource-pack', instanceId, packPath),
  uninstallResourcePack: (instanceId, packName) => ipcRenderer.invoke('uninstall-resource-pack', instanceId, packName),
  openResourcePackDir: (instanceId) => ipcRenderer.invoke('open-resource-pack-dir', instanceId),

  // Saves (PCL feature)
  getSaves: (instanceId) => ipcRenderer.invoke('get-saves', instanceId),
  exportSave: (instanceId, saveName, exportPath) => ipcRenderer.invoke('export-save', instanceId, saveName, exportPath),
  importSave: (instanceId, zipPath) => ipcRenderer.invoke('import-save', instanceId, zipPath),
  deleteSave: (instanceId, saveName) => ipcRenderer.invoke('delete-save', instanceId, saveName),
  backupSave: (instanceId, saveName) => ipcRenderer.invoke('backup-save', instanceId, saveName),
  openSavesDir: (instanceId) => ipcRenderer.invoke('open-saves-dir', instanceId),

  // Forge/Fabric
  getForgeVersions: (mcVersion) => ipcRenderer.invoke('get-forge-versions', mcVersion),
  installForge: (mcVersion, forgeVersion) => ipcRenderer.invoke('install-forge', mcVersion, forgeVersion),
  getFabricVersions: (mcVersion) => ipcRenderer.invoke('get-fabric-versions', mcVersion),
  installFabric: (mcVersion, loaderVersion) => ipcRenderer.invoke('install-fabric', mcVersion, loaderVersion),

  // Java
  detectJava: () => ipcRenderer.invoke('detect-java'),
  installJava: (version) => ipcRenderer.invoke('install-java', version),
  getJavaVersions: (featureVersion) => ipcRenderer.invoke('get-java-versions', featureVersion),

  // Account
  microsoftLogin: () => ipcRenderer.invoke('microsoft-login'),
  microsoftLogout: () => ipcRenderer.invoke('microsoft-logout'),
  getAccountInfo: () => ipcRenderer.invoke('get-account-info'),

  // Theme (PCL feature)
  setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),
  getTheme: () => ipcRenderer.invoke('get-theme'),

  // Events
  onProgress: (callback) => ipcRenderer.on('download-progress', callback),
  onLog: (callback) => ipcRenderer.on('game-log', callback),
  onLaunchProgress: (callback) => ipcRenderer.on('launch-progress', callback)
});

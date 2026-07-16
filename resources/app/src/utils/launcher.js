const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { getSettings } = require('../api/settings');
const appConfig = require('../config');

function getGameDir() {
  const gameDir = appConfig.GAME_DIR;
  if (gameDir && typeof gameDir === 'string') return gameDir;
  return path.join(process.env.APPDATA || process.env.HOME || process.cwd(), 'CraftLauncher', 'games');
}

function generateOfflineUuid(playerName) {
  const md5 = crypto.createHash('md5').update('OfflinePlayer:' + playerName).digest('hex');
  return md5.substring(0, 8) + '-' + md5.substring(8, 12) + '-' + md5.substring(12, 16) + '-' + md5.substring(16, 20) + '-' + md5.substring(20, 32);
}

function ensureDir(dir) {
  try {
    if (dir && typeof dir === 'string' && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (e) {}
}

function getInstancesDir() {
  return path.join(getGameDir(), 'instances');
}

function getInstanceDir(instanceId) {
  if (!instanceId) return null;
  return path.join(getInstancesDir(), instanceId);
}

function getInstanceConfigPath(instanceId) {
  const dir = getInstanceDir(instanceId);
  if (!dir) return null;
  return path.join(dir, 'instance.json');
}

ipcMain.handle('create-instance', (event, instanceConfig) => {
  const instanceId = instanceConfig.id || Date.now().toString();
  const instanceDir = getInstanceDir(instanceId);
  fs.mkdirSync(instanceDir, { recursive: true });

  const defaults = {
    id: instanceId,
    name: instanceConfig.name || 'New Instance',
    version: instanceConfig.version || '1.20.4',
    type: instanceConfig.type || 'vanilla',
    memory: instanceConfig.memory || 4096,
    javaArgs: instanceConfig.javaArgs || '',
    resolution: instanceConfig.resolution || { width: 1920, height: 1080 },
    gameDir: path.join(instanceDir, 'game'),
    modsDir: path.join(instanceDir, 'mods'),
    resourcePacksDir: path.join(instanceDir, 'resourcepacks'),
    shaderPacksDir: path.join(instanceDir, 'shaderpacks'),
    createdAt: new Date().toISOString()
  };

  fs.mkdirSync(defaults.gameDir, { recursive: true });
  fs.mkdirSync(defaults.modsDir, { recursive: true });
  fs.mkdirSync(defaults.resourcePacksDir, { recursive: true });
  fs.mkdirSync(defaults.shaderPacksDir, { recursive: true });

  fs.writeFileSync(getInstanceConfigPath(instanceId), JSON.stringify(defaults, null, 2));
  return defaults;
});

ipcMain.handle('get-instances', () => {
  if (!fs.existsSync(getInstancesDir())) return [];

  return fs.readdirSync(getInstancesDir())
    .filter(dir => {
      const configPath = getInstanceConfigPath(dir);
      return fs.existsSync(configPath);
    })
    .map(dir => {
      const configPath = getInstanceConfigPath(dir);
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    });
});

ipcMain.handle('delete-instance', (event, instanceId) => {
  const instanceDir = getInstanceDir(instanceId);
  if (fs.existsSync(instanceDir)) {
    fs.rmSync(instanceDir, { recursive: true, force: true });
  }
  return true;
});

ipcMain.handle('update-instance', (event, instanceId, config) => {
  const configPath = getInstanceConfigPath(instanceId);
  if (!fs.existsSync(configPath)) return false;

  const current = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const updated = { ...current, ...config };

  fs.writeFileSync(configPath, JSON.stringify(updated, null, 2));
  return updated;
});

function findJava() {
  const settings = getSettings();
  const javaPaths = [
    settings.javaPath,
    process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', 'java.exe') : null,
    'C:\\Program Files\\Java\\jdk-21\\bin\\java.exe',
    'C:\\Program Files\\Java\\jdk-17\\bin\\java.exe',
    'C:\\Program Files\\Java\\jdk-21.0.10\\bin\\java.exe',
    'C:\\Program Files\\Java\\jre-21\\bin\\java.exe',
    'C:\\Program Files\\Java\\jre-17\\bin\\java.exe',
    'C:\\Program Files (x86)\\Java\\jre-21\\bin\\java.exe',
    'C:\\Program Files (x86)\\Java\\jre-17\\bin\\java.exe',
    'C:\\Program Files\\Eclipse Adoptium\\jdk-21\\bin\\java.exe',
    'C:\\Program Files\\Eclipse Adoptium\\jdk-17\\bin\\java.exe',
    'C:\\Program Files\\Microsoft\\jdk-21\\bin\\java.exe',
    'C:\\Program Files\\Microsoft\\jdk-17\\bin\\java.exe',
    'C:\\Program Files\\Java\\jdk1.8.0\\bin\\java.exe',
    'C:\\Program Files\\Java\\jre1.8.0\\bin\\java.exe',
    'C:\\Program Files (x86)\\Java\\jdk1.8.0\\bin\\java.exe',
    'C:\\Program Files (x86)\\Java\\jre1.8.0\\bin\\java.exe'
  ].filter(Boolean);

  for (const javaPath of javaPaths) {
    if (fs.existsSync(javaPath)) return javaPath;
  }

  const searchDirs = ['C:\\Program Files\\Java', 'C:\\Program Files\\Eclipse Adoptium', 'C:\\Program Files\\Microsoft', 'C:\\Program Files (x86)\\Java'];
  for (const dir of searchDirs) {
    if (fs.existsSync(dir)) {
      try {
        const entries = fs.readdirSync(dir);
        for (const entry of entries) {
          const javaExe = path.join(dir, entry, 'bin', 'java.exe');
          if (fs.existsSync(javaExe)) return javaExe;
        }
      } catch (e) {}
    }
  }

  try {
    const { execSync } = require('child_process');
    const output = execSync('where java 2>&1', { encoding: 'utf8' });
    const lines = output.trim().split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.endsWith('java.exe') && fs.existsSync(trimmed)) return trimmed;
    }
  } catch (e) {}

  return null;
}

function isLibAllowed(lib) {
  if (!lib.rules || lib.rules.length === 0) return true;
  let allowed = false;
  const osName = process.platform === 'win32' ? 'windows' : (process.platform === 'darwin' ? 'osx' : 'linux');
  const osArch = process.arch === 'x64' ? 'x86_64' : (process.arch === 'arm64' ? 'arm64' : 'x86');
  for (const rule of lib.rules) {
    if (rule.action === 'allow') {
      if (!rule.os) {
        allowed = true;
      } else if (rule.os.name === osName) {
        if (!rule.os.arch || rule.os.arch === osArch) {
          allowed = true;
        }
      }
    } else if (rule.action === 'disallow') {
      if (!rule.os) {
        allowed = false;
      } else if (rule.os.name === osName) {
        if (!rule.os.arch || rule.os.arch === osArch) {
          allowed = false;
        }
      }
    }
  }
  return allowed;
}

function extractNatives(versionId, event) {
  const versionJsonPath = path.join(getGameDir(), 'versions', versionId, `${versionId}.json`);
  if (!fs.existsSync(versionJsonPath)) return;

  const versionJson = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
  const nativesDir = path.join(getGameDir(), 'versions', versionId, `${versionId}-natives`);
  ensureDir(nativesDir);

  const crypto = require('crypto');
  const versionHash = crypto.createHash('md5').update(fs.readFileSync(versionJsonPath)).digest('hex');
  const cacheStampPath = path.join(nativesDir, '.cache-stamp');
  
  if (fs.existsSync(cacheStampPath)) {
    const cachedHash = fs.readFileSync(cacheStampPath, 'utf8').trim();
    if (cachedHash === versionHash) {
      if (event) event.sender.send('launch-progress', { progress: 40, message: '本地库缓存有效，跳过解压...' });
      return;
    }
  }

  if (event) event.sender.send('launch-progress', { progress: 36, message: '正在解压本地库文件...' });

  fs.rmSync(nativesDir, { recursive: true, force: true });
  ensureDir(nativesDir);

  const librariesDir = path.join(getGameDir(), 'libraries');
  const AdmZip = require('adm-zip');
  let extracted = 0;
  const nativeLibs = versionJson.libraries.filter(lib => isLibAllowed(lib));
  const totalLibs = nativeLibs.length;
  let currentLib = 0;

  nativeLibs.forEach(lib => {
    let nativeJarPath = null;
    if (lib.downloads && lib.downloads.classifiers) {
      const classifiers = lib.downloads.classifiers;
      const osArch = process.arch === 'x64' ? '' : (process.arch === 'arm64' ? '-arm64' : '-x86');
      const candidates = [`natives-windows${osArch}`, 'natives-windows', 'windows'];
      for (const candidate of candidates) {
        if (classifiers[candidate]) {
          nativeJarPath = path.join(librariesDir, classifiers[candidate].path);
          break;
        }
      }
    }
    if (!nativeJarPath && lib.downloads && lib.downloads.artifact) {
      const libName = lib.name || '';
      if (libName.includes('natives-windows') && !libName.includes('arm64') && !libName.includes('-x86')) {
        nativeJarPath = path.join(librariesDir, lib.downloads.artifact.path);
      }
    }
    if (nativeJarPath && fs.existsSync(nativeJarPath) && nativeJarPath.endsWith('.jar')) {
      try {
        const zip = new AdmZip(nativeJarPath);
        zip.extractAllTo(nativesDir, true);
        extracted++;
      } catch (e) {
        try {
          const { execSync } = require('child_process');
          execSync(`jar xf "${nativeJarPath}"`, { cwd: nativesDir, stdio: 'ignore' });
          extracted++;
        } catch (e2) {}
      }
    }
    currentLib++;
    if (event && totalLibs > 0) {
      const progress = 36 + Math.floor((currentLib / totalLibs) * 8);
      event.sender.send('launch-progress', { progress: progress, message: `正在解压本地库文件 (${currentLib}/${totalLibs})...` });
    }
  });

  const x64Dir = path.join(nativesDir, 'windows', 'x64');
  if (fs.existsSync(x64Dir)) {
    function collectDlls(dir) {
      let dlls = [];
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const srcPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          dlls = dlls.concat(collectDlls(srcPath));
        } else if (item.name.endsWith('.dll')) {
          dlls.push({ src: srcPath, name: item.name });
        }
      }
      return dlls;
    }
    const dlls = collectDlls(x64Dir);
    for (const dll of dlls) {
      const destPath = path.join(nativesDir, dll.name);
      fs.copyFileSync(dll.src, destPath);
    }
  }

  fs.writeFileSync(cacheStampPath, versionHash);

  if (event) event.sender.send('launch-progress', { progress: 45, message: '本地库文件解压完成' });
}

function getClasspath(versionId) {
  const versionJsonPath = path.join(getGameDir(), 'versions', versionId, `${versionId}.json`);
  if (!fs.existsSync(versionJsonPath)) return '';

  const versionJson = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
  const librariesDir = path.join(getGameDir(), 'libraries');
  const classpath = [];

  versionJson.libraries.forEach(lib => {
    if (!isLibAllowed(lib)) return;
    const isNative = (lib.name || '').includes('natives-');
    if (isNative) return;
    if (lib.downloads && lib.downloads.artifact) {
      const libPath = path.join(librariesDir, lib.downloads.artifact.path);
      if (fs.existsSync(libPath)) {
        classpath.push(libPath);
      }
    }
  });

  classpath.push(path.join(getGameDir(), 'versions', versionId, `${versionId}.jar`));
  return classpath.join(';');
}

// 启动前验证：检查版本文件完整性
function validateVersion(versionId) {
  const versionDir = path.join(getGameDir(), 'versions', versionId);
  const jsonPath = path.join(versionDir, `${versionId}.json`);
  const jarPath = path.join(versionDir, `${versionId}.jar`);

  if (!fs.existsSync(jsonPath)) {
    return { ok: false, reason: `版本 JSON 文件不存在: ${versionId}.json`, fix: '请重新下载该版本' };
  }

  let versionJson;
  try {
    versionJson = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch (e) {
    return { ok: false, reason: `版本 JSON 文件损坏: ${e.message}`, fix: '请重新下载该版本' };
  }

  if (!versionJson.mainClass) {
    return { ok: false, reason: '版本 JSON 缺少 mainClass 字段', fix: '请重新下载该版本' };
  }

  if (!fs.existsSync(jarPath)) {
    return { ok: false, reason: `客户端 JAR 文件不存在: ${versionId}.jar`, fix: '请重新下载该版本' };
  }

  const jarSize = fs.statSync(jarPath).size;
  const expectedSize = versionJson.downloads?.client?.size;
  if (expectedSize && jarSize < expectedSize * 0.9) {
    return {
      ok: false,
      reason: `客户端 JAR 文件不完整 (当前 ${jarSize} 字节,预期 ${expectedSize} 字节)`,
      fix: '请删除该版本后重新下载'
    };
  }
  if (jarSize < 1000) {
    return {
      ok: false,
      reason: `客户端 JAR 文件异常 (${jarSize} 字节)`,
      fix: '请删除该版本后重新下载'
    };
  }

  return { ok: true, versionJson };
}

// 自动错误分析：根据日志内容识别常见错误并给出解决方案
function analyzeError(logText, exitCode) {
  const lower = logText.toLowerCase();
  const issues = [];

  // Java 版本不匹配
  if (lower.includes('unsupportedclassversionerror') || lower.includes('unsupported major.minor version')) {
    const match = logText.match(/unsupported major.minor version (\d+)/i);
    let need = 'Java 17+';
    if (match) {
      const v = parseInt(match[1]);
      if (v >= 65) need = 'Java 21';
      else if (v >= 61) need = 'Java 17';
      else if (v >= 55) need = 'Java 11';
    }
    issues.push({
      type: 'java-version',
      severity: 'critical',
      title: 'Java 版本过低',
      detail: `游戏需要 ${need},当前 Java 版本不满足要求`,
      solution: `请安装 ${need},并在设置中指定 Java 路径`
    });
  }

  // 内存不足
  if (lower.includes('outofmemoryerror') || lower.includes('could not reserve enough space')) {
    issues.push({
      type: 'memory',
      severity: 'critical',
      title: '内存不足',
      detail: 'JVM 无法分配足够内存',
      solution: '请在实例设置中降低游戏内存(如 2048M),或关闭其他占内存的程序'
    });
  }

  // Natives 缺失
  if (lower.includes('no such file') && lower.includes('lwjgl')) {
    issues.push({
      type: 'natives',
      severity: 'critical',
      title: '本地库(LWJGL)缺失',
      detail: '游戏缺少 LWJGL 本地库文件',
      solution: '请删除该版本目录下的 natives 文件夹后重新启动,启动器会自动重新解压'
    });
  }
  if (lower.includes('unsatisfiedlinkerror')) {
    issues.push({
      type: 'natives',
      severity: 'critical',
      title: '本地库链接失败',
      detail: '游戏无法加载本地库,可能是 natives 解压失败或架构不匹配',
      solution: '请删除版本目录下的 natives 文件夹后重新启动;若使用 32 位 Java 请更换为 64 位'
    });
  }

  // 类文件缺失 / classpath 问题
  if (lower.includes('noclassdeffounderror') || lower.includes('classnotfoundexception')) {
    const match = logText.match(/(?:noclassdeffounderror|classnotfoundexception)[:\s]+([^\s\r\n]+)/i);
    const className = match ? match[1] : '未知类';
    issues.push({
      type: 'missing-class',
      severity: 'critical',
      title: '类文件缺失',
      detail: `找不到类: ${className}`,
      solution: '库文件下载不完整,请删除该版本后重新下载'
    });
  }

  // Java 9+ 模块化类加载器不兼容 (LaunchWrapper 问题)
  if (lower.includes('classcastexception') && lower.includes('urlclassloader') && lower.includes('launchwrapper')) {
    issues.push({
      type: 'java-module',
      severity: 'critical',
      title: 'Java 版本不兼容',
      detail: '旧版 LaunchWrapper 无法在 Java 9+ 上运行,因为模块化系统改变了类加载机制',
      solution: '此版本(如 Forge 1.12.2 及更早版本)需要使用 Java 8 运行。请安装 Java 8 并在设置中指定其路径。'
    });
  }

  // 资源缺失
  if (lower.includes('failed to load asset') || lower.includes('asset')) {
    issues.push({
      type: 'assets',
      severity: 'warning',
      title: '资源文件缺失',
      detail: '部分游戏资源文件可能缺失',
      solution: '请重新下载该版本以补全资源文件'
    });
  }

  // 文件被占用
  if (lower.includes('file being used by another process') || lower.includes('access denied')) {
    issues.push({
      type: 'file-lock',
      severity: 'warning',
      title: '文件被占用',
      detail: '游戏文件被其他程序占用',
      solution: '请关闭其他可能占用该文件的程序(如其他启动器、杀毒软件)后重试'
    });
  }

  // Forge/Mod 相关
  if (lower.includes('forge') && lower.includes('error')) {
    issues.push({
      type: 'forge',
      severity: 'warning',
      title: 'Forge 加载异常',
      detail: 'Forge 模组加载器出现错误',
      solution: '请检查模组兼容性,或移除最近添加的模组'
    });
  }
  if (lower.includes('duplicate mod') || lower.includes('conflicting mod')) {
    issues.push({
      type: 'mod-conflict',
      severity: 'warning',
      title: '模组冲突',
      detail: '检测到重复或冲突的模组',
      solution: '请检查 mods 文件夹,移除重复或冲突的模组'
    });
  }

  // OpenGL / 显卡问题
  if (lower.includes('opengl') && (lower.includes('not supported') || lower.includes('error'))) {
    issues.push({
      type: 'opengl',
      severity: 'critical',
      title: 'OpenGL 不支持',
      detail: '显卡驱动不支持游戏所需的 OpenGL 版本',
      solution: '请更新显卡驱动到最新版本'
    });
  }

  // 退出码分析
  if (exitCode !== 0 && exitCode !== null && issues.length === 0 && logText.trim().length > 0) {
    issues.push({
      type: 'unknown',
      severity: 'warning',
      title: `游戏异常退出 (代码 ${exitCode})`,
      detail: '未识别到具体的错误类型',
      solution: '请查看下方完整日志,或重新下载游戏版本'
    });
  }

  if (exitCode === 0) {
    issues.push({
      type: 'info',
      severity: 'info',
      title: '游戏正常退出',
      detail: '游戏以退出码 0 正常结束',
      solution: ''
    });
  }

  return issues;
}

// AI 智能错误分析：综合日志、退出码、系统环境给出深度分析
function aiAnalyzeError(logText, exitCode, instanceConfig) {
  const issues = analyzeError(logText, exitCode);
  const analysis = {
    summary: '',
    issues: issues,
    autoFix: null,
    confidence: 0,
    steps: []
  };

  if (issues.length === 0 && exitCode === 0) {
    analysis.summary = '游戏运行正常,未检测到错误';
    analysis.confidence = 100;
    return analysis;
  }

  // 计算置信度和生成 AI 风格分析
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;

  if (criticalCount > 0) {
    analysis.confidence = Math.min(95, 70 + criticalCount * 10);
    analysis.summary = `检测到 ${criticalCount} 个严重问题${warningCount > 0 ? ` 和 ${warningCount} 个警告` : ''},游戏无法正常启动`;
  } else if (warningCount > 0) {
    analysis.confidence = 60;
    analysis.summary = `检测到 ${warningCount} 个警告,游戏可能存在运行问题`;
  } else if (exitCode !== 0) {
    analysis.confidence = 30;
    analysis.summary = '游戏异常退出,但未能识别具体错误原因';
  }

  // 生成排查步骤
  const steps = [];

  if (issues.some(i => i.type === 'java-version' || i.type === 'java-module' || i.type === 'java-missing')) {
    steps.push({ step: 1, action: '安装正确版本的 Java', detail: '游戏版本与 Java 版本不匹配,请安装对应版本的 Java' });
    steps.push({ step: 2, action: '在设置中配置 Java 路径', detail: '安装后请在设置 -> Java 路径中选择正确的 java.exe' });
    analysis.autoFix = { type: 'install-java', label: '自动下载并安装 Java', version: issues.some(i => i.type === 'java-module') ? 8 : 21 };
  }

  if (issues.some(i => i.type === 'missing-class')) {
    steps.push({ step: 1, action: '验证游戏文件完整性', detail: '库文件可能下载不完整' });
    steps.push({ step: 2, action: '重新下载游戏版本', detail: '删除当前版本后重新下载' });
    analysis.autoFix = { type: 'redownload-version', label: '重新下载游戏版本' };
  }

  if (issues.some(i => i.type === 'natives')) {
    steps.push({ step: 1, action: '删除 natives 目录', detail: '删除版本目录下的 natives 文件夹,启动器会自动重新解压' });
    steps.push({ step: 2, action: '验证 Java 架构', detail: '确保使用 64 位 Java,而非 32 位' });
    analysis.autoFix = { type: 'rebuild-natives', label: '重新解压本地库文件' };
  }

  if (issues.some(i => i.type === 'memory')) {
    steps.push({ step: 1, action: '降低内存分配', detail: '在实例设置中降低最大内存(如 2048M)' });
    steps.push({ step: 2, action: '关闭其他程序', detail: '关闭浏览器、其他游戏等占用内存的程序' });
    analysis.autoFix = { type: 'reduce-memory', label: '降低内存分配至 2048M' };
  }

  if (issues.some(i => i.type === 'opengl')) {
    steps.push({ step: 1, action: '更新显卡驱动', detail: '前往显卡官网下载最新驱动程序' });
    steps.push({ step: 2, action: '检查 OpenGL 支持', detail: '确认显卡支持 OpenGL 4.5 以上' });
  }

  if (issues.some(i => i.type === 'forge' || i.type === 'mod-conflict')) {
    steps.push({ step: 1, action: '检查模组兼容性', detail: '确认所有模组与当前 Forge/Fabric 版本兼容' });
    steps.push({ step: 2, action: '逐个禁用模组', detail: '逐个移除模组以定位冲突的模组' });
  }

  if (steps.length === 0 && exitCode !== 0) {
    steps.push({ step: 1, action: '查看完整日志', detail: '点击下方"查看完整日志"按钮查看详细输出' });
    steps.push({ step: 2, action: '重新下载游戏', detail: '如果问题持续,尝试删除后重新下载游戏版本' });
    steps.push({ step: 3, action: '检查 Java 版本', detail: '确认安装了正确版本的 Java (17 或 21)' });
  }

  analysis.steps = steps;
  return analysis;
}

// 执行自动修复
async function autoFixIssue(fixType, instanceId, event) {
  const configPath = getInstanceConfigPath(instanceId);
  if (!fs.existsSync(configPath)) return { success: false, message: '实例不存在' };

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  switch (fixType) {
    case 'reduce-memory':
      config.memory = Math.min(config.memory, 2048);
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      return { success: true, message: '已将内存调整为 ' + config.memory + 'M' };

    case 'rebuild-natives':
      const nativesDir = path.join(getGameDir(), 'versions', config.version, `${config.version}-natives`);
      if (fs.existsSync(nativesDir)) {
        fs.rmSync(nativesDir, { recursive: true, force: true });
      }
      extractNatives(config.version);
      return { success: true, message: '已重新解压本地库文件' };

    case 'redownload-version':
      // 仅删除版本目录标记,需用户手动重新下载
      return { success: false, message: '请在版本管理中删除该版本后重新下载' };

    case 'install-java':
      // 触发 Java 安装
      return { success: false, message: '请在设置中点击"自动安装 Java"' };

    default:
      return { success: false, message: '未知的修复类型' };
  }
}

ipcMain.handle('launch-game', async (event, instanceId) => {
  try {
  console.log('[Launcher] launch-game called with instanceId:', instanceId);
  
  const gameDir = getGameDir();
  console.log('[Launcher] gameDir:', gameDir);
  
  if (!instanceId) {
    throw new Error('实例ID不能为空');
  }
  
  const configPath = getInstanceConfigPath(instanceId);
  console.log('[Launcher] configPath:', configPath);
  
  if (!configPath) {
    throw new Error('无法获取实例配置路径');
  }
  
  if (!fs.existsSync(configPath)) {
    throw new Error('实例不存在');
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  console.log('[Launcher] config loaded:', JSON.stringify(config, null, 2));
  
  const settings = getSettings();
  console.log('[Launcher] settings loaded:', JSON.stringify(settings, null, 2));

  if (!config.gameDir || typeof config.gameDir !== 'string') {
    event.sender.send('launch-progress', { progress: -1, message: '配置错误', error: '实例配置缺少游戏目录路径' });
    throw new Error('实例配置缺少游戏目录路径');
  }

  if (!config.version || typeof config.version !== 'string') {
    event.sender.send('launch-progress', { progress: -1, message: '配置错误', error: '实例配置缺少版本信息' });
    throw new Error('实例配置缺少版本信息');
  }

  event.sender.send('launch-progress', { progress: 5, message: '读取实例配置...' });

  // 确保游戏目录存在
  try {
    console.log('[Launcher] Creating game directories, gameDir:', config.gameDir);
    ensureDir(config.gameDir);
    ensureDir(path.join(config.gameDir, 'resourcepacks'));
    ensureDir(path.join(config.gameDir, 'saves'));
    ensureDir(path.join(config.gameDir, 'mods'));
    ensureDir(path.join(config.gameDir, 'shaderpacks'));
  } catch (e) {
    event.sender.send('launch-progress', { progress: -1, message: '创建游戏目录失败', error: e.message });
    throw new Error('创建游戏目录失败: ' + e.message);
  }

  event.sender.send('launch-progress', { progress: 10, message: '验证版本文件...' });
  console.log('[Launcher] Validating version:', config.version);
  const validation = validateVersion(config.version);
  console.log('[Launcher] Validation result:', JSON.stringify(validation));
  
  if (!validation.ok) {
    event.sender.send('launch-progress', { progress: -1, message: '验证失败', error: validation.reason });
    event.sender.send('game-log', { type: 'error-analysis', issues: [{
      type: 'validation', severity: 'critical', title: '启动前验证失败',
      detail: validation.reason, solution: validation.fix
    }] });
    throw new Error('启动前验证失败: ' + validation.reason);
  }

  event.sender.send('launch-progress', { progress: 20, message: '检测 Java 运行环境...' });
  const javaPath = findJava();
  if (!javaPath) {
    event.sender.send('launch-progress', { progress: -1, message: '未检测到 Java', error: '系统未找到 Java 运行环境' });
    event.sender.send('game-log', { type: 'error-analysis', issues: [{
      type: 'java-missing', severity: 'critical', title: '未检测到 Java',
      detail: '系统未找到 Java 运行环境',
      solution: '请安装 Java 17 或更高版本(推荐 Java 21)'
    }] });
    throw new Error('Java not found. Please install Java 17 or later.');
  }

  event.sender.send('launch-progress', { progress: 35, message: '解压本地库文件(natives)...' });
  extractNatives(config.version, event);

  event.sender.send('launch-progress', { progress: 55, message: '构建类路径(classpath)...' });
  const classpath = getClasspath(config.version);
  if (!classpath) {
    event.sender.send('launch-progress', { progress: -1, message: '构建类路径失败', error: '无法构建 classpath' });
    throw new Error('Failed to build classpath. Is the version installed?');
  }

  event.sender.send('launch-progress', { progress: 65, message: '解析版本信息...' });

  const versionJson = validation.versionJson;
  
  event.sender.send('launch-progress', { progress: 72, message: '准备 JVM 参数...' });
  
  const defaultJvmArgs = [
    '-XX:-OmitStackTraceInFastThrow',
    '-Djdk.lang.Process.allowAmbiguousCommands=true',
    '-Dfml.ignoreInvalidMinecraftCertificates=true',
    '-Dfml.ignorePatchDiscrepancies=true'
  ];
  
  event.sender.send('launch-progress', { progress: 78, message: '组装启动参数...' });
  
  const args = [
    `-Xmx${config.memory}M`,
    `-Xms${Math.floor(config.memory / 2)}M`,
    ...defaultJvmArgs,
    '-Djava.library.path=' + path.join(getGameDir(), 'versions', config.version, `${config.version}-natives`),
    '-cp', classpath,
    versionJson.mainClass,
    '--gameDir', config.gameDir,
    '--assetsDir', path.join(getGameDir(), 'assets'),
    '--assetIndex', versionJson.assetIndex?.id || config.version,
    '--version', config.version,
    '--width', config.resolution.width.toString(),
    '--height', config.resolution.height.toString()
  ];

  event.sender.send('launch-progress', { progress: 82, message: '配置账号信息...' });

  const accountType = settings.accountType || 'offline';
  if (accountType === 'microsoft' && settings.microsoftAccount) {
    const acc = settings.microsoftAccount;
    args.push('--username', acc.name);
    args.push('--uuid', acc.uuid);
    args.push('--accessToken', acc.accessToken || '0');
    args.push('--userType', 'msa');
  } else {
    const playerName = settings.playerName || 'Player';
    args.push('--username', playerName);
    args.push('--uuid', generateOfflineUuid(playerName));
    args.push('--accessToken', '0');
    args.push('--userType', 'legacy');
  }

  if (config.javaArgs) {
    const extraArgs = config.javaArgs.trim().split(/\s+/).filter(a => a);
    args.splice(0, 0, ...extraArgs);
  }

  event.sender.send('launch-progress', { progress: 88, message: '启动游戏进程...' });

  let child;
  try {
    child = spawn(javaPath, args, {
      cwd: config.gameDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env }
    });
  } catch (err) {
    event.sender.send('launch-progress', { progress: -1, message: '启动失败', error: err.message });
    event.sender.send('game-log', { type: 'ai-analysis', analysis: {
      summary: '进程启动失败',
      confidence: 99,
      issues: [{ type: 'spawn-error', severity: 'critical', title: '进程启动失败', detail: err.message, solution: '请检查 Java 路径是否正确,或 Java 是否可执行' }],
      steps: [
        { step: 1, action: '检查 Java 路径', detail: '确认设置中指定的 Java 路径正确' },
        { step: 2, action: '验证 Java 可执行', detail: '在命令行中运行 java -version 检查是否正常' }
      ],
      autoFix: null
    }});
    throw new Error('启动游戏进程失败: ' + err.message);
  }

  event.sender.send('launch-progress', { progress: 100, message: '游戏已启动!' });

  // 收集日志用于错误分析
  let logBuffer = '';

  child.stdout.on('data', (data) => {
    const text = data.toString();
    logBuffer += text;
    if (logBuffer.length > 50000) logBuffer = logBuffer.slice(-40000);
    event.sender.send('game-log', { type: 'stdout', data: text });
  });

  child.stderr.on('data', (data) => {
    const text = data.toString();
    logBuffer += text;
    if (logBuffer.length > 50000) logBuffer = logBuffer.slice(-40000);
    event.sender.send('game-log', { type: 'stderr', data: text });
  });

  child.on('close', (code) => {
    event.sender.send('game-log', { type: 'close', code: code });
    const analysis = aiAnalyzeError(logBuffer, code, config);
    event.sender.send('game-log', { type: 'ai-analysis', analysis: analysis });
  });

  child.on('error', (err) => {
    event.sender.send('game-log', { type: 'ai-analysis', analysis: {
      summary: '进程启动失败',
      confidence: 99,
      issues: [{ type: 'spawn-error', severity: 'critical', title: '进程启动失败', detail: err.message, solution: '请检查 Java 路径是否正确,或 Java 是否可执行' }],
      steps: [
        { step: 1, action: '检查 Java 路径', detail: '确认设置中指定的 Java 路径正确' },
        { step: 2, action: '验证 Java 可执行', detail: '在命令行中运行 java -version 检查是否正常' }
      ],
      autoFix: null
    }});
  });

  return { success: true, pid: child.pid };
  } catch (error) {
    console.error('[Launcher] launch-game error:', error);
    console.error('[Launcher] error stack:', error.stack);
    throw error;
  }
});

// IPC: 执行自动修复
ipcMain.handle('auto-fix', async (event, fixType, instanceId) => {
  return await autoFixIssue(fixType, instanceId, event);
});

// ===== PCL Style Features =====

function copyInstanceDir(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return false;
  if (fs.existsSync(destDir)) fs.rmSync(destDir, { recursive: true, force: true });
  
  fs.mkdirSync(destDir, { recursive: true });
  const items = fs.readdirSync(srcDir, { withFileTypes: true });
  
  for (const item of items) {
    const srcPath = path.join(srcDir, item.name);
    const destPath = path.join(destDir, item.name);
    
    if (item.isDirectory()) {
      copyInstanceDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  return true;
}

ipcMain.handle('copy-instance', async (event, instanceId, newName) => {
  const configPath = getInstanceConfigPath(instanceId);
  if (!fs.existsSync(configPath)) {
    throw new Error('Instance not found');
  }
  
  const originalConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const newId = Date.now().toString();
  const newDir = getInstanceDir(newId);
  
  const originalDir = getInstanceDir(instanceId);
  copyInstanceDir(originalDir, newDir);
  
  const newConfig = {
    ...originalConfig,
    id: newId,
    name: newName || `${originalConfig.name} (副本)`,
    createdAt: new Date().toISOString()
  };
  
  fs.writeFileSync(getInstanceConfigPath(newId), JSON.stringify(newConfig, null, 2));
  return newConfig;
});

ipcMain.handle('export-instance', async (event, instanceId, exportPath) => {
  const instanceDir = getInstanceDir(instanceId);
  if (!fs.existsSync(instanceDir)) {
    throw new Error('Instance not found');
  }
  
  const AdmZip = require('adm-zip');
  const zip = new AdmZip();
  zip.addLocalFolder(instanceDir, path.basename(instanceDir));
  
  fs.mkdirSync(path.dirname(exportPath), { recursive: true });
  zip.writeZip(exportPath);
  
  return { success: true, path: exportPath };
});

ipcMain.handle('import-instance', async (event, zipPath) => {
  if (!fs.existsSync(zipPath)) {
    throw new Error('File not found');
  }
  
  const AdmZip = require('adm-zip');
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();
  
  const tempDir = path.join(getGameDir(), 'temp_import_' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });
  zip.extractAllTo(tempDir, true);
  
  const instanceDirs = fs.readdirSync(tempDir).filter(dir => {
    const configPath = path.join(tempDir, dir, 'instance.json');
    return fs.existsSync(configPath);
  });
  
  if (instanceDirs.length === 0) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    throw new Error('No instance found in the archive');
  }
  
  const sourceDir = path.join(tempDir, instanceDirs[0]);
  const configPath = path.join(sourceDir, 'instance.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  const newId = Date.now().toString();
  const newDir = getInstanceDir(newId);
  
  copyInstanceDir(sourceDir, newDir);
  
  const newConfig = {
    ...config,
    id: newId,
    gameDir: path.join(newDir, 'game'),
    modsDir: path.join(newDir, 'mods'),
    resourcePacksDir: path.join(newDir, 'resourcepacks'),
    shaderPacksDir: path.join(newDir, 'shaderpacks'),
    createdAt: new Date().toISOString()
  };
  
  fs.writeFileSync(getInstanceConfigPath(newId), JSON.stringify(newConfig, null, 2));
  fs.rmSync(tempDir, { recursive: true, force: true });
  
  return newConfig;
});

ipcMain.handle('backup-instance', async (event, instanceId) => {
  const instanceDir = getInstanceDir(instanceId);
  if (!fs.existsSync(instanceDir)) {
    throw new Error('Instance not found');
  }
  
  const config = JSON.parse(fs.readFileSync(getInstanceConfigPath(instanceId), 'utf8'));
  const backupsDir = path.join(getGameDir(), 'backups');
  ensureDir(backupsDir);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `${config.name}_${timestamp}.zip`;
  const backupPath = path.join(backupsDir, backupFileName);
  
  const AdmZip = require('adm-zip');
  const zip = new AdmZip();
  zip.addLocalFolder(instanceDir, config.name);
  zip.writeZip(backupPath);
  
  return { success: true, path: backupPath, fileName: backupFileName };
});

ipcMain.handle('get-instance-backups', () => {
  const backupsDir = path.join(getGameDir(), 'backups');
  if (!fs.existsSync(backupsDir)) return [];
  
  return fs.readdirSync(backupsDir)
    .filter(file => file.endsWith('.zip'))
    .map(file => {
      const filePath = path.join(backupsDir, file);
      const stats = fs.statSync(filePath);
      return {
        name: file.replace('.zip', ''),
        path: filePath,
        size: stats.size,
        date: stats.mtime
      };
    })
    .sort((a, b) => b.date - a.date);
});

ipcMain.handle('restore-backup', async (event, backupPath) => {
  if (!fs.existsSync(backupPath)) {
    throw new Error('Backup file not found');
  }
  
  const AdmZip = require('adm-zip');
  const zip = new AdmZip(backupPath);
  
  const tempDir = path.join(getGameDir(), 'temp_restore_' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });
  zip.extractAllTo(tempDir, true);
  
  const instanceDirs = fs.readdirSync(tempDir).filter(dir => {
    const configPath = path.join(tempDir, dir, 'instance.json');
    return fs.existsSync(configPath);
  });
  
  if (instanceDirs.length === 0) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    throw new Error('No instance found in backup');
  }
  
  const sourceDir = path.join(tempDir, instanceDirs[0]);
  const configPath = path.join(sourceDir, 'instance.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  const newId = Date.now().toString();
  const newDir = getInstanceDir(newId);
  
  copyInstanceDir(sourceDir, newDir);
  
  const newConfig = {
    ...config,
    id: newId,
    gameDir: path.join(newDir, 'game'),
    modsDir: path.join(newDir, 'mods'),
    resourcePacksDir: path.join(newDir, 'resourcepacks'),
    shaderPacksDir: path.join(newDir, 'shaderpacks'),
    createdAt: new Date().toISOString()
  };
  
  fs.writeFileSync(getInstanceConfigPath(newId), JSON.stringify(newConfig, null, 2));
  fs.rmSync(tempDir, { recursive: true, force: true });
  
  return newConfig;
});

ipcMain.handle('delete-backup', (event, backupPath) => {
  if (fs.existsSync(backupPath)) {
    fs.unlinkSync(backupPath);
  }
  return true;
});

// ===== Resource Pack Management =====

function getInstanceResourcePacksDir(instanceId) {
  return path.join(getGameDir(), 'instances', instanceId, 'resourcepacks');
}

function getGlobalResourcePacksDir() {
  return path.join(getGameDir(), 'resourcepacks');
}

ipcMain.handle('get-resource-packs', (event, instanceId) => {
  const globalDir = getGlobalResourcePacksDir();
  const instanceDir = getInstanceResourcePacksDir(instanceId);
  const packs = [];
  
  const scanDir = (dir, isGlobal) => {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory() || file.endsWith('.zip') || file.endsWith('.rar')) {
        packs.push({
          name: file.replace(/\.(zip|rar)$/i, ''),
          path: filePath,
          size: stats.size,
          isGlobal: isGlobal,
          date: stats.mtime
        });
      }
    });
  };
  
  scanDir(globalDir, true);
  scanDir(instanceDir, false);
  
  return packs.sort((a, b) => b.date - a.date);
});

ipcMain.handle('install-resource-pack', async (event, instanceId, packPath) => {
  const instanceDir = getInstanceResourcePacksDir(instanceId);
  ensureDir(instanceDir);
  
  const fileName = path.basename(packPath);
  const destPath = path.join(instanceDir, fileName);
  
  if (fs.existsSync(destPath)) {
    fs.unlinkSync(destPath);
  }
  
  if (packPath.endsWith('.zip') || packPath.endsWith('.rar')) {
    fs.copyFileSync(packPath, destPath);
  } else if (fs.statSync(packPath).isDirectory()) {
    copyInstanceDir(packPath, destPath);
  }
  
  return { success: true, path: destPath };
});

ipcMain.handle('uninstall-resource-pack', (event, instanceId, packName) => {
  const instanceDir = getInstanceResourcePacksDir(instanceId);
  const packPath = path.join(instanceDir, packName);
  
  if (fs.existsSync(packPath)) {
    if (fs.statSync(packPath).isDirectory()) {
      fs.rmSync(packPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(packPath);
    }
  }
  return true;
});

ipcMain.handle('open-resource-pack-dir', (event, instanceId) => {
  const dir = getInstanceResourcePacksDir(instanceId);
  ensureDir(dir);
  require('child_process').exec(`start "" "${dir}"`);
  return true;
});

// ===== Save Management =====

function getInstanceSavesDir(instanceId) {
  const configPath = getInstanceConfigPath(instanceId);
  if (!fs.existsSync(configPath)) return null;
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return path.join(config.gameDir, 'saves');
}

ipcMain.handle('get-saves', (event, instanceId) => {
  const savesDir = getInstanceSavesDir(instanceId);
  if (!savesDir || !fs.existsSync(savesDir)) return [];
  
  return fs.readdirSync(savesDir)
    .filter(dir => {
      const levelDat = path.join(savesDir, dir, 'level.dat');
      return fs.existsSync(levelDat);
    })
    .map(dir => {
      const savePath = path.join(savesDir, dir);
      const stats = fs.statSync(savePath);
      const levelDat = path.join(savePath, 'level.dat');
      let icon = null;
      const iconPath = path.join(savePath, 'icon.png');
      if (fs.existsSync(iconPath)) {
        icon = iconPath;
      }
      return {
        name: dir,
        path: savePath,
        size: stats.size,
        date: stats.mtime,
        icon: icon
      };
    })
    .sort((a, b) => b.date - a.date);
});

ipcMain.handle('export-save', async (event, instanceId, saveName, exportPath) => {
  const savesDir = getInstanceSavesDir(instanceId);
  if (!savesDir) throw new Error('Instance not found');
  
  const savePath = path.join(savesDir, saveName);
  if (!fs.existsSync(savePath)) throw new Error('Save not found');
  
  const AdmZip = require('adm-zip');
  const zip = new AdmZip();
  zip.addLocalFolder(savePath, saveName);
  
  fs.mkdirSync(path.dirname(exportPath), { recursive: true });
  zip.writeZip(exportPath);
  
  return { success: true, path: exportPath };
});

ipcMain.handle('import-save', async (event, instanceId, zipPath) => {
  const savesDir = getInstanceSavesDir(instanceId);
  if (!savesDir) throw new Error('Instance not found');
  ensureDir(savesDir);
  
  if (!fs.existsSync(zipPath)) throw new Error('File not found');
  
  const AdmZip = require('adm-zip');
  const zip = new AdmZip(zipPath);
  
  const tempDir = path.join(getGameDir(), 'temp_save_' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });
  zip.extractAllTo(tempDir, true);
  
  const saveDirs = fs.readdirSync(tempDir).filter(dir => {
    const levelDat = path.join(tempDir, dir, 'level.dat');
    return fs.existsSync(levelDat);
  });
  
  if (saveDirs.length === 0) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    throw new Error('No save found in archive');
  }
  
  const sourceDir = path.join(tempDir, saveDirs[0]);
  const destDir = path.join(savesDir, saveDirs[0]);
  
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }
  
  copyInstanceDir(sourceDir, destDir);
  fs.rmSync(tempDir, { recursive: true, force: true });
  
  return { success: true, name: saveDirs[0] };
});

ipcMain.handle('delete-save', (event, instanceId, saveName) => {
  const savesDir = getInstanceSavesDir(instanceId);
  if (!savesDir) return false;
  
  const savePath = path.join(savesDir, saveName);
  if (fs.existsSync(savePath)) {
    fs.rmSync(savePath, { recursive: true, force: true });
  }
  return true;
});

ipcMain.handle('backup-save', async (event, instanceId, saveName) => {
  const savesDir = getInstanceSavesDir(instanceId);
  if (!savesDir) throw new Error('Instance not found');
  
  const savePath = path.join(savesDir, saveName);
  if (!fs.existsSync(savePath)) throw new Error('Save not found');
  
  const backupsDir = path.join(getGameDir(), 'saves_backups');
  ensureDir(backupsDir);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `${saveName}_${timestamp}.zip`;
  const backupPath = path.join(backupsDir, backupFileName);
  
  const AdmZip = require('adm-zip');
  const zip = new AdmZip();
  zip.addLocalFolder(savePath, saveName);
  zip.writeZip(backupPath);
  
  return { success: true, path: backupPath };
});

ipcMain.handle('open-saves-dir', (event, instanceId) => {
  const dir = getInstanceSavesDir(instanceId);
  if (!dir) return false;
  ensureDir(dir);
  require('child_process').exec(`start "" "${dir}"`);
  return true;
});

// ===== Theme Management =====

ipcMain.handle('set-theme', (event, theme) => {
  const settings = getSettings();
  settings.theme = theme;
  saveSettings(settings);
  return true;
});

ipcMain.handle('get-theme', () => {
  return getSettings().theme || 'dark';
});
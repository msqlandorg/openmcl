const { ipcMain, shell, app } = require('electron');
const http = require('http');
const crypto = require('crypto');
const { getSettings, saveSettings } = require('./settings');

const REDIRECT_PORT = 29573;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/callback`;
const CLIENT_ID = '9c5b7424-16c9-4b8c-b511-a4214474b81c';
const SCOPE = 'XboxLive.signin offline_access';

function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url').replace(/[^a-zA-Z0-9\-_]/g, '');
}

function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url').replace(/[^a-zA-Z0-9\-_]/g, '');
}

function makePostRequest(hostname, path, data, headers) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams(data).toString();
    const req = http.request({
      hostname,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error('Parse error: ' + body)); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function makePostRequestHttps(hostname, path, data, headers) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const postData = typeof data === 'string' ? data : JSON.stringify(data);
    const req = https.request({
      hostname,
      path,
      method: 'POST',
      headers: {
        'Content-Type': typeof data === 'string' ? 'application/x-www-form-urlencoded' : 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error('Parse error: ' + body)); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function makeGetRequestHttps(hostname, path, headers) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const req = https.request({
      hostname,
      path,
      method: 'GET',
      headers: headers || {}
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error('Parse error: ' + body)); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

ipcMain.handle('microsoft-login', async (event) => {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = crypto.randomBytes(16).toString('hex');

  const authUrl = `https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?` +
    `client_id=${CLIENT_ID}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_mode=query` +
    `&scope=${encodeURIComponent(SCOPE)}` +
    `&state=${state}` +
    `&code_challenge=${codeChallenge}` +
    `&code_challenge_method=S256`;

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);

      if (url.pathname === '/callback') {
        const code = url.searchParams.get('code');
        const returnedState = url.searchParams.get('state');

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<html><body style="font-family:system-ui,Segoe UI,sans-serif;text-align:center;padding:60px;background:linear-gradient(135deg,#4b3fe3,#7c3aed);color:#fff;"><h2>登录成功!</h2><p>可以关闭此窗口返回启动器</p></body></html>');

        server.close();

        if (!code || returnedState !== state) {
          reject(new Error('登录失败: 无效的响应'));
          return;
        }

        loginWithMicrosoftCode(code, codeVerifier).then(resolve).catch(reject);
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    server.on('error', (err) => {
      reject(new Error('无法启动本地服务器: ' + err.message));
    });

    server.listen(REDIRECT_PORT, '127.0.0.1', () => {
      shell.openExternal(authUrl);
    });

    setTimeout(() => {
      server.close();
      reject(new Error('登录超时 (3分钟内未完成)'));
    }, 180000);
  });
});

async function loginWithMicrosoftCode(code, codeVerifier) {
  const https = require('https');

  const tokenData = await makePostRequestHttps(
    'login.microsoftonline.com',
    '/consumers/oauth2/v2.0/token',
    {
      client_id: CLIENT_ID,
      code,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier
    }
  );

  if (!tokenData.access_token) {
    throw new Error('Microsoft 登录失败: ' + (tokenData.error_description || tokenData.error || '未知错误'));
  }

  const xboxLiveData = await makePostRequestHttps(
    'user.auth.xboxlive.com',
    '/user/authenticate',
    {
      Properties: {
        AuthMethod: 'RPS',
        SiteName: 'user.auth.xboxlive.com',
        RpsTicket: `d=${tokenData.access_token}`
      },
      RelyingParty: 'http://auth.xboxlive.com',
      TokenType: 'JWT'
    },
    { 'x-xbl-contract-version': '1' }
  );

  if (!xboxLiveData.Token) {
    throw new Error('Xbox Live 认证失败');
  }

  const xstsData = await makePostRequestHttps(
    'xsts.auth.xboxlive.com',
    '/xsts/authorize',
    {
      Properties: {
        SandboxId: 'RETAIL',
        UserTokens: [xboxLiveData.Token]
      },
      RelyingParty: 'rp://api.minecraftservices.com/',
      TokenType: 'JWT'
    },
    { 'x-xbl-contract-version': '1' }
  );

  if (!xstsData.Token) {
    throw new Error('XSTS 认证失败: ' + (xstsData.Message || '未知错误'));
  }

  const userHash = xstsData.DisplayClaims?.xui?.[0]?.uhs;
  const mcData = await makePostRequestHttps(
    'api.minecraftservices.com',
    '/authentication/login_with_xbox',
    {
      identityToken: `XBL3.0 x=${userHash};${xstsData.Token}`
    }
  );

  if (!mcData.access_token) {
    throw new Error('Minecraft 认证失败: ' + (mcData.errorMessage || '未知错误'));
  }

  const profileData = await makeGetRequestHttps(
    'api.minecraftservices.com',
    '/minecraft/profile',
    { 'Authorization': `Bearer ${mcData.access_token}` }
  );

  const account = {
    name: profileData.name || 'Unknown',
    uuid: profileData.id,
    accessToken: mcData.access_token,
    refreshToken: tokenData.refresh_token,
    msAccessToken: tokenData.access_token,
    expiresAt: Date.now() + (mcData.expires_in || 86400) * 1000,
    skins: profileData.skins || []
  };

  const settings = getSettings();
  settings.microsoftAccount = account;
  settings.accountType = 'microsoft';
  settings.playerName = account.name;
  saveSettings(settings);

  return {
    name: account.name,
    uuid: account.uuid
  };
}

ipcMain.handle('microsoft-logout', () => {
  const settings = getSettings();
  settings.microsoftAccount = null;
  settings.accountType = 'offline';
  saveSettings(settings);
  return true;
});

ipcMain.handle('get-account-info', () => {
  const settings = getSettings();
  if (settings.accountType === 'microsoft' && settings.microsoftAccount) {
    return {
      type: 'microsoft',
      name: settings.microsoftAccount.name,
      uuid: settings.microsoftAccount.uuid
    };
  }
  return {
    type: 'offline',
    name: settings.playerName || 'Player'
  };
});

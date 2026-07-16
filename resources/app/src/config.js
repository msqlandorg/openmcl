const path = require('path');
let APP_DATA = path.join(process.env.APPDATA || process.env.HOME || '', 'CraftLauncher');
let GAME_DIR = path.join(APP_DATA, 'games');

function initPaths(app) {
  if (app && app.getPath) {
    try {
      APP_DATA = path.join(app.getPath('appData'), 'CraftLauncher');
      GAME_DIR = path.join(APP_DATA, 'games');
    } catch (e) {}
  }
}

module.exports = {
  get APP_DATA() { return APP_DATA; },
  get GAME_DIR() { return GAME_DIR; },
  initPaths
};
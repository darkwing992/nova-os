// Nova OS - system process.
// --emulator : runs in a window on your PC (the "emulator")
// --console  : runs full screen like a real console (used by the installer and the ISO)
const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { pathToFileURL } = require('url');
const AdmZip = require('adm-zip');

const emulator = process.argv.includes('--emulator') || !process.argv.includes('--console');
let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 760,
    minWidth: 960,
    minHeight: 560,
    backgroundColor: '#000000',
    title: emulator ? 'Nova OS Emulator' : 'Nova OS',
    fullscreen: !emulator,
    kiosk: !emulator,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
      contextIsolation: true,
    },
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'os', 'index.html'));
}
const send = (channel, data) => { if (win && !win.isDestroyed()) win.webContents.send(channel, data); };

// The Home key / F1 always goes back to the dashboard, even from inside an app or website.
app.on('web-contents-created', (_e, contents) => {
  contents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F1' || input.key === 'Home') {
      event.preventDefault();
      send('nova:home');
    }
    if (input.key === 'F11' && win) {
      event.preventDefault();
      win.setFullScreen(!win.isFullScreen());
    }
  });
  // Links that try to open a new window open inside the Nova browser instead.
  contents.setWindowOpenHandler(({ url }) => {
    send('nova:open-url', url);
    return { action: 'deny' };
  });
});

// ---------------- downloading apps from the web ----------------
// .zip / .nova / .html downloads become apps in the library; anything else goes to the Downloads folder.
const APPS_DIR = path.join(app.getPath('userData'), 'apps');
const PACKAGE_EXT = ['.zip', '.nova', '.html', '.htm'];
const pendingNames = new Map(); // url -> name the user typed in the Store
const COLORS = ['#1f6fff,#00c2ff', '#ff5c8a,#ffb347', '#00c27a,#00b3ff', '#8e2de2,#ff5c8a', '#ff6b35,#ffb347', '#0f9b8e,#3fd1a8'];

function uniquePath(dir, name) {
  const ext = path.extname(name), base = path.basename(name, ext);
  let p = path.join(dir, name), i = 1;
  while (fs.existsSync(p)) p = path.join(dir, `${base} (${i++})${ext}`);
  return p;
}
function findEntry(dir, depth = 0) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const index = entries.find((e) => e.isFile() && e.name.toLowerCase() === 'index.html');
  if (index) return path.join(dir, index.name);
  for (const e of entries) if (e.isDirectory() && depth < 3 && !e.name.startsWith('__MACOSX')) {
    const found = findEntry(path.join(dir, e.name), depth + 1);
    if (found) return found;
  }
  const html = entries.find((e) => e.isFile() && /\.html?$/i.test(e.name));
  return html ? path.join(dir, html.name) : null;
}
function prettyName(file) {
  return path.basename(file, path.extname(file)).replace(/[-_.]+/g, ' ').replace(/\s+/g, ' ').trim()
    .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Downloaded App';
}
function installPackage(file, fileName, id, givenName, bytes) {
  const dir = path.join(APPS_DIR, id);
  fs.mkdirSync(dir, { recursive: true });
  const ext = path.extname(fileName).toLowerCase();
  if (ext === '.zip' || ext === '.nova') {
    const zip = new AdmZip(file);
    for (const entry of zip.getEntries()) {
      const target = path.resolve(dir, entry.entryName);
      if (!target.startsWith(dir + path.sep)) throw new Error('unsafe file path inside the zip');
    }
    zip.extractAllTo(dir, true);
  } else {
    fs.copyFileSync(file, path.join(dir, 'index.html'));
  }
  fs.rmSync(file, { force: true });
  const entry = findEntry(dir);
  if (!entry) { fs.rmSync(dir, { recursive: true, force: true }); throw new Error('no .html file inside, so it is not a web game or app'); }
  let manifest = {};
  try { manifest = JSON.parse(fs.readFileSync(path.join(path.dirname(entry), 'nova.json'), 'utf8')); } catch (_) {}
  const record = {
    id,
    name: String(givenName || manifest.name || prettyName(fileName)).slice(0, 40),
    icon: String(manifest.icon || (manifest.type === 'app' ? '🧩' : '🎮')).slice(0, 4),
    color: manifest.color || COLORS[Math.floor(Math.random() * COLORS.length)],
    type: manifest.type === 'app' ? 'app' : 'game',
    kind: 'local',
    src: pathToFileURL(entry).href,
    desc: String(manifest.description || `Downloaded from the web (${fileName}).`).slice(0, 300),
    dev: String(manifest.developer || 'Downloaded').slice(0, 40),
    size: !bytes ? '' : bytes < 1048576 ? Math.max(1, Math.round(bytes / 1024)) + ' KB' : (bytes / 1048576).toFixed(1) + ' MB',
    custom: true,
    downloaded: true,
  };
  fs.writeFileSync(path.join(dir, 'nova-app.json'), JSON.stringify(record, null, 2));
  return record;
}
function hookDownloads(sess) {
  sess.on('will-download', (_e, item) => {
    const fileName = item.getFilename();
    const ext = path.extname(fileName).toLowerCase();
    const isApp = PACKAGE_EXT.includes(ext);
    const id = 'dl-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const firstUrl = item.getURLChain()[0] || item.getURL();
    const givenName = pendingNames.get(firstUrl) || '';
    pendingNames.delete(firstUrl);
    const target = isApp ? path.join(app.getPath('temp'), id + ext) : uniquePath(app.getPath('downloads'), fileName);
    item.setSavePath(target);
    const status = (extra) => send('nova:download', { id, name: givenName || fileName, isApp, received: item.getReceivedBytes(), total: item.getTotalBytes(), ...extra });
    status({ state: 'progress' });
    let lastSent = 0;
    item.on('updated', () => { if (Date.now() - lastSent > 200) { lastSent = Date.now(); status({ state: 'progress' }); } });
    item.once('done', (_ev, st) => {
      if (st !== 'completed') return status({ state: 'failed', error: st === 'cancelled' ? 'cancelled' : 'download interrupted' });
      if (!isApp) return status({ state: 'done', path: target });
      try { status({ state: 'installed', app: installPackage(target, fileName, id, givenName, item.getTotalBytes()) }); }
      catch (err) { status({ state: 'failed', error: err.message }); }
    });
  });
}

ipcMain.handle('nova:install-url', (_e, url, name) => {
  if (!/^https?:\/\//i.test(url)) return false;
  if (name) pendingNames.set(url, name);
  win.webContents.downloadURL(url);
  return true;
});
ipcMain.handle('nova:list-apps', () => {
  if (!fs.existsSync(APPS_DIR)) return [];
  return fs.readdirSync(APPS_DIR).flatMap((id) => {
    try { return [JSON.parse(fs.readFileSync(path.join(APPS_DIR, id, 'nova-app.json'), 'utf8'))]; } catch (_) { return []; }
  });
});
ipcMain.handle('nova:uninstall', (_e, id) => {
  if (id === '*') return fs.rmSync(APPS_DIR, { recursive: true, force: true });
  if (!/^dl-[\d-]+$/.test(id)) return;
  fs.rmSync(path.join(APPS_DIR, id), { recursive: true, force: true });
});

// ---------------- Wi-Fi (real installs use NetworkManager) ----------------
const { execFile } = require('child_process');
const nmcli = (args) => new Promise((resolve) => {
  execFile('nmcli', args, { timeout: 30000 }, (err, stdout, stderr) => resolve({ ok: !err, out: String(stdout), err: String(stderr || (err && err.message) || '') }));
});
ipcMain.handle('nova:wifi-list', async () => {
  if (process.platform !== 'linux') return { supported: false };
  const r = await nmcli(['-t', '-f', 'IN-USE,SSID,SIGNAL,SECURITY', 'device', 'wifi', 'list', '--rescan', 'yes']);
  if (!r.ok) return { supported: true, error: r.err.trim(), networks: [] };
  const seen = new Set();
  const networks = r.out.split('\n').map((line) => line.split(/(?<!\\):/)).filter((p) => p.length >= 4 && p[1])
    .map((p) => ({ active: p[0] === '*', ssid: p[1].replace(/\\:/g, ':'), signal: +p[2], secure: !!p[3] && p[3] !== '--' }))
    .filter((n) => !seen.has(n.ssid) && seen.add(n.ssid));
  return { supported: true, networks };
});
ipcMain.handle('nova:wifi-connect', async (_e, ssid, password) => {
  const args = ['device', 'wifi', 'connect', String(ssid)];
  if (password) args.push('password', String(password));
  const r = await nmcli(args);
  return { ok: r.ok, error: r.err.trim() };
});

// ---------------- system ----------------
ipcMain.handle('nova:info', () => ({ emulator, platform: process.platform, version: app.getVersion() }));
ipcMain.handle('nova:power', (_e, action) => {
  // Only a real install (console mode on Linux) controls the machine's power.
  if (!emulator && process.platform === 'linux') {
    if (action === 'shutdown') exec('systemctl poweroff');
    if (action === 'restart') exec('systemctl reboot');
    return;
  }
  if (action === 'shutdown') app.quit();
  if (action === 'restart') { app.relaunch(); app.exit(0); }
});
ipcMain.handle('nova:fullscreen', () => { if (win) win.setFullScreen(!win.isFullScreen()); });

app.whenReady().then(() => {
  hookDownloads(session.defaultSession);
  hookDownloads(session.fromPartition('persist:web'));
  createWindow();
});
app.on('window-all-closed', () => app.quit());

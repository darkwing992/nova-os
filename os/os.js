// Nova OS shell
const $ = (s) => document.getElementById(s);
const isElectron = !!window.novaSystem;

const BOOKMARKS = [
  { name: 'Google', icon: '🔎', url: 'https://www.google.com' },
  { name: 'YouTube', icon: '▶️', url: 'https://www.youtube.com' },
  { name: 'itch.io games', icon: '🕹️', url: 'https://itch.io/games/free/platform-web' },
  { name: 'Wikipedia', icon: '📚', url: 'https://en.wikipedia.org' },
  { name: 'Reddit', icon: '👽', url: 'https://www.reddit.com' },
  { name: 'Twitch', icon: '📺', url: 'https://www.twitch.tv' },
];
const FIND_LINKS = [
  { name: 'itch.io: free downloadable HTML5 games', url: 'https://itch.io/games/free/downloadable/html5' },
  { name: 'itch.io: games that run in the browser', url: 'https://itch.io/games/free/platform-web' },
  { name: 'GitHub: HTML5 game projects', url: 'https://github.com/topics/html5-game' },
];
const ICONS = {
  store: '<path d="M5 8h14l-1 12H6L5 8Zm4 0V6a3 3 0 0 1 6 0v2"/>',
  downloads: '<path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14"/>',
  library: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
  web: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.4 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.4-3.5-8.5s1-5.9 3.5-8.5Z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3m0 13v3m9.5-9.5h-3m-13 0h-3m16.2-6.7-2.1 2.1M7.4 16.6l-2.1 2.1m13.4 0-2.1-2.1M7.4 7.4 5.3 5.3"/>',
  power: '<path d="M12 3v9M7 6.3a7.5 7.5 0 1 0 10 0"/>',
};
const FUNCS = [
  { id: 'store', tip: 'Nova Store' },
  { id: 'downloads', tip: 'Downloads' },
  { id: 'library', tip: 'Library' },
  { id: 'web', tip: 'Web' },
  { id: 'settings', tip: 'Settings' },
  { id: 'power', tip: 'Power' },
];

// ---------------- saved state ----------------
const DEFAULT_STATE = () => ({
  setupDone: false,
  name: 'Player 1',
  theme: 0,
  sounds: true,
  motion: true,
  installed: CATALOG.filter((a) => a.preinstalled).map((a) => a.id),
  custom: [],
  recent: [],
  pinned: [],
  bookmarks: [],
  dlHistory: [],
});
let state;
try { state = Object.assign(DEFAULT_STATE(), JSON.parse(localStorage.getItem('nova.state') || '{}')); }
catch (_) { state = DEFAULT_STATE(); }
const save = () => { try { localStorage.setItem('nova.state', JSON.stringify(state)); } catch (_) {} };

const allApps = () => [...CATALOG, ...state.custom];
const getApp = (id) => allApps().find((a) => a.id === id);
const installedApps = () => state.installed.map(getApp).filter(Boolean);
const isInstalled = (id) => state.installed.includes(id);
const grad = (app) => { const [a, b] = (app.color || '#3a5bd9,#1c2f80').split(','); return `linear-gradient(135deg, ${a}, ${b || a})`; };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const typeName = (a) => (a.type === 'game' ? 'Game' : a.type === 'web' ? 'Web app' : 'App');
const visible = (id) => !$(id).classList.contains('hidden');

// ---------------- theme ----------------
function applyTheme() {
  const th = THEMES[state.theme] || THEMES[0];
  document.documentElement.style.setProperty('--accent', th.accent);
  document.documentElement.style.setProperty('--accent-2', th.glow);
  Background.setTheme(state.theme);
  Background.setAnimate(state.motion);
  $('profileName').textContent = state.name;
  $('avatar').textContent = (state.name[0] || 'P').toUpperCase();
  Sound.enabled = state.sounds;
}
function themeSwatches(container, onPick) {
  container.innerHTML = '';
  THEMES.forEach((th, i) => {
    const s = document.createElement('button');
    s.className = 'swatch nav' + (i === state.theme ? ' selected' : '');
    s.title = th.name;
    s.style.background = `linear-gradient(135deg, ${th.top}, ${th.mid})`;
    s.onclick = () => { state.theme = i; save(); applyTheme(); themeSwatches(container, onPick); container.children[i].focus(); onPick && onPick(); };
    container.appendChild(s);
  });
}

// ---------------- boot → welcome → shell ----------------
async function boot() {
  applyTheme();
  for (let i = 1; i <= 5; i++) {
    $('boot').querySelector('.boot-bar div').style.width = i * 20 + '%';
    await new Promise((r) => setTimeout(r, i === 1 ? 600 : 280));
  }
  $('boot').classList.add('fade');
  await new Promise((r) => setTimeout(r, 700));
  $('boot').classList.add('hidden');
  if (!state.setupDone) return showSetup();
  showWelcome();
}
function showSetup() {
  $('setup').classList.remove('hidden');
  themeSwatches($('setupThemes'));
  $('setupDone').onclick = () => {
    state.name = $('setupName').value.trim() || 'Player 1';
    state.setupDone = true; save();
    $('setup').classList.add('hidden');
    startShell();
    Toast.show(`Welcome, ${state.name}!`);
  };
  setTimeout(() => $('setupName').focus(), 50);
}
function showWelcome() {
  const w = $('welcome');
  $('welcomeTitle').textContent = `Welcome back, ${state.name}`;
  w.classList.remove('hidden');
  w.classList.add('nav'); w.tabIndex = 0;
  w.onclick = () => { w.classList.add('hidden'); Sound.play('select'); startShell(); };
  setTimeout(() => w.focus(), 50);
}
function startShell() {
  applyTheme();
  $('shell').classList.remove('hidden');
  buildFuncRow();
  goHome(true);
}

// ---------------- function row ----------------
function buildFuncRow() {
  const row = $('funcIcons'); row.innerHTML = '';
  FUNCS.forEach((f) => {
    const b = document.createElement('button');
    b.className = 'func nav'; b.dataset.id = f.id;
    b.innerHTML = `<svg viewBox="0 0 24 24">${ICONS[f.id]}</svg><span class="tip">${f.tip}</span>`;
    b.onclick = () => (f.id === 'power' ? openGuide() : openPage(f.id));
    row.appendChild(b);
  });
  $('whoBtn').onclick = () => openPage('settings');
  updateBadges();
}
function updateBadges() {
  const active = downloads.filter((d) => d.state === 'progress').length;
  const btn = document.querySelector('.func[data-id="downloads"]');
  if (!btn) return;
  btn.querySelector('.badge')?.remove();
  if (active) btn.insertAdjacentHTML('beforeend', `<span class="badge">${active}</span>`);
  let n = 0;
  try { for (const k in localStorage) if (k.startsWith('nova.app.') && k.endsWith('.best') && +localStorage.getItem(k) > 0) n++; } catch (_) {}
  $('trophyCount').textContent = n;
}

// ---------------- home content bar ----------------
let barItems = [], selIndex = 1;
const SPECIAL = {
  'x-store': { id: 'x-store', name: 'Nova Store', icon: '🛍️', color: '#1f6fff,#00c2ff', desc: 'Find new games and apps, or download them from the web.', sub: 'Store', open: () => openPage('store') },
  'x-web': { id: 'x-web', name: 'Web', icon: '🌐', color: '#0b8fd8,#29d3c7', desc: 'Browse the internet. Downloads of .zip or .html games install straight into your library.', sub: 'Internet browser', open: () => openPage('web') },
  'x-library': { id: 'x-library', name: 'Library', icon: '📚', color: '#5a3fd8,#9b6bff', desc: 'Everything installed on your console.', sub: 'All your games and apps', open: () => openPage('library') },
};
function buildBar() {
  const apps = installedApps().filter((a) => !a.system);
  const order = [...state.pinned, ...state.recent];
  apps.sort((a, b) => {
    const ia = order.indexOf(a.id), ib = order.indexOf(b.id);
    if (ia !== ib) return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
    return a.name.localeCompare(b.name);
  });
  barItems = [SPECIAL['x-store'], ...apps.slice(0, 14), SPECIAL['x-web'], SPECIAL['x-library']];
  const bar = $('bar'); bar.innerHTML = '';
  barItems.forEach((a, i) => {
    const t = makeTile(a);
    t.addEventListener('focus', () => select(i));
    t.onclick = () => (a.open ? a.open() : launch(a.id));
    bar.appendChild(t);
  });
  selIndex = Math.min(selIndex, barItems.length - 1);
  select(selIndex, true);
}
function makeTile(a) {
  const t = document.createElement('button');
  t.className = 'tile nav' + (running && running.app.id === a.id ? ' running' : '');
  t.style.background = grad(a);
  t.innerHTML = `<span class="t-icon">${esc(a.icon || '📦')}</span><span class="t-label">${esc(a.name)}</span>`;
  return t;
}
function select(i, instant) {
  selIndex = i;
  const tiles = $('bar').children;
  [...tiles].forEach((t, j) => t.classList.toggle('sel', j === i));
  const small = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tile')) || 132;
  const left = innerWidth < 860 ? 20 : 60;
  const bar = $('bar');
  if (instant) bar.style.transition = 'none';
  bar.style.transform = `translateX(${left - i * (small + 10)}px)`;
  if (instant) { bar.offsetWidth; bar.style.transition = ''; }
  const a = barItems[i];
  if (!a) return;
  $('selName').textContent = a.name;
  const best = a.type === 'game' ? Number(localStorage.getItem(`nova.app.${a.id}.best`) || 0) : 0;
  $('selSub').textContent = a.sub || [typeName(a), a.dev, best ? `Best: ${best}` : '', running && running.app.id === a.id ? 'Running' : ''].filter(Boolean).join('  ·  ');
  $('selDesc').textContent = a.desc || a.url || '';
  $('selStart').textContent = a.open ? 'Open' : running && running.app.id === a.id ? 'Resume' : 'Start';
  $('selDetails').classList.toggle('hidden', !!a.open);
}
$('selStart').onclick = () => { const a = barItems[selIndex]; a.open ? a.open() : launch(a.id); };
$('selDetails').onclick = () => openDetail(barItems[selIndex].id);

// ---------------- views ----------------
let currentPage = null;
function goHome(first) {
  $('guide').classList.add('hidden');
  $('detail').classList.add('hidden');
  if (visible('appView')) { $('appView').classList.add('hidden'); Nav.suspend(false); Background.pause(false); }
  currentPage = null;
  $('page').classList.remove('active');
  $('home').classList.add('active');
  buildBar();
  updateBadges();
  setTimeout(() => $('bar').children[selIndex]?.focus({ preventScroll: true }), first ? 80 : 20);
  if (!first) Sound.play('back');
}
const PAGE_TITLES = { library: 'Library', store: 'Nova Store', downloads: 'Downloads', web: 'Web', settings: 'Settings' };
const PAGE_CHIPS = {
  library: [['all', 'All'], ['game', 'Games'], ['app', 'Apps'], ['web', 'Web apps']],
  store: [['all', 'Featured'], ['game', 'Games'], ['app', 'Apps'], ['web', 'Web apps']],
};
let filter = 'all';
function openPage(name) {
  if (visible('appView')) { $('appView').classList.add('hidden'); Nav.suspend(false); Background.pause(false); }
  $('guide').classList.add('hidden');
  currentPage = name; filter = 'all';
  $('home').classList.remove('active');
  $('page').classList.add('active');
  $('pageTitle').textContent = PAGE_TITLES[name];
  document.querySelectorAll('.pg').forEach((p) => p.classList.toggle('active', p.id === 'pg-' + name));
  renderChips(name);
  renderPage();
  Sound.play('select');
  setTimeout(() => {
    const first = name === 'web' ? $('webBody').querySelector('.nav') || $('webUrl') : $('pg-' + name).querySelector('.nav');
    (first || $('pageBack')).focus({ preventScroll: true });
  }, 30);
}
function renderChips(name) {
  const box = $('pageChips'); box.innerHTML = '';
  (PAGE_CHIPS[name] || []).forEach(([f, label]) => {
    const c = document.createElement('button');
    c.className = 'chip nav' + (f === filter ? ' active' : '');
    c.textContent = label;
    c.onclick = () => { filter = f; renderChips(name); renderPage(); box.children[[...PAGE_CHIPS[name]].findIndex((x) => x[0] === f)].focus(); };
    box.appendChild(c);
  });
}
function renderPage() {
  ({ library: renderLibrary, store: renderStore, downloads: renderDownloads, web: renderWeb, settings: renderSettings })[currentPage]?.();
}
$('pageBack').onclick = () => goHome();

// ---------------- library ----------------
function renderLibrary() {
  const grid = $('libGrid'); grid.innerHTML = '';
  const list = installedApps().filter((a) => !a.system && (filter === 'all' || a.type === filter)).sort((a, b) => a.name.localeCompare(b.name));
  if (!list.length) grid.innerHTML = '<div class="empty">Nothing here yet. Visit the Nova Store to get something.</div>';
  list.forEach((a) => { const t = makeTile(a); t.onclick = () => launch(a.id); grid.appendChild(t); });
}

// ---------------- store ----------------
function renderStore() {
  const grid = $('storeGrid'); grid.innerHTML = '';
  allApps().filter((a) => !a.system && (filter === 'all' || a.type === filter))
    .sort((a, b) => isInstalled(a.id) - isInstalled(b.id))
    .forEach((a) => {
      const b = document.createElement('button');
      b.className = 'store-item nav';
      b.innerHTML = `<div class="s-icon" style="background:${grad(a)}">${esc(a.icon)}</div>
        <div class="s-info"><div class="s-name">${esc(a.name)}</div><div class="s-desc">${esc(a.desc || a.url || '')}</div>
        <div class="s-meta">${esc(a.dev || 'Custom')} · ${esc(a.size || 'Web')}</div></div>
        <span class="s-state ${isInstalled(a.id) ? 'installed' : ''}">${isInstalled(a.id) ? 'Installed' : 'Get'}</span>`;
      b.onclick = () => openDetail(a.id);
      grid.appendChild(b);
    });
  const links = $('findLinks'); links.innerHTML = '';
  FIND_LINKS.forEach((l) => {
    const b = document.createElement('button');
    b.className = 'nav link-btn'; b.textContent = l.name;
    b.onclick = () => { openPage('web'); openUrl(l.url); };
    links.appendChild(b);
  });
}

function openDetail(id) {
  const a = getApp(id);
  if (!a) return;
  const card = $('detailCard');
  const inst = isInstalled(id);
  const pinned = state.pinned.includes(id);
  card.innerHTML = `<div class="detail-banner" style="background:${grad(a)}">${esc(a.icon)}</div>
    <div class="detail-body"><h1>${esc(a.name)}</h1>
    <div class="meta">${esc(a.dev || 'Custom')} · ${typeName(a)} · ${esc(a.size || 'Web')}</div>
    <p>${esc(a.desc || a.url || '')}</p>
    <div class="detail-actions" id="detailActions">
      ${inst ? `<button class="nav btn primary" data-do="open">Start</button>
        <button class="nav btn ghost" data-do="pin">${pinned ? 'Unpin from Home' : 'Pin to front of Home'}</button>
        <button class="nav btn danger" data-do="remove">Uninstall</button>`
      : `<button class="nav btn primary" data-do="install">Download</button>`}
      <button class="nav btn ghost" data-do="close">Close</button>
    </div></div>`;
  $('detail').classList.remove('hidden');
  card.querySelectorAll('[data-do]').forEach((btn) => (btn.onclick = () => detailAction(a, btn.dataset.do)));
  Nav.focusFirst(card);
}
function closeDetail() {
  $('detail').classList.add('hidden');
  if (currentPage) { renderPage(); Nav.focusFirst($('pg-' + currentPage)); }
  else goHome(true);
}
function detailAction(a, what) {
  if (what === 'close') return closeDetail();
  if (what === 'open') { $('detail').classList.add('hidden'); return launch(a.id); }
  if (what === 'pin') {
    state.pinned = state.pinned.includes(a.id) ? state.pinned.filter((x) => x !== a.id) : [a.id, ...state.pinned];
    save(); Toast.show(state.pinned.includes(a.id) ? `📌 ${a.name} pinned to Home` : `${a.name} unpinned`);
    return openDetail(a.id);
  }
  if (what === 'remove') {
    state.installed = state.installed.filter((x) => x !== a.id);
    state.pinned = state.pinned.filter((x) => x !== a.id);
    state.recent = state.recent.filter((x) => x !== a.id);
    if (a.custom) state.custom = state.custom.filter((x) => x.id !== a.id);
    if (a.downloaded && isElectron) window.novaSystem.uninstall(a.id);
    if (running && running.app.id === a.id) closeApp();
    save(); Toast.show(`🗑️ ${a.name} uninstalled`);
    return a.custom ? closeDetail() : openDetail(a.id);
  }
  if (what === 'install') {
    const actions = $('detailActions');
    actions.innerHTML = `<div class="progress"><div></div></div><span id="pct">0%</span>`;
    let p = 0;
    const timer = setInterval(() => {
      p = Math.min(100, p + 4 + Math.random() * 14);
      actions.querySelector('.progress div').style.width = p + '%';
      $('pct').textContent = p < 100 ? Math.floor(p) + '%' : 'Done';
      if (p >= 100) {
        clearInterval(timer);
        state.installed.push(a.id); save();
        Sound.play('install'); Toast.show(`✅ ${a.name} installed`);
        setTimeout(() => openDetail(a.id), 350);
      }
    }, 120);
  }
}

// ---------------- downloading apps from the web ----------------
const downloads = [];
const PACKAGE_RE = /\.(zip|nova|html?)([?#].*)?$/i;
function installFromWeb(url, name) {
  url = (url || '').trim();
  if (!url) return Toast.show('Paste a link first');
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  if (PACKAGE_RE.test(url)) {
    if (!isElectron) return Toast.show('Downloading apps works in the Nova emulator or on a real install');
    window.novaSystem.installUrl(url, name || '');
    Toast.show('⬇ Download started');
    return openPage('downloads');
  }
  // a normal website becomes a web app
  let host = url; try { host = new URL(url).hostname.replace(/^www\./, ''); } catch (_) {}
  const id = 'custom-' + Date.now();
  const colors = ['#1f6fff,#00c2ff', '#ff5c8a,#ffb347', '#00c27a,#00b3ff', '#8e2de2,#ff5c8a'];
  state.custom.push({ id, name: name || host, url, kind: 'web', type: 'web', custom: true, icon: '🌍', color: colors[state.custom.length % colors.length], desc: url, dev: host, size: 'Web' });
  state.installed.push(id); save();
  Sound.play('install'); Toast.show(`✅ ${name || host} added to your library`);
  renderPage();
}
$('dlGo').onclick = () => { installFromWeb($('dlUrl').value, $('dlName').value.trim()); $('dlUrl').value = ''; $('dlName').value = ''; };
$('dlUrl').onkeydown = (e) => { if (e.key === 'Enter') $('dlGo').click(); };

function onDownloadEvent(d) {
  let item = downloads.find((x) => x.id === d.id);
  if (!item) { item = { ...d }; downloads.unshift(item); if (d.state === 'progress') Toast.show(`⬇ Downloading ${d.name}`); }
  Object.assign(item, d);
  if (d.state === 'installed' && d.app) {
    if (!getApp(d.app.id)) state.custom.push(d.app);
    if (!isInstalled(d.app.id)) state.installed.push(d.app.id);
    state.pinned = [d.app.id, ...state.pinned.filter((x) => x !== d.app.id)];
    save(); Sound.play('install');
    Toast.show(`✅ ${d.app.name} installed. It's on your Home screen.`);
  }
  if (d.state === 'done') Toast.show(`📄 ${d.name} saved to Downloads`);
  if (d.state === 'failed') Toast.show(`⚠️ ${d.name} failed: ${d.error || 'download stopped'}`);
  if (d.state !== 'progress') {
    state.dlHistory = [{ id: d.id, name: d.name, state: d.state, error: d.error, appId: d.app && d.app.id, path: d.path, t: Date.now() },
      ...state.dlHistory.filter((x) => x.id !== d.id)].slice(0, 30);
    save();
  }
  updateBadges();
  if (currentPage === 'downloads') renderDownloads();
  if (!currentPage && d.state === 'installed' && !visible('appView')) buildBar();
}
function renderDownloads() {
  const list = $('dlList'); list.innerHTML = '';
  const items = [...downloads.filter((d) => d.state === 'progress'), ...state.dlHistory];
  if (!items.length) {
    list.innerHTML = `<div class="empty">No downloads yet.<br><br>Open <b>Web</b> and download a game (.zip or .html), or paste a link in the Nova Store. It installs itself and shows up on Home.</div>`;
    return;
  }
  items.forEach((d) => {
    const pct = d.total ? Math.floor((d.received / d.total) * 100) : 0;
    const text = d.state === 'progress' ? (d.total ? `${pct}% · ${(d.received / 1048576).toFixed(1)} of ${(d.total / 1048576).toFixed(1)} MB` : `${(d.received / 1048576 || 0).toFixed(1)} MB`)
      : d.state === 'installed' ? 'Installed to your library' : d.state === 'done' ? 'Saved to your Downloads folder' : 'Failed' + (d.error ? `: ${d.error}` : '');
    const el = document.createElement(d.state === 'installed' && d.appId ? 'button' : 'div');
    el.className = 'dl' + (el.tagName === 'BUTTON' ? ' nav store-item' : '');
    el.innerHTML = `<span class="dl-icon">${d.state === 'installed' ? '🎮' : d.state === 'failed' ? '⚠️' : d.state === 'done' ? '📄' : '⬇'}</span>
      <div class="dl-main"><div class="dl-name">${esc(d.name)}</div><div class="dl-state">${esc(text)}</div>
      ${d.state === 'progress' ? `<div class="progress"><div style="width:${pct}%"></div></div>` : ''}</div>`;
    if (el.tagName === 'BUTTON') el.onclick = () => launch(d.appId);
    list.appendChild(el);
  });
}
if (isElectron) {
  window.novaSystem.onDownload(onDownloadEvent);
  // make sure apps downloaded earlier are in the library even if saved data was cleared
  window.novaSystem.listApps().then((apps) => {
    let changed = false;
    for (const a of apps) {
      if (!getApp(a.id)) { state.custom.push(a); changed = true; }
      if (!isInstalled(a.id) && !state.uninstalled?.includes(a.id)) { state.installed.push(a.id); changed = true; }
    }
    if (changed) { save(); if (!currentPage && visible('shell')) buildBar(); }
  });
}

// ---------------- running apps ----------------
let running = null;
function makeFrame(url, isWeb) {
  if (isWeb && isElectron) {
    const w = document.createElement('webview');
    w.setAttribute('src', url);
    w.setAttribute('allowpopups', '');
    w.setAttribute('partition', 'persist:web');
    return w;
  }
  const f = document.createElement('iframe');
  f.src = url;
  f.allow = 'autoplay; fullscreen; gamepad; clipboard-read; clipboard-write';
  return f;
}
function launch(id) {
  const app = getApp(id);
  if (!app) return;
  if (app.kind === 'system') return openPage(id);
  state.recent = [id, ...state.recent.filter((x) => x !== id)].slice(0, 20); save();
  if (running && running.app.id === id) return showAppView();
  closeApp();
  const frame = makeFrame(app.kind === 'web' ? app.url : app.src, app.kind === 'web');
  $('appHost').appendChild(frame);
  running = { app, frame };
  selIndex = 1;
  showAppView();
}
function showAppView() {
  Sound.play('select');
  $('detail').classList.add('hidden');
  $('appView').classList.remove('hidden');
  Nav.suspend(true);
  Background.pause(true);
  setTimeout(() => running && running.frame.focus(), 60);
}
function closeApp() {
  if (!running) return;
  running.frame.remove();
  running = null;
  $('appView').classList.add('hidden');
  Nav.suspend(false);
  Background.pause(false);
}
$('homePill').onclick = () => openGuide();
window.addEventListener('message', (e) => {
  const m = e.data || {};
  if (m.nova === 'home') goHome();
  if (m.nova === 'guide') openGuide();
  if (m.nova === 'toast') { Toast.show(String(m.text || '')); updateBadges(); }
});

// ---------------- quick menu / power ----------------
function openGuide(mode) {
  const list = $('guideList'); list.innerHTML = '';
  const add = (icon, label, fn, cls = '') => {
    const b = document.createElement('button');
    b.className = 'nav btn ' + cls;
    b.innerHTML = `<span>${icon}</span><span>${esc(label)}</span>`;
    b.onclick = fn; list.appendChild(b);
  };
  const appVisible = visible('appView');
  if (mode === 'confirm-reset') {
    $('guideTitle').textContent = 'Erase everything?';
    add('⚠️', 'Yes, factory reset', () => { if (isElectron) window.novaSystem.uninstall('*'); localStorage.clear(); location.reload(); }, 'danger');
    add('✖', 'Cancel', closeGuide);
  } else {
    $('guideTitle').textContent = running ? running.app.name : 'Quick menu';
    if (appVisible) add('▶', 'Resume', closeGuide);
    add('⌂', 'Home', () => goHome());
    if (running) add('✖', `Close ${running.app.name}`, () => { closeApp(); goHome(); });
    add('⬇', 'Downloads', () => openPage('downloads'));
    add('⚙', 'Settings', () => openPage('settings'));
    add('🌙', 'Lock (back to welcome)', () => { closeGuide(); $('shell').classList.add('hidden'); showWelcome(); });
    add('⟳', 'Restart', () => power('restart'));
    add('⏻', 'Turn off', () => power('shutdown'), 'danger');
  }
  $('guide').classList.remove('hidden');
  Nav.suspend(false);
  Nav.focusFirst(list);
}
function closeGuide() {
  $('guide').classList.add('hidden');
  if (visible('appView')) { Nav.suspend(true); running && running.frame.focus(); }
  else if (!currentPage) $('bar').children[selIndex]?.focus({ preventScroll: true });
}
function power(action) {
  $('guide').classList.add('hidden');
  document.body.innerHTML = `<div class="layer" style="background:#000"><div class="nova-mark small"></div><p style="opacity:.7">${action === 'restart' ? 'Restarting…' : 'Shutting down…'}</p></div>`;
  setTimeout(() => {
    if (isElectron) window.novaSystem.power(action);
    else if (action === 'restart') location.reload();
    else document.body.innerHTML = '<div class="layer" style="background:#000"><p style="opacity:.7">It is now safe to close this window.</p></div>';
  }, 900);
}

// ---------------- web browser ----------------
let webFrame = null;
function toUrl(text) {
  text = text.trim();
  if (!text) return '';
  if (/^https?:\/\//i.test(text)) return text;
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(text)) return 'https://' + text;
  return 'https://www.google.com/search?q=' + encodeURIComponent(text);
}
function renderWeb() { if (!webFrame) showStartPage(); }
function showStartPage() {
  if (webFrame) { webFrame.remove(); webFrame = null; }
  $('webUrl').value = '';
  const marks = [...BOOKMARKS, ...state.bookmarks.map((b) => ({ ...b, icon: '⭐' }))];
  $('webBody').innerHTML = `<div class="start-page"><h1>Where to?</h1>
    <div class="start-search"><input class="nav" id="startSearch" placeholder="Search the web"><button class="nav btn primary" id="startGo">Search</button></div>
    <div class="quick">${marks.map((b, i) => `<button class="nav" data-i="${i}"><span>${esc(b.icon)}</span>${esc(b.name)}</button>`).join('')}</div>
    <p class="muted" style="margin-top:30px">Tip: download a game as a .zip or .html file and Nova installs it into your library automatically.</p></div>`;
  $('webBody').querySelectorAll('.quick button').forEach((b) => (b.onclick = () => openUrl(marks[b.dataset.i].url)));
  $('startGo').onclick = () => openUrl(toUrl($('startSearch').value));
  $('startSearch').onkeydown = (e) => { if (e.key === 'Enter') openUrl(toUrl(e.target.value)); };
}
function openUrl(url) {
  if (!url) return;
  if (currentPage !== 'web') openPage('web');
  $('webBody').innerHTML = '';
  webFrame = makeFrame(url, true);
  $('webBody').appendChild(webFrame);
  $('webUrl').value = url;
  if (isElectron) {
    const sync = (e) => { $('webUrl').value = e.url; };
    webFrame.addEventListener('did-navigate', sync);
    webFrame.addEventListener('did-navigate-in-page', (e) => e.isMainFrame && sync(e));
  } else {
    const note = document.createElement('div');
    note.className = 'web-note';
    note.textContent = 'Preview mode: some sites refuse to load here. In the Nova emulator or a real install every site works.';
    $('webBody').appendChild(note);
  }
}
$('webGo').onclick = () => openUrl(toUrl($('webUrl').value));
$('webUrl').onkeydown = (e) => { if (e.key === 'Enter') openUrl(toUrl(e.target.value)); };
$('webHome').onclick = showStartPage;
$('webBack').onclick = () => { if (webFrame && isElectron && webFrame.canGoBack()) webFrame.goBack(); else if (webFrame) showStartPage(); };
$('webFwd').onclick = () => { if (webFrame && isElectron && webFrame.canGoForward()) webFrame.goForward(); };
$('webReload').onclick = () => { if (!webFrame) return; if (isElectron) webFrame.reload(); else webFrame.src = webFrame.src; };
$('webStar').onclick = () => {
  const url = $('webUrl').value.trim();
  if (!url) return Toast.show('Open a page first');
  if (state.bookmarks.some((b) => b.url === url)) return Toast.show('Already bookmarked');
  let name; try { name = new URL(url).hostname.replace(/^www\./, ''); } catch (_) { name = url; }
  state.bookmarks.push({ name, url }); save();
  Toast.show('⭐ Bookmarked ' + name);
};
if (isElectron) window.novaSystem.onOpenUrl((url) => openUrl(url));

// ---------------- settings ----------------
function renderSettings() {
  $('setName').value = state.name;
  $('setName').oninput = (e) => { state.name = e.target.value.trim() || 'Player 1'; save(); applyTheme(); };
  themeSwatches($('setThemes'));
  renderNetStatus();
  $('setSounds').checked = state.sounds;
  $('setSounds').onchange = (e) => { state.sounds = e.target.checked; save(); applyTheme(); };
  $('setMotion').checked = state.motion;
  $('setMotion').onchange = (e) => { state.motion = e.target.checked; save(); applyTheme(); };
  let bytes = 0;
  try { for (const k in localStorage) if (localStorage.hasOwnProperty(k)) bytes += (localStorage[k] || '').length * 2; } catch (_) {}
  const dl = state.custom.filter((a) => a.downloaded).length;
  $('storageInfo').textContent = `${installedApps().filter((a) => !a.system).length} games and apps installed (${dl} downloaded from the web) · ${(bytes / 1024).toFixed(1)} KB of saved data`;
  if (isElectron) window.novaSystem.info().then((i) => {
    $('sysInfo').textContent = `Nova OS ${i.version} · ${i.emulator ? 'Emulator' : 'Console'} mode · ${i.platform}`;
  });
  else $('sysInfo').textContent = 'Nova OS 2.0 · Browser preview mode';
}
function renderNetStatus() {
  $('netStatus').textContent = navigator.onLine ? '✅ Connected to the internet' : '⚠️ Not connected. Plug in a network cable or pick a Wi-Fi network.';
}
$('wifiScan').onclick = async () => {
  const box = $('wifiList');
  if (!isElectron) { box.innerHTML = '<p class="muted">Wi-Fi setup works on a real Nova install. In the emulator, Nova uses your PC\'s internet.</p>'; return; }
  box.innerHTML = '<p class="muted">Searching…</p>';
  const r = await window.novaSystem.wifiList();
  if (!r.supported) { box.innerHTML = '<p class="muted">Wi-Fi setup works on a real Nova install. In the emulator, Nova uses your PC\'s internet.</p>'; return; }
  if (r.error || !r.networks.length) { box.innerHTML = `<p class="muted">${esc(r.error || 'No Wi-Fi networks found.')}</p>`; return; }
  box.innerHTML = '';
  r.networks.forEach((n) => {
    const b = document.createElement('button');
    b.className = 'nav wifi';
    b.innerHTML = `<span>${n.active ? '✅ ' : ''}${esc(n.ssid)}</span><span>${n.secure ? '🔒 ' : ''}${n.signal}%</span>`;
    b.onclick = () => {
      if (!n.secure) return wifiJoin(n.ssid, '');
      box.querySelector('.wifi-pw')?.remove();
      const row = document.createElement('div');
      row.className = 'wifi-pw';
      row.innerHTML = `<input class="nav" type="password" placeholder="Password for ${esc(n.ssid)}"><button class="nav btn primary">Join</button>`;
      b.after(row);
      const input = row.querySelector('input');
      row.querySelector('button').onclick = () => wifiJoin(n.ssid, input.value);
      input.onkeydown = (e) => { if (e.key === 'Enter') wifiJoin(n.ssid, input.value); };
      input.focus();
    };
    box.appendChild(b);
  });
};
async function wifiJoin(ssid, password) {
  Toast.show(`Connecting to ${ssid}…`);
  const r = await window.novaSystem.wifiConnect(ssid, password);
  Toast.show(r.ok ? `✅ Connected to ${ssid}` : `⚠️ Couldn't connect: ${r.error || 'check the password'}`);
  if (r.ok) { $('wifiList').innerHTML = ''; setTimeout(renderNetStatus, 1500); }
}
addEventListener('online', renderNetStatus);
addEventListener('offline', renderNetStatus);
$('setFullscreen').onclick = () => {
  if (isElectron) window.novaSystem.fullscreen();
  else if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen();
};
$('setResetApps').onclick = () => {
  state.installed = [...new Set([...DEFAULT_STATE().installed, ...state.installed])];
  save(); Toast.show('Default apps restored'); renderSettings();
};
$('setFactory').onclick = () => openGuide('confirm-reset');

// ---------------- global input ----------------
Nav.onHome(() => { if (visible('shell')) goHome(); });
Nav.onGuide(() => { if (visible('shell')) openGuide(); });
Nav.onBack(() => {
  if (visible('detail')) { Sound.play('back'); return closeDetail(); }
  if (visible('guide')) { Sound.play('back'); return closeGuide(); }
  if (!visible('shell')) return;
  if (currentPage) return goHome();
  $('bar').children[selIndex]?.focus({ preventScroll: true });
});
if (isElectron) window.novaSystem.onHome(() => { if (visible('shell')) goHome(); });

// ---------------- clock ----------------
function tick() { $('clock').textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
setInterval(tick, 5000); tick();

boot();

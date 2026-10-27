const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('novaSystem', {
  info: () => ipcRenderer.invoke('nova:info'),
  power: (action) => ipcRenderer.invoke('nova:power', action),
  fullscreen: () => ipcRenderer.invoke('nova:fullscreen'),
  installUrl: (url, name) => ipcRenderer.invoke('nova:install-url', url, name),
  listApps: () => ipcRenderer.invoke('nova:list-apps'),
  uninstall: (id) => ipcRenderer.invoke('nova:uninstall', id),
  wifiList: () => ipcRenderer.invoke('nova:wifi-list'),
  wifiConnect: (ssid, password) => ipcRenderer.invoke('nova:wifi-connect', ssid, password),
  onHome: (fn) => ipcRenderer.on('nova:home', fn),
  onOpenUrl: (fn) => ipcRenderer.on('nova:open-url', (_e, url) => fn(url)),
  onDownload: (fn) => ipcRenderer.on('nova:download', (_e, d) => fn(d)),
});

const { app, BrowserWindow, Tray, Menu, session } = require('electron');
const path = require('path');

let mainWindow;
let tray = null;

const FAKE_DOMAIN = 'https://node-guardian-forge.lovable.app';

// Игнорируем ошибки сертификатов (помогает при WSS ошибках)
app.commandLine.appendSwitch('ignore-certificate-errors'); 

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 450,
    height: 700,
    resizable: false,
    title: "GCS Node Client",
    icon: path.join(__dirname, '../public/icon.png'),
    frame: true,
    autoHideMenuBar: true,
    backgroundColor: '#050510',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false, // Отключаем проверку CORS полностью
      allowRunningInsecureContent: true
    }
  });

  // --- МАСКИРОВКА ПОД САЙТ ---
  const filter = {
    urls: ['*://*/*'] // Перехватываем ВСЁ
  };

  session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    // Подменяем Origin только для Reown/WalletConnect и Supabase
    const url = details.url.toLowerCase();
    if (url.includes('walletconnect') || url.includes('reown') || url.includes('supabase')) {
        details.requestHeaders['Origin'] = FAKE_DOMAIN;
        details.requestHeaders['Referer'] = FAKE_DOMAIN;
    }
    
    // Удаляем хедеры, выдающие Electron
    delete details.requestHeaders['Electron-Renderer'];
    delete details.requestHeaders['User-Agent']; // Иногда полезно сбросить UA
    
    callback({ requestHeaders: details.requestHeaders });
  });
  // ---------------------------

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
}

function createTray() {
  // ... ваш старый код трея (без изменений) ...
  const iconPath = path.join(__dirname, '../public/icon.png');
  try {
    tray = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Open GCS Node', click: () => mainWindow.show() },
        { type: 'separator' },
        { label: 'Exit', click: () => { app.isQuitting = true; app.quit(); } }
    ]);
    tray.setToolTip('GCS Node');
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => mainWindow.show());
  } catch (e) {
    console.log("Tray icon error");
  }
}

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

const { app, BrowserWindow, Tray, Menu, session } = require('electron');
const path = require('path');

let mainWindow;
let tray = null;

// ВАЖНО: Этот домен должен совпадать с тем, что вы указали в Reown Dashboard (Website URL)
const FAKE_DOMAIN = 'https://node-guardian-forge.lovable.app';

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
      webSecurity: false // Разрешаем CORS
    }
  });

  // --- МАСКИРОВКА ПОД САЙТ (ОБЯЗАТЕЛЬНО ДЛЯ REOWN) ---
  const filter = {
    urls: [
      '*://*.walletconnect.com/*',
      '*://*.walletconnect.org/*',
      '*://*.reown.com/*',
      '*://*.supabase.co/*'
    ]
  };

  session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    // Принудительно ставим заголовки, чтобы сервер думал, что мы - это сайт
    details.requestHeaders['Origin'] = FAKE_DOMAIN;
    details.requestHeaders['Referer'] = FAKE_DOMAIN;
    
    // Удаляем заголовки, которые могут выдать Electron
    delete details.requestHeaders['Electron-Renderer'];
    
    callback({ requestHeaders: details.requestHeaders });
  });
  // ---------------------------------------------------

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
    console.log("Tray icon error (ignoring for build)");
  }
}

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

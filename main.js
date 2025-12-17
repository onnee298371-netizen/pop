const { app, BrowserWindow, Tray, Menu, session } = require('electron');
const path = require('path');

let mainWindow;
let tray = null;

// Домен, который мы "эмулируем" для внешних сервисов
const FAKE_DOMAIN = 'https://node-guardian-forge.lovable.app';

// Игнорируем ошибки сертификатов для WSS соединений
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
      // ВКЛЮЧАЕМ Node.js окружение внутри окна (как вы просили)
      nodeIntegration: true,
      contextIsolation: false,
      // ОТКЛЮЧАЕМ веб-безопасность для CORS запросов
      webSecurity: false,
      allowRunningInsecureContent: true
    }
  });

  // --- ПЕРЕХВАТЧИК ЗАПРОСОВ (Обход блокировок Reown) ---
  const filter = {
    urls: ['*://*/*']
  };

  session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    // Если запрос идет к WalletConnect или Supabase, притворяемся сайтом
    const url = details.url.toLowerCase();
    if (url.includes('walletconnect') || url.includes('reown') || url.includes('supabase')) {
        details.requestHeaders['Origin'] = FAKE_DOMAIN;
        details.requestHeaders['Referer'] = FAKE_DOMAIN;
    }
    
    // Убираем следы Electron
    delete details.requestHeaders['Electron-Renderer'];
    
    callback({ requestHeaders: details.requestHeaders });
  });
  // -----------------------------------------------------

  // Загрузка
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
    console.log("Tray icon not found (skipping)");
  }
}

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

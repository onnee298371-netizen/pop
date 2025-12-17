const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');

let mainWindow;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 450,
    height: 700,
    resizable: false,
    title: "GCS Node Client",
    icon: path.join(__dirname, '../public/icon.png'),
    frame: true, // Можно поставить false для безрамочного, но тогда нужны кастомные кнопки
    autoHideMenuBar: true,
    backgroundColor: '#050510',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false // Разрешаем CORS запросы к Supabase
    }
  });

  // Загрузка контента
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Обработка закрытия окна (сворачивание в трей)
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
  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open GCS Node', click: () => mainWindow.show() },
    { type: 'separator' },
    { label: 'Exit', click: () => {
        app.isQuitting = true;
        app.quit();
      } 
    }
  ]);

  tray.setToolTip('GCS Node: Mining Active');
  tray.setContextMenu(contextMenu);
  
  tray.on('double-click', () => mainWindow.show());
}

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
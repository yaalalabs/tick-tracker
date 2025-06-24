import { app, BrowserWindow, ipcMain, Tray, Menu, globalShortcut, Notification, nativeImage, nativeTheme } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

// Enforce single instance lock - must be at the very beginning
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let tray = null;
let mainWindow = null;
let isTimerActive = false; // Track timer state
let timerInterval = null; // Timer interval for background timing
let timerSeconds = 0; // Current timer seconds
let notificationTimeSeconds = 6 * 3600; // Default 6 hours in seconds
let notificationSent = false; // Track if notification was sent

// Handle second instance
app.on('second-instance', (event, commandLine, workingDirectory) => {
  if (mainWindow) {
    if (!mainWindow.isVisible()) mainWindow.show();
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
    updateIcons(isTimerActive); // Restore overlay icon state
  }
});

// Determine the correct path for icons based on development or production
const getAssetPath = (...paths) => {
  if (process.env.NODE_ENV === 'development') {
    return path.join(__dirname, 'public', ...paths);
  }
  return path.join(process.resourcesPath, 'public', ...paths);
};

const iconDefault = nativeImage.createFromPath(getAssetPath('tick-icon.png'));
const iconStarted = nativeImage.createFromPath(getAssetPath('tick-icon-started.png'));

// Set AppUserModelId for notifications on Windows
if (process.platform === 'win32') {
  app.setAppUserModelId('com.tick-tracker.app');
}

function updateIcons(timerActive) {
  isTimerActive = timerActive; // Update the stored state
  const image = isTimerActive ? iconStarted : iconDefault;
  
  // Update tray icon
  if (tray) {
    tray.setImage(image);
  }
  
  // Update window icon
  if (mainWindow) {
    mainWindow.setIcon(image);
    
    // Update taskbar icon overlay on Windows
    if (process.platform === 'win32') {
      mainWindow.setOverlayIcon(
        isTimerActive ? iconStarted : null,
        isTimerActive ? 'Timer Active' : ''
      );
    }
  }
}

// Timer management functions
function startTimer(notificationTimeHours = 6) {
  console.log('startTimer called');
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    console.log('Previous timer stopped');
  }
  timerSeconds = 0;
  notificationTimeSeconds = notificationTimeHours * 3600;
  notificationSent = false;
  isTimerActive = true;
  timerInterval = setInterval(() => {
    timerSeconds++;
    if (timerSeconds >= notificationTimeSeconds && !notificationSent) {
      notifyTimerExceeded();
      notificationSent = true;
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('timer-update', timerSeconds);
    }
  }, 1000);
  updateIcons(true);
  console.log('New timer started');
}

function stopTimer() {
  console.log('stopTimer called');
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    console.log('Timer interval cleared');
  }
  isTimerActive = false;
  timerSeconds = 0;
  notificationSent = false;
  updateIcons(false);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('timer-stopped');
  }
  console.log('Timer stopped and state reset');
}

function notifyTimerExceeded() {
  if (process.platform === 'win32') {
    new Notification({
      title: 'Tick Tracker',
      body: `Timer has exceeded ${notificationTimeSeconds / 3600} hours`,
      icon: iconStarted
    }).show();
  }
}

function createTray() {
  tray = new Tray(iconDefault);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    {
      label: 'Hide App',
      click: () => {
        mainWindow.hide();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);
  tray.setToolTip('Tick Tracker - Click to show/hide');
  tray.setContextMenu(contextMenu);
  
  // Show window when tray icon is clicked
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 450,
    resizable: false,
    icon: iconDefault,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Remove the default menu
  mainWindow.setMenu(null);

  // Load Vite dev server in development, or index.html in production
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  // Minimize to tray instead of taskbar
  mainWindow.on('minimize', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });

  // Close to tray instead of quitting
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // Show window when clicking on dock icon (macOS) or taskbar icon (Windows)
  mainWindow.on('restore', () => {
    mainWindow.show();
    mainWindow.focus();
    updateIcons(isTimerActive); // Restore overlay icon state
  });

  // Ensure overlay icon is set when showing window
  mainWindow.on('show', () => {
    updateIcons(isTimerActive);
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  // Register global shortcut to toggle window visibility
  globalShortcut.register('CommandOrControl+Shift+T', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
      updateIcons(isTimerActive); // Restore overlay icon state
    }
  });

  // Handle taskbar/dock clicks when no windows are open
  app.on('activate', () => {
    if (!mainWindow) {
      createWindow();
    } else if (!mainWindow.isVisible()) {
      mainWindow.show();
      mainWindow.focus();
      updateIcons(isTimerActive); // Restore overlay icon state
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.isQuiting = true;
    app.quit();
  }
});

app.on('before-quit', () => {
  app.isQuiting = true;
});

// IPC handlers for Tick API calls using axios
ipcMain.handle('fetch-projects', async (event, settings) => {
  const url = `https://www.tickspot.com/${settings.subscriptionId}/api/v2/projects.json`;
  const res = await axios.get(url, {
    headers: {
      'Authorization': `Token token=${settings.token}`,
      'User-Agent': `TickTracker (${settings.email})`,
      'Content-Type': 'application/json',
    },
  });
  return res.data;
});

ipcMain.handle('fetch-tasks', async (event, settings, projectId) => {
  const url = `https://www.tickspot.com/${settings.subscriptionId}/api/v2/projects/${projectId}/tasks.json`;
  const res = await axios.get(url, {
    headers: {
      'Authorization': `Token token=${settings.token}`,
      'User-Agent': `TickTracker (${settings.email})`,
      'Content-Type': 'application/json',
    },
  });
  return res.data;
});

ipcMain.handle('log-time', async (event, settings, projectId, taskId, hours, date) => {
  const url = `https://www.tickspot.com/${settings.subscriptionId}/api/v2/entries.json`;
  const payload = {
    project_id: projectId,
    task_id: taskId,
    hours: hours,
    date,
  };
  
  const res = await axios.post(url, payload, {
    headers: {
      'Authorization': `Token token=${settings.token}`,
      'User-Agent': `TickTracker (${settings.email})`,
      'Content-Type': 'application/json',
    },
  });
  
  return res.data;
});

ipcMain.handle('fetch-clients', async (event, settings) => {
  const url = `https://www.tickspot.com/${settings.subscriptionId}/api/v2/clients.json`;
  const res = await axios.get(url, {
    headers: {
      'Authorization': `Token token=${settings.token}`,
      'User-Agent': `TickTracker (${settings.email})`,
      'Content-Type': 'application/json',
    },
  });
  return res.data;
});

// IPC handlers for timer state changes
ipcMain.handle('start-timer', (event, notificationTimeHours = 6) => {
  startTimer(notificationTimeHours);
});

ipcMain.handle('stop-timer', () => {
  stopTimer();
});

ipcMain.handle('get-timer-state', () => {
  return {
    isActive: isTimerActive,
    seconds: timerSeconds,
    notificationTimeSeconds: notificationTimeSeconds
  };
});

ipcMain.handle('timer-started', () => {
  updateIcons(true);
});

ipcMain.handle('timer-stopped', () => {
  updateIcons(false);
});

ipcMain.handle('notify-timer-exceeded', () => {
  new Notification({
    title: 'Timer Warning',
    body: 'The current timer has been running for 6 hours.'
  }).show();
});

// IPC handlers for system theme detection
ipcMain.handle('get-system-theme', () => {
  return {
    shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
    shouldUseHighContrastColors: nativeTheme.shouldUseHighContrastColors,
    shouldUseInvertedColorScheme: nativeTheme.shouldUseInvertedColorScheme
  };
});

// Listen for system theme changes and notify renderer
nativeTheme.on('updated', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('system-theme-changed', {
      shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
      shouldUseHighContrastColors: nativeTheme.shouldUseHighContrastColors,
      shouldUseInvertedColorScheme: nativeTheme.shouldUseInvertedColorScheme
    });
  }
}); 
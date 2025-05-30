const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, Notification } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const Store = require('electron-store');
const { Coordinates, CalculationMethod, PrayerTimes, Prayer } = require('adhan');

// Initialize store for settings
const store = new Store();

let mainWindow;
let tray;
let prayerCheckInterval;

// Default settings
const defaultSettings = {
  latitude: 21.3891, // Mecca coordinates as default
  longitude: 39.8579,
  calculationMethod: 'MuslimWorldLeague',
  reminderMinutes: 15,
  enabled: true,
  startWithSystem: true
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false // Disable sandbox for Linux compatibility
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    show: false, // Start hidden
    skipTaskbar: false
  });

  mainWindow.loadFile('src/index.html');

  // Hide window instead of closing
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // Send settings to renderer when ready
  mainWindow.webContents.on('did-finish-load', () => {
    const settings = { ...defaultSettings, ...store.get('settings', {}) };
    mainWindow.webContents.send('settings-loaded', settings);
  });
}

function createTray() {
  // Create tray icon
  const iconPath = path.join(__dirname, '../assets/tray-icon.png');
  const trayIcon = nativeImage.createFromPath(iconPath);
  tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    {
      label: 'Next Prayer',
      click: () => {
        const nextPrayer = getNextPrayer();
        if (nextPrayer) {
          showNotification('Next Prayer', `${nextPrayer.name} at ${nextPrayer.time}`);
        }
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

  tray.setContextMenu(contextMenu);
  tray.setToolTip('Shalat Reminder');

  tray.on('double-click', () => {
    mainWindow.show();
    mainWindow.focus();
  });
}

function getNextPrayer() {
  const settings = { ...defaultSettings, ...store.get('settings', {}) };

  if (!settings.enabled) return null;

  try {
    const coordinates = new Coordinates(settings.latitude, settings.longitude);
    const date = new Date();
    const params = CalculationMethod[settings.calculationMethod]();
    const prayerTimes = new PrayerTimes(coordinates, date, params);

    const prayers = [
      { name: 'Fajr', time: prayerTimes.fajr },
      { name: 'Dhuhr', time: prayerTimes.dhuhr },
      { name: 'Asr', time: prayerTimes.asr },
      { name: 'Maghrib', time: prayerTimes.maghrib },
      { name: 'Isha', time: prayerTimes.isha }
    ];

    const now = new Date();
    const nextPrayer = prayers.find(prayer => prayer.time > now);

    if (nextPrayer) {
      return {
        name: nextPrayer.name,
        time: nextPrayer.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        datetime: nextPrayer.time
      };
    }

    // If no prayer today, return Fajr of tomorrow
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowPrayers = new PrayerTimes(coordinates, tomorrow, params);

    return {
      name: 'Fajr',
      time: tomorrowPrayers.fajr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      datetime: tomorrowPrayers.fajr
    };
  } catch (error) {
    console.error('Error calculating prayer times:', error);
    return null;
  }
}

function checkPrayerTime() {
  const settings = { ...defaultSettings, ...store.get('settings', {}) };

  if (!settings.enabled) return;

  const nextPrayer = getNextPrayer();
  if (!nextPrayer) return;

  const now = new Date();
  const timeUntilPrayer = nextPrayer.datetime - now;
  const reminderTime = settings.reminderMinutes * 60 * 1000; // Convert to milliseconds

  // Check if we should show reminder (within reminder window)
  if (timeUntilPrayer <= reminderTime && timeUntilPrayer > reminderTime - 60000) {
    const minutesLeft = Math.round(timeUntilPrayer / 60000);
    showNotification(
      'Prayer Time Reminder',
      `${nextPrayer.name} prayer in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''} at ${nextPrayer.time}`
    );
  }

  // Check if it's prayer time (within 1 minute)
  if (timeUntilPrayer <= 60000 && timeUntilPrayer > 0) {
    showNotification(
      'Prayer Time Now!',
      `Time for ${nextPrayer.name} prayer`
    );
  }
}

function showNotification(title, body) {
  if (Notification.isSupported()) {
    new Notification({
      title: title,
      body: body,
      icon: path.join(__dirname, '../assets/icon.png'),
      silent: false
    }).show();
  }
}

function startPrayerChecker() {
  // Check every minute
  prayerCheckInterval = setInterval(checkPrayerTime, 60000);
  // Also check immediately
  checkPrayerTime();
}

function stopPrayerChecker() {
  if (prayerCheckInterval) {
    clearInterval(prayerCheckInterval);
    prayerCheckInterval = null;
  }
}

// IPC handlers
ipcMain.handle('get-settings', () => {
  return { ...defaultSettings, ...store.get('settings', {}) };
});

ipcMain.handle('save-settings', (event, settings) => {
  store.set('settings', settings);

  // Restart prayer checker with new settings
  stopPrayerChecker();
  if (settings.enabled) {
    startPrayerChecker();
  }

  return true;
});

ipcMain.handle('get-prayer-times', () => {
  const settings = { ...defaultSettings, ...store.get('settings', {}) };

  try {
    const coordinates = new Coordinates(settings.latitude, settings.longitude);
    const date = new Date();
    const params = CalculationMethod[settings.calculationMethod]();
    const prayerTimes = new PrayerTimes(coordinates, date, params);

    return {
      fajr: prayerTimes.fajr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dhuhr: prayerTimes.dhuhr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      asr: prayerTimes.asr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      maghrib: prayerTimes.maghrib.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isha: prayerTimes.isha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  } catch (error) {
    console.error('Error calculating prayer times:', error);
    return null;
  }
});

// App event handlers
app.whenReady().then(() => {
  createWindow();
  createTray();

  // Configure auto-updater
  if (!app.isPackaged) {
    // Development mode - don't check for updates
    console.log('Running in development mode - auto-updater disabled');
  } else {
    // Production mode - enable auto-updater
    autoUpdater.checkForUpdatesAndNotify();

    // Check for updates every hour
    setInterval(() => {
      autoUpdater.checkForUpdatesAndNotify();
    }, 60 * 60 * 1000);
  }

  // Start prayer time checking
  const settings = { ...defaultSettings, ...store.get('settings', {}) };
  if (settings.enabled) {
    startPrayerChecker();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow.show();
    }
  });
});

app.on('window-all-closed', () => {
  // Don't quit the app when all windows are closed on macOS
  if (process.platform !== 'darwin') {
    // Keep running in background
  }
});

app.on('before-quit', () => {
  app.isQuiting = true;
  stopPrayerChecker();
});

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available.');

  // Show notification about available update
  if (Notification.isSupported()) {
    new Notification({
      title: 'Update Available',
      body: 'A new version of Shalat Reminder is being downloaded in the background.',
      icon: path.join(__dirname, '../assets/icon.png'),
      silent: true
    }).show();
  }
});

autoUpdater.on('update-not-available', (info) => {
  console.log('Update not available.');
});

autoUpdater.on('error', (err) => {
  console.log('Error in auto-updater:', err);
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  console.log(log_message);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded');

  // Show notification that update is ready
  if (Notification.isSupported()) {
    const notification = new Notification({
      title: 'Update Ready',
      body: 'Shalat Reminder will restart to apply the update.',
      icon: path.join(__dirname, '../assets/icon.png'),
      silent: false
    });

    notification.show();

    // Auto-restart after 5 seconds
    setTimeout(() => {
      autoUpdater.quitAndInstall();
    }, 5000);
  }
});
const { ipcRenderer } = require('electron');

let currentSettings = {};

// DOM elements
const settingsForm = document.getElementById('settingsForm');
const statusDiv = document.getElementById('status');
const testNotificationBtn = document.getElementById('testNotification');
const getLocationBtn = document.getElementById('getLocation');

// Load settings when page loads
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadPrayerTimes();

  // Refresh prayer times every minute
  setInterval(loadPrayerTimes, 60000);
});

// Load settings from main process
async function loadSettings() {
  try {
    currentSettings = await ipcRenderer.invoke('get-settings');
    populateForm(currentSettings);
  } catch (error) {
    console.error('Error loading settings:', error);
    showStatus('Error loading settings', 'error');
  }
}

// Populate form with current settings
function populateForm(settings) {
  document.getElementById('latitude').value = settings.latitude || '';
  document.getElementById('longitude').value = settings.longitude || '';
  document.getElementById('calculationMethod').value = settings.calculationMethod || 'MuslimWorldLeague';
  document.getElementById('reminderMinutes').value = settings.reminderMinutes || 15;
  document.getElementById('enabled').checked = settings.enabled !== false;
}

// Load and display prayer times
async function loadPrayerTimes() {
  try {
    const prayerTimes = await ipcRenderer.invoke('get-prayer-times');

    if (prayerTimes) {
      document.getElementById('fajr-time').textContent = prayerTimes.fajr;
      document.getElementById('dhuhr-time').textContent = prayerTimes.dhuhr;
      document.getElementById('asr-time').textContent = prayerTimes.asr;
      document.getElementById('maghrib-time').textContent = prayerTimes.maghrib;
      document.getElementById('isha-time').textContent = prayerTimes.isha;

      // Show next prayer info
      showNextPrayer(prayerTimes);
    } else {
      // Reset to default if calculation fails
      const timeElements = ['fajr-time', 'dhuhr-time', 'asr-time', 'maghrib-time', 'isha-time'];
      timeElements.forEach(id => {
        document.getElementById(id).textContent = '--:--';
      });
    }
  } catch (error) {
    console.error('Error loading prayer times:', error);
  }
}

// Show next prayer information
function showNextPrayer(prayerTimes) {
  const now = new Date();
  const prayers = [
    { name: 'Fajr', time: prayerTimes.fajr },
    { name: 'Dhuhr', time: prayerTimes.dhuhr },
    { name: 'Asr', time: prayerTimes.asr },
    { name: 'Maghrib', time: prayerTimes.maghrib },
    { name: 'Isha', time: prayerTimes.isha }
  ];

  // Convert time strings to today's dates for comparison
  const today = new Date();
  const prayerDates = prayers.map(prayer => {
    const [hours, minutes] = prayer.time.split(':');
    const prayerDate = new Date(today);
    prayerDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return { ...prayer, datetime: prayerDate };
  });

  // Find next prayer
  let nextPrayer = prayerDates.find(prayer => prayer.datetime > now);

  if (!nextPrayer) {
    // If no prayer left today, next is Fajr tomorrow
    nextPrayer = { name: 'Fajr', time: prayerTimes.fajr };
  }

  const nextPrayerDiv = document.getElementById('nextPrayer');
  const nextPrayerInfo = document.getElementById('nextPrayerInfo');

  if (nextPrayer) {
    nextPrayerInfo.textContent = `${nextPrayer.name} at ${nextPrayer.time}`;
    nextPrayerDiv.style.display = 'block';
  } else {
    nextPrayerDiv.style.display = 'none';
  }
}

// Handle form submission
settingsForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(settingsForm);
  const settings = {
    latitude: parseFloat(formData.get('latitude')) || currentSettings.latitude,
    longitude: parseFloat(formData.get('longitude')) || currentSettings.longitude,
    calculationMethod: formData.get('calculationMethod') || currentSettings.calculationMethod,
    reminderMinutes: parseInt(formData.get('reminderMinutes')) || currentSettings.reminderMinutes,
    enabled: document.getElementById('enabled').checked
  };

  try {
    const success = await ipcRenderer.invoke('save-settings', settings);

    if (success) {
      currentSettings = settings;
      showStatus('Settings saved successfully!', 'success');

      // Reload prayer times with new settings
      setTimeout(loadPrayerTimes, 500);
    } else {
      showStatus('Failed to save settings', 'error');
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    showStatus('Error saving settings', 'error');
  }
});

// Test notification button
testNotificationBtn.addEventListener('click', () => {
  new Notification('Shalat Reminder Test', {
    body: 'This is a test notification. Your app is working correctly!',
    icon: '../assets/icon.png'
  });
  showStatus('Test notification sent!', 'success');
});

// Get location button
getLocationBtn.addEventListener('click', () => {
  if (navigator.geolocation) {
    showStatus('Getting your location...', 'success');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        document.getElementById('latitude').value = position.coords.latitude.toFixed(6);
        document.getElementById('longitude').value = position.coords.longitude.toFixed(6);
        showStatus('Location obtained successfully!', 'success');
      },
      (error) => {
        console.error('Geolocation error:', error);
        showStatus('Could not get your location. Please enter manually.', 'error');
      },
      {
        timeout: 10000,
        enableHighAccuracy: true
      }
    );
  } else {
    showStatus('Geolocation is not supported by this browser.', 'error');
  }
});

// Show status message
function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';

  // Hide after 3 seconds
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 3000);
}

// Listen for settings updates from main process
ipcRenderer.on('settings-loaded', (event, settings) => {
  currentSettings = settings;
  populateForm(settings);
  loadPrayerTimes();
});

// Handle app visibility changes
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Refresh prayer times when app becomes visible
    loadPrayerTimes();
  }
});
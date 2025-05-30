# Shalat Reminder App

A cross-platform Islamic prayer time reminder application that runs in the background and shows toast notifications when prayer time is near. Built with Electron, it works on Linux, Windows, and macOS.

## Features

- 🕌 **Accurate Prayer Times**: Uses the Adhan library for precise Islamic prayer time calculations
- 🔔 **Background Notifications**: Toast notifications appear even when the app is minimized
- 🌍 **Cross-Platform**: Runs on Linux, Windows, and macOS
- ⚙️ **Customizable Settings**: 
  - Multiple calculation methods (Muslim World League, Egyptian, etc.)
  - Adjustable reminder time (5-60 minutes before prayer)
  - Location-based calculations
- 🎯 **System Tray Integration**: Minimize to system tray and access quickly
- 📍 **Auto Location**: Get your coordinates automatically or enter manually
- 🎨 **Modern UI**: Beautiful gradient interface with glassmorphism design

## Installation

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn

### Steps

1. **Clone or download the project files**
   ```bash
   mkdir shalat-reminder
   cd shalat-reminder
   ```

2. **Create the project structure and add the files**:
   ```
   shalat-reminder/
   ├── package.json
   ├── README.md
   ├── src/
   │   ├── main.js
   │   ├── index.html
   │   └── renderer.js
   └── assets/
       ├── icon.png
       ├── icon.ico
       ├── icon.icns
       └── tray-icon.png
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Create icons** (place in `assets/` folder):
   - `icon.png` - 512x512 app icon
   - `icon.ico` - Windows icon
   - `icon.icns` - macOS icon  
   - `tray-icon.png` - 16x16 or 32x32 system tray icon

## Running the App

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## Building Installers

### Build for all platforms:
```bash
npm run build
```

### Build for specific platforms:
```bash
# Windows
npm run build-win

# macOS  
npm run build-mac

# Linux
npm run build-linux
```

Built applications will be in the `dist/` folder.

## Usage

### First Setup

1. **Launch the application**
2. **Set your location**:
   - Click "Get My Location" for automatic detection, or
   - Enter latitude and longitude manually
   - Example: Mecca (21.3891, 39.8579)
3. **Choose calculation method** (default: Muslim World League)
4. **Set reminder time** (default: 15 minutes before prayer)
5. **Enable notifications** (checkbox)
6. **Click "Save Settings"**

### Daily Use

- The app runs in the background automatically
- Notifications appear at your specified reminder time
- Access the app through the system tray icon
- Double-click tray icon to open the main window
- Right-click tray icon for quick options

### Calculation Methods Available

- **Muslim World League** (default)
- **Egyptian General Authority**
- **University of Islamic Sciences, Karachi**
- **Umm Al-Qura** (Saudi Arabia)
- **Dubai**
- **Moonsighting Committee**
- **Islamic Society of North America**
- **Kuwait**
- **Qatar**
- **Singapore**

## Troubleshooting

### Notifications Not Working

1. **Check system notification settings**:
   - **Windows**: Settings > System > Notifications & actions
   - **macOS**: System Preferences > Notifications
   - **Linux**: Varies by desktop environment

2. **Enable notifications in the app**: Make sure the "Enable Notifications" checkbox is checked

3. **Test notifications**: Use the "Test Notification" button in settings

### Prayer Times Incorrect

1. **Verify your location**: Ensure latitude and longitude are correct
2. **Try different calculation method**: Some methods work better for specific regions
3. **Check timezone**: The app uses your system timezone

### App Not Starting

1. **Check Node.js version**: Ensure you have Node.js 16 or higher
2. **Reinstall dependencies**: 
   ```bash
   rm -rf node_modules
   npm install
   ```
3. **Run in development mode**: `npm run dev` for error details

## Development

### Project Structure

- `src/main.js` - Main Electron process (background logic)
- `src/index.html` - UI layout
- `src/renderer.js` - Frontend JavaScript
- `package.json` - Dependencies and build configuration

### Key Dependencies

- **electron** - Cross-platform desktop framework
- **adhan** - Islamic prayer time calculations
- **electron-store** - Settings persistence
- **node-notifier** - Cross-platform notifications

### Adding Features

The app is modular and easy to extend:

- **New calculation methods**: Add to the `CalculationMethod` options
- **Additional notifications**: Modify the `checkPrayerTime()` function
- **UI improvements**: Update `index.html` and styles
- **Settings**: Add new options in `defaultSettings` object

## License

MIT License - feel free to modify and distribute.

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Look at the console for error messages (`npm run dev`)
3. Create an issue with details about your system and the problem

---

**May Allah accept your prayers** 🤲
// Optional: Custom download server for branded URLs
// Deploy this to Vercel, Netlify Functions, or any Node.js host

const express = require('express');
const app = express();

// GitHub repository configuration
const GITHUB_OWNER = 'yourusername';
const GITHUB_REPO = 'shalat-reminder';

// Platform mapping
const PLATFORM_FILES = {
  windows: 'Shalat-Reminder-Setup.exe',
  mac: 'Shalat-Reminder.dmg',
  linux: 'Shalat-Reminder.AppImage',
  'linux-deb': 'shalat-reminder.deb'
};

// Get latest release info from GitHub API
async function getLatestRelease() {
  const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`);
  return response.json();
}

// Platform detection middleware
function detectPlatform(userAgent) {
  const ua = userAgent.toLowerCase();

  if (ua.includes('windows') || ua.includes('win32') || ua.includes('win64')) {
    return 'windows';
  } else if (ua.includes('mac') || ua.includes('darwin')) {
    return 'mac';
  } else if (ua.includes('linux')) {
    return 'linux';
  }

  return 'windows'; // Default fallback
}

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Analytics middleware (optional)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.get('User-Agent')}`);
  next();
});

// Auto-detect and download
app.get('/download', async (req, res) => {
  try {
    const platform = detectPlatform(req.get('User-Agent') || '');
    res.redirect(`/download/${platform}`);
  } catch (error) {
    console.error('Error in auto-download:', error);
    res.status(500).send('Download service temporarily unavailable');
  }
});

// Platform-specific downloads
app.get('/download/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const filename = PLATFORM_FILES[platform];

    if (!filename) {
      return res.status(404).send('Platform not supported');
    }

    const release = await getLatestRelease();
    const asset = release.assets.find(asset => asset.name === filename);

    if (!asset) {
      return res.status(404).send('Download not found');
    }

    // Track download analytics here if needed
    console.log(`Download: ${platform} - ${filename} - ${req.get('User-Agent')}`);

    // Redirect to actual GitHub download URL
    res.redirect(asset.browser_download_url);

  } catch (error) {
    console.error('Error serving download:', error);
    res.status(500).send('Download service temporarily unavailable');
  }
});

// Latest version API endpoint
app.get('/api/version', async (req, res) => {
  try {
    const release = await getLatestRelease();
    res.json({
      version: release.tag_name,
      name: release.name,
      published_at: release.published_at,
      download_count: release.assets.reduce((total, asset) => total + asset.download_count, 0)
    });
  } catch (error) {
    console.error('Error getting version:', error);
    res.status(500).json({ error: 'Version service unavailable' });
  }
});

// Download statistics API
app.get('/api/stats', async (req, res) => {
  try {
    const releases = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`);
    const releasesData = await releases.json();

    const stats = {
      total_downloads: 0,
      latest_version: releasesData[0]?.tag_name || 'Unknown',
      platforms: {}
    };

    releasesData.forEach(release => {
      release.assets.forEach(asset => {
        stats.total_downloads += asset.download_count;

        // Categorize by platform
        if (asset.name.includes('.exe')) {
          stats.platforms.windows = (stats.platforms.windows || 0) + asset.download_count;
        } else if (asset.name.includes('.dmg')) {
          stats.platforms.mac = (stats.platforms.mac || 0) + asset.download_count;
        } else if (asset.name.includes('.AppImage') || asset.name.includes('.deb')) {
          stats.platforms.linux = (stats.platforms.linux || 0) + asset.download_count;
        }
      });
    });

    res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Stats service unavailable' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handle 404
app.use((req, res) => {
  res.status(404).send('Not found');
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).send('Internal server error');
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Download server running on port ${PORT}`);
  });
}

module.exports = app;

// Vercel serverless function export
module.exports.handler = app;
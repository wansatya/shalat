# One-Click Install Deployment Guide

This guide will help you set up the complete one-click install system for your Shalat Reminder app, including the landing page, automated builds, and download distribution.

## Overview

The deployment system consists of:
1. **Landing Page** - Detects user's platform and provides direct downloads
2. **GitHub Actions** - Automatically builds releases for all platforms
3. **Auto-Updater** - Keeps the app updated automatically
4. **CDN Distribution** - Fast downloads worldwide

## Step-by-Step Setup

### 1. GitHub Repository Setup

1. **Create a new GitHub repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/shalat-reminder.git
   git push -u origin main
   ```

2. **Update package.json** with your repository details:
   ```json
   "repository": {
     "type": "git",
     "url": "https://github.com/yourusername/shalat-reminder.git"
   },
   "homepage": "https://yourusername.github.io/shalat-reminder"
   ```

3. **Enable GitHub Actions** in your repository settings

### 2. Create Required Assets

Create these files in the `assets/` folder:

```
assets/
├── icon.png          # 512x512 main app icon
├── icon.ico          # Windows icon (convert from PNG)
├── icon.icns         # macOS icon (convert from PNG)
├── tray-icon.png     # 16x16 or 32x32 system tray icon
├── dmg-background.png # macOS DMG installer background
├── favicon.png       # 32x32 website favicon
├── apple-touch-icon.png # 180x180 for iOS
└── og-image.png      # 1200x630 social media preview
```

**Icon Generation Tools**:
- Online: [IconGenerator.net](https://icongenerator.net/)
- macOS: `iconutil` command
- Windows: Online ICO converters

### 3. Landing Page Deployment

#### Option A: GitHub Pages (Free)

1. **Create `docs/` folder** and move the landing page HTML there
2. **Enable GitHub Pages** in repository settings
3. **Set source** to "Deploy from a branch" → `main` → `/docs`
4. **Custom domain** (optional): Add CNAME file with your domain

#### Option B: Netlify (Recommended)

1. **Connect your GitHub repo** to Netlify
2. **Build settings**:
   - Build command: (none)
   - Publish directory: `/`
3. **Custom domain**: Configure in Netlify dashboard
4. **HTTPS**: Enabled automatically

#### Option C: Vercel

1. **Import your GitHub repo** to Vercel
2. **Framework preset**: Other
3. **Root directory**: Leave blank
4. **Custom domain**: Configure in dashboard

### 4. Release Workflow

#### Automated Releases

The GitHub Actions workflow automatically:
- Builds for Windows, macOS, and Linux
- Creates installers with one-click install
- Publishes to GitHub Releases
- Enables auto-updater functionality

#### Creating a Release

1. **Update version** in `package.json`:
   ```json
   "version": "1.0.1"
   ```

2. **Create and push a tag**:
   ```bash
   git add .
   git commit -m "Release v1.0.1"
   git tag v1.0.1
   git push origin main --tags
   ```

3. **GitHub Actions will automatically**:
   - Build all platform versions
   - Create GitHub release
   - Upload installers

### 5. Update Landing Page URLs

In your landing page, update the download URLs to point to your releases:

```javascript
const downloadUrls = {
    windows: 'https://github.com/yourusername/shalat-reminder/releases/latest/download/Shalat-Reminder-Setup.exe',
    mac: 'https://github.com/yourusername/shalat-reminder/releases/latest/download/Shalat-Reminder.dmg',
    linux: 'https://github.com/yourusername/shalat-reminder/releases/latest/download/Shalat-Reminder.AppImage'
};
```

### 6. CDN Setup (Optional but Recommended)

For faster downloads worldwide:

#### Using jsDelivr (Free)
```javascript
const downloadUrls = {
    windows: 'https://cdn.jsdelivr.net/gh/yourusername/shalat-reminder@latest/dist/Shalat-Reminder-Setup.exe',
    mac: 'https://cdn.jsdelivr.net/gh/yourusername/shalat-reminder@latest/dist/Shalat-Reminder.dmg',
    linux: 'https://cdn.jsdelivr.net/gh/yourusername/shalat-reminder@latest/dist/Shalat-Reminder.AppImage'
};
```

#### Using Cloudflare R2 (Recommended for large files)
1. Create R2 bucket
2. Upload releases automatically via GitHub Actions
3. Use custom domain for branded URLs

### 7. Analytics Setup (Optional)

Add Google Analytics to track downloads:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 8. Code Signing (Production Ready)

For trusted installations without security warnings:

#### Windows Code Signing
1. **Get a code signing certificate** (DigiCert, Sectigo, etc.)
2. **Add to GitHub Secrets**:
   - `WINDOWS_CERTIFICATE`: Base64 encoded .p12 file
   - `WINDOWS_CERTIFICATE_PASSWORD`: Certificate password

3. **Update GitHub Actions**:
   ```yaml
   - name: Code sign Windows
     run: |
       echo "${{ secrets.WINDOWS_CERTIFICATE }}" | base64 --decode > certificate.p12
       npm run build-win
   ```

#### macOS Code Signing & Notarization
1. **Apple Developer Account** required ($99/year)
2. **Add to GitHub Secrets**:
   - `APPLE_ID`: Your Apple ID
   - `APPLE_ID_PASS`: App-specific password
   - `CSC_LINK`: Base64 encoded certificate
   - `CSC_KEY_PASSWORD`: Certificate password

### 9. Domain Setup

#### Custom Domain for Landing Page
1. **Buy a domain** (e.g., `shalatreminder.com`)
2. **Configure DNS**:
   - GitHub Pages: CNAME to `yourusername.github.io`
   - Netlify: Follow their custom domain guide
3. **Enable HTTPS** (automatic with most providers)

#### Download URLs
Consider using a custom domain for professional download URLs:
- `https://shalatreminder.com/download/windows`
- `https://shalatreminder.com/download/mac`
- `https://shalatreminder.com/download/linux`

### 10. Testing Checklist

Before going live, test:

- [ ] Landing page loads correctly
- [ ] Platform detection works
- [ ] Download buttons work
- [ ] All platform installers work
- [ ] One-click install on Windows
- [ ] macOS drag-to-Applications works
- [ ] Linux AppImage runs
- [ ] Auto-updater works
- [ ] System tray functionality
- [ ] Notifications work
- [ ] App runs in background

### 11. Marketing & Distribution

#### App Store Distribution (Optional)
- **Microsoft Store**: Use MSIX packaging
- **Mac App Store**: Additional requirements and review process
- **Snap Store**: Linux snap packages

#### Social Media & SEO
- Create social media accounts
- Optimize landing page for SEO
- Submit to software directories
- Create demo videos/screenshots

### 12. Monitoring & Maintenance

#### Analytics to Track
- Download numbers by platform
- User retention
- Update adoption rates
- Geographic distribution

#### Regular Maintenance
- Monitor GitHub Actions for build failures
- Update dependencies regularly
- Respond to user issues
- Release updates for bug fixes

## Troubleshooting

### Common Issues

**Build failures**: Check GitHub Actions logs
**Downloads not working**: Verify GitHub release artifacts
**Auto-updater not working**: Check update server URLs
**Code signing issues**: Verify certificates and secrets

### Support Resources

- [Electron Builder Documentation](https://www.electron.build/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Electron Auto-updater Guide](https://www.electronjs.org/docs/latest/tutorial/updates)

## Security Considerations

1. **Never commit secrets** to version control
2. **Use GitHub Secrets** for sensitive data
3. **Enable branch protection** on main branch
4. **Regular security updates** for dependencies
5. **Code signing** for production releases

---

## Quick Launch Commands

```bash
# Development
npm run dev

# Build for current platform
npm run build

# Build for all platforms
npm run build-win && npm run build-mac && npm run build-linux

# Create release
git tag v1.0.0 && git push origin v1.0.0
```

Your one-click install system is now ready! Users can visit your landing page and download the app with a single click, and it will automatically stay updated.
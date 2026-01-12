# PWA Icons Guide

## 🎨 Required Icons

PWA memerlukan icon dalam berbagai ukuran untuk support berbagai devices dan use cases.

### Minimum Requirements

1. **192x192 px** - Minimum untuk Android
2. **512x512 px** - Untuk splash screens dan app listings

### Recommended Sizes

- **72x72 px** - iOS & Android (small)
- **96x96 px** - Android (medium)
- **128x128 px** - Chrome Web Store
- **144x144 px** - Windows tiles
- **152x152 px** - iOS
- **192x192 px** - Android (large)
- **384x384 px** - Chrome splash screen
- **512x512 px** - High-res devices

### Maskable Icons

Maskable icons are icons that look great on all Android devices, regardless of the device's theme or icon shape.

**Requirements:**
- Icon content should be within the "safe zone" (80% of the canvas)
- Background should extend to edges
- Format: PNG with transparency or solid background

## 🛠️ Tools untuk Generate Icons

### 1. Real Favicon Generator (Recommended)
**URL:** https://realfavicongenerator.net/

**Features:**
- Generates all required sizes
- Creates manifest.json
- Supports maskable icons
- Preview on different devices

**Steps:**
1. Upload your logo/icon (minimum 512x512 px)
2. Customize settings for each platform
3. Generate icons
4. Download package
5. Replace files in `public/` folder

### 2. PWA Asset Generator
**URL:** https://github.com/elegantapp/pwa-asset-generator

```bash
npx pwa-asset-generator logo.png public/icons
```

**Features:**
- CLI-based
- Generates all sizes
- Creates maskable icons
- Updates manifest automatically

### 3. Favicon.io
**URL:** https://favicon.io/

**Features:**
- Text to icon
- Emoji to icon  
- Image to icon
- Free and simple

### 4. PWA Builder
**URL:** https://www.pwabuilder.com/

**Features:**
- Complete PWA package
- Icon generator included
- Manifest generator
- Service worker templates

## 📐 Design Guidelines

### Icon Design Best Practices

1. **Simple & Recognizable**
   - Clear at small sizes
   - Distinctive shape
   - Avoid fine details

2. **Consistent Branding**
   - Use brand colors
   - Match app identity
   - Consistent across sizes

3. **Safe Zone (Maskable Icons)**
   ```
   ┌─────────────────────┐
   │                     │
   │   ┌───────────┐     │
   │   │           │     │ ← 10% padding
   │   │  CONTENT  │     │   (safe zone)
   │   │           │     │
   │   └───────────┘     │
   │                     │
   └─────────────────────┘
   ```

4. **Contrast**
   - Works on light & dark backgrounds
   - High contrast for visibility
   - Consider color blindness

5. **Format**
   - PNG with transparency (preferred)
   - Or solid background color
   - Avoid JPG (no transparency)

## 🎯 Current Setup

File saat ini menggunakan SVG placeholders. Untuk production:

### Steps to Replace Icons:

1. **Create/Get Your Logo**
   - Minimum 512x512 px
   - PNG or SVG format
   - High quality

2. **Use Icon Generator**
   ```bash
   # Using pwa-asset-generator
   npx pwa-asset-generator ./your-logo.png ./public --icon-only
   ```

3. **Or Use Online Tool**
   - Upload to https://realfavicongenerator.net/
   - Download generated package
   - Extract to `public/` folder

4. **Update manifest.ts**
   ```typescript
   icons: [
     {
       src: '/icon-192x192.png',
       sizes: '192x192',
       type: 'image/png',
       purpose: 'any',
     },
     {
       src: '/icon-192x192-maskable.png',
       sizes: '192x192',
       type: 'image/png',
       purpose: 'maskable',
     },
     {
       src: '/icon-512x512.png',
       sizes: '512x512',
       type: 'image/png',
       purpose: 'any',
     },
     {
       src: '/icon-512x512-maskable.png',
       sizes: '512x512',
       type: 'image/png',
       purpose: 'maskable',
     },
   ]
   ```

## 🧪 Testing Icons

### Visual Testing

1. **Chrome DevTools**
   - Open DevTools > Application
   - Click "Manifest"
   - View all icons and their URLs
   - Check if they load correctly

2. **Install the App**
   - Install on device
   - Check home screen icon
   - Check splash screen
   - Verify in app switcher

3. **Different Devices**
   - iOS Safari
   - Android Chrome
   - Desktop browsers

### Validation Tools

1. **Lighthouse**
   ```bash
   npm install -g lighthouse
   lighthouse https://your-site.com --view
   ```
   Check "Installability" section

2. **PWA Builder**
   - Go to https://www.pwabuilder.com/
   - Enter your URL
   - Check "Manifest" tab
   - View icon scores

3. **Maskable.app**
   - Go to https://maskable.app/editor
   - Upload your icon
   - Preview on different shapes
   - Adjust safe zone

## 📱 Platform-Specific Notes

### iOS
- Uses `apple-touch-icon.png` (not in manifest)
- Add to `public/` folder
- Typical sizes: 180x180 px

Add to `layout.tsx`:
```tsx
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

### Android
- Supports maskable icons
- Adaptive icons (shape changes by device)
- Uses manifest.json icons

### Windows
- Uses icons from manifest
- Can specify specific tiles in manifest
- Supports transparent PNGs

## 🎨 Example Icon Structure

```
public/
├── icon-72x72.png
├── icon-96x96.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-152x152.png
├── icon-192x192.png
├── icon-192x192-maskable.png
├── icon-384x384.png
├── icon-512x512.png
├── icon-512x512-maskable.png
├── apple-touch-icon.png
└── favicon.ico
```

## 📚 Additional Resources

- [Web.dev Icon Guidelines](https://web.dev/maskable-icon/)
- [Android Adaptive Icons](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [PWA Icon Checker](https://manifest-validator.appspot.com/)

## 🔄 Quick Generate Script

Create `scripts/generate-icons.js`:

```javascript
const sharp = require('sharp')
const fs = require('fs')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const inputFile = './logo.png'

async function generateIcons() {
  for (const size of sizes) {
    await sharp(inputFile)
      .resize(size, size)
      .png()
      .toFile(`./public/icon-${size}x${size}.png`)
    
    console.log(`Generated icon-${size}x${size}.png`)
  }
}

generateIcons()
```

Run with:
```bash
npm install sharp
node scripts/generate-icons.js
```

---

Good luck creating your PWA icons! 🎨

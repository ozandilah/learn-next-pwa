# 🧪 Testing Guide untuk PWA

## 🎯 Overview

Guide lengkap untuk testing semua fitur PWA yang sudah dibuat.

---

## 1️⃣ Testing Service Worker

### ✅ Verify Registration

**Chrome DevTools:**
1. Buka https://localhost:3000
2. Press `F12` untuk DevTools
3. Go to **Application** tab
4. Click **Service Workers** (left sidebar)

**Expected Result:**
- Status: `activated and is running`
- Source: `/sw.js`
- Scope: `https://localhost:3000/`

**Screenshot locations:**
- Registration details visible
- Update on reload checkbox available

### ✅ Test Caching

**Steps:**
1. Open site (fresh load)
2. DevTools → Network tab
3. Refresh page
4. Check responses

**Expected Result:**
- First load: `(from network)`
- Second load: `(from service worker)` or `(from disk cache)`

### ✅ Test Offline Mode

**Steps:**
1. Load page normally
2. DevTools → Application → Service Workers
3. Check ✅ "Offline" checkbox
4. Refresh page

**Expected Result:**
- Offline page displays
- Shows "You're Offline" message
- Has retry button
- No browser offline dinosaur

**Troubleshooting:**
- If offline page doesn't show:
  - Check console for SW errors
  - Verify `/offline` route exists
  - Check SW fetch event handler

---

## 2️⃣ Testing Web App Manifest

### ✅ Verify Manifest

**DevTools:**
1. Application tab
2. Click **Manifest** (left sidebar)

**Expected Result:**
```json
{
  "name": "Next.js PWA Tutorial",
  "short_name": "NextPWA",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [...]
}
```

**Check:**
- ✅ Name displayed
- ✅ Icons load (click to preview)
- ✅ All properties present
- ✅ No errors in console

### ✅ Verify Icons

**Check icon URLs:**
```
https://localhost:3000/icon-192x192.svg
https://localhost:3000/icon-512x512.svg
```

**Expected:**
- Icons load correctly
- SVG renders properly
- No 404 errors

---

## 3️⃣ Testing Installation

### ✅ Chrome/Edge (Desktop)

**Prerequisites:**
- Run with HTTPS
- Valid manifest
- Service worker registered

**Steps:**
1. Visit https://localhost:3000
2. Look for install icon in address bar (⊕ icon)
3. Or: Menu (⋮) → "Install Next.js PWA Tutorial"

**Expected Result:**
- Install prompt appears
- App installs to applications
- Opens in standalone window
- Has app icon in taskbar/dock

**Test after install:**
- Check "App is installed!" message appears
- Install prompt hidden
- App opens separately from browser

### ✅ Chrome/Edge (Android)

**Steps:**
1. Open site in Chrome
2. Menu → "Add to Home Screen"
3. Confirm installation

**Expected Result:**
- Icon appears on home screen
- Opens in full-screen (no browser UI)
- Has splash screen on launch
- Shows in app drawer

### ✅ Safari (iOS)

**Steps:**
1. Open site in Safari
2. Tap Share button (📤)
3. Scroll → "Add to Home Screen"
4. Tap "Add"

**Expected Result:**
- Icon appears on home screen
- Opens in full-screen
- Has custom icon (not webpage screenshot)
- Works offline

**iOS-specific checks:**
- InstallPrompt shows iOS instructions
- Manual install steps displayed
- No automatic prompt (iOS limitation)

---

## 4️⃣ Testing Push Notifications

### ✅ Prerequisites Check

**Before testing:**
```bash
# 1. HTTPS is running
npm run dev -- --experimental-https

# 2. VAPID keys set in .env.local
NEXT_PUBLIC_VAPID_PUBLIC_KEY=xxx
VAPID_PRIVATE_KEY=xxx

# 3. Browser supports notifications
# Check browser console:
console.log('PushManager' in window) // true
console.log('Notification' in window) // true
```

### ✅ Test Subscription Flow

**Steps:**
1. Visit https://localhost:3000
2. Click "Subscribe to Notifications"
3. Browser prompt appears
4. Click "Allow"

**Expected Result:**
- Permission: `granted`
- Status changes to "You are subscribed"
- Unsubscribe button appears
- No errors in console

**Check console for:**
```
Service Worker registered successfully: /
User subscribed successfully: {endpoint: "..."}
```

### ✅ Test Sending Notifications

**Steps:**
1. Ensure subscribed (see above)
2. Enter message: "Test notification"
3. Click "Send Test Notification"

**Expected Result:**
- Notification appears on desktop/device
- Has correct title: "Next.js PWA Tutorial"
- Has correct body: "Test notification"
- Has icon (icon-192x192.png)
- Makes sound/vibration

**Test variations:**
- Close browser → notification still works
- Click notification → opens app/site
- Multiple notifications
- Long messages

### ✅ Test Permission States

**Test all states:**

1. **Default (not asked):**
   - Shows subscribe button
   - Status: "Not asked"

2. **Granted:**
   - Shows unsubscribe + send buttons
   - Status: "Granted" ✅

3. **Denied:**
   - Shows error message
   - Status: "Denied" ❌
   - Instructions to reset

**Reset permissions (Chrome):**
1. Address bar → Lock icon
2. "Site settings"
3. Reset permissions
4. Refresh page

### ✅ Test Notification Click

**Steps:**
1. Send test notification
2. Click the notification

**Expected Result:**
- Opens app/site
- Notification closes
- Navigates to `/` (home)

**Check SW console:**
```javascript
// In sw.js notificationclick handler
console.log('Notification click received.')
```

---

## 5️⃣ Testing PWA Status Component

### ✅ Check Status Display

**Visit https://localhost:3000**

**Expected displays:**

1. **Installation Status:**
   - ✅ "Installed" (if installed)
   - 📱 "Not Installed" (if not)

2. **Connection Status:**
   - 🟢 "Online" (when online)
   - 🔴 "Offline" (when offline)

3. **Device Type:**
   - 📱 "iOS"
   - 🤖 "Android"
   - 💻 "Desktop"

4. **Notifications:**
   - ✅ "Granted"
   - ❌ "Denied"
   - ⚠️ "Not asked"

5. **Service Worker:**
   - ✅ "Active"
   - ⏳ "Installing"
   - ❌ "None"

6. **Storage Usage:**
   - Shows MB used / total
   - Progress bar
   - Percentage

### ✅ Test Dynamic Updates

**Test online/offline:**
1. Check current status (🟢 Online)
2. DevTools → Network → Check "Offline"
3. Status should update to 🔴 Offline
4. Uncheck "Offline"
5. Status updates to 🟢 Online

**Test notifications:**
1. Current status shows permission
2. Reset permissions in browser
3. Refresh page
4. Status updates

---

## 6️⃣ Testing Cross-Browser

### ✅ Chrome (Desktop)

**Features to test:**
- ✅ Service Worker
- ✅ Install prompt (automatic)
- ✅ Push notifications
- ✅ Offline mode
- ✅ Manifest

**Known issues:**
- Self-signed cert warning (normal for dev)

### ✅ Edge (Desktop)

**Same as Chrome** (Chromium-based)

### ✅ Firefox (Desktop)

**Features:**
- ✅ Service Worker
- ✅ Push notifications
- ⚠️ Install prompt (manual in menu)
- ✅ Offline mode

**Note:**
- No `beforeinstallprompt` event
- Install via menu: "Install"

### ✅ Safari (iOS)

**Features:**
- ✅ Service Worker (iOS 11.3+)
- ✅ Push notifications (iOS 16.4+, installed apps only)
- ⚠️ Manual install only (no automatic prompt)
- ✅ Offline mode

**Requirements:**
- Must add to home screen manually
- Push notifications only work after installation
- No `beforeinstallprompt`

### ✅ Chrome (Android)

**Features:**
- ✅ Service Worker
- ✅ Install prompt (automatic)
- ✅ Push notifications
- ✅ Offline mode
- ✅ Splash screen
- ✅ WebAPK

**Best PWA experience:**
- Full standalone mode
- Splash screens
- Adaptive icons

---

## 7️⃣ Testing Performance

### ✅ Lighthouse Audit

**Run Lighthouse:**

```bash
# Option 1: Via DevTools
# F12 → Lighthouse tab → Generate report

# Option 2: CLI
npm install -g lighthouse
lighthouse https://localhost:3000 --view
```

**Expected Scores:**

- Performance: **90+** ✅
- Accessibility: **90+** ✅
- Best Practices: **90+** ✅
- SEO: **90+** ✅
- **PWA: 100** ✅

**PWA Checklist:**
- ✅ Registers a service worker
- ✅ Responds with 200 when offline
- ✅ Has a web app manifest
- ✅ Has valid icons
- ✅ Configured for splash screen
- ✅ Sets theme color
- ✅ Content sized for viewport
- ✅ Uses HTTPS

### ✅ Network Performance

**Check loading times:**

1. DevTools → Network tab
2. Disable cache
3. Hard refresh (Ctrl+Shift+R)

**Metrics:**
- First Contentful Paint: **< 1.8s**
- Time to Interactive: **< 3.8s**
- Largest Contentful Paint: **< 2.5s**

**Test with throttling:**
- Network: Slow 3G
- CPU: 4x slowdown

---

## 8️⃣ Testing Security

### ✅ Check Security Headers

**DevTools → Network:**
1. Refresh page
2. Click main document request
3. Check **Headers** tab

**Expected headers:**

```
x-content-type-options: nosniff
x-frame-options: DENY
referrer-policy: strict-origin-when-cross-origin
```

**For `/sw.js`:**
```
content-type: application/javascript; charset=utf-8
cache-control: no-cache, no-store, must-revalidate
content-security-policy: default-src 'self'; script-src 'self'
```

### ✅ Check HTTPS

**Verify:**
- 🔒 Lock icon in address bar
- Certificate details available
- No mixed content warnings

**For production:**
- Valid SSL certificate
- No self-signed cert warnings

---

## 9️⃣ Testing Error Handling

### ✅ Test Network Errors

**Scenario 1: SW fails to load**
```javascript
// Temporarily break sw.js
// Add syntax error, save, refresh
console.log('test' // missing )
```

**Expected:**
- Error logged in console
- App still loads (graceful degradation)
- Notifications show error state

**Scenario 2: API endpoint fails**
```javascript
// In actions.ts, throw error
export async function sendNotification() {
  throw new Error('API Error')
}
```

**Expected:**
- Error caught
- User-friendly message displayed
- No app crash

### ✅ Test Permission Denial

**Steps:**
1. Reset permissions
2. Click subscribe
3. Click "Block" on prompt

**Expected:**
- Error message: "Notification permission denied"
- Button remains (can retry)
- No console errors

---

## 🔟 Testing Checklist

### Before Deployment

- [ ] All Lighthouse checks pass (PWA: 100)
- [ ] Works on Chrome/Edge desktop
- [ ] Works on Safari iOS
- [ ] Works on Chrome Android
- [ ] Installs correctly
- [ ] Push notifications work
- [ ] Offline mode works
- [ ] Icons display correctly
- [ ] Security headers present
- [ ] No console errors
- [ ] HTTPS enabled
- [ ] VAPID keys set
- [ ] Manifest valid
- [ ] Service Worker active

### Post-Deployment

- [ ] Test on production URL
- [ ] Verify SSL certificate
- [ ] Test on real devices
- [ ] Monitor error logs
- [ ] Check analytics

---

## 🐛 Common Issues & Fixes

### Issue: Service Worker not registering

**Fix:**
```javascript
// Check browser console
if ('serviceWorker' in navigator) {
  console.log('Service Worker supported')
} else {
  console.error('Service Worker NOT supported')
}

// Clear old SW
navigator.serviceWorker.getRegistrations()
  .then(registrations => {
    registrations.forEach(reg => reg.unregister())
  })
```

### Issue: Notifications not showing

**Checklist:**
- [ ] HTTPS enabled
- [ ] VAPID keys set correctly
- [ ] Browser supports notifications
- [ ] Permissions granted
- [ ] Service Worker active
- [ ] Not in Do Not Disturb mode

### Issue: Install prompt not showing

**Reasons:**
- Already installed
- Not on HTTPS
- Prompt dismissed before
- PWA criteria not met

**Fix:**
```javascript
// Check criteria
// DevTools → Application → Manifest
// Look for warnings
```

### Issue: Icons not loading

**Fix:**
- Check file exists: `public/icon-192x192.svg`
- Verify path in manifest: `/icon-192x192.svg`
- Check file permissions
- Clear cache and refresh

---

## 📊 Testing Tools

### Browser DevTools
- Chrome: F12 → Application tab
- Firefox: F12 → Application tab
- Safari: Develop → Show Web Inspector

### Online Tools
- [Lighthouse](https://web.dev/measure/)
- [PWA Builder](https://www.pwabuilder.com/)
- [Manifest Validator](https://manifest-validator.appspot.com/)
- [WebPageTest](https://www.webpagetest.org/)

### CLI Tools
```bash
# Lighthouse
npm install -g lighthouse
lighthouse https://your-site.com

# web-push CLI
npm install -g web-push
web-push generate-vapid-keys
```

---

Happy Testing! 🧪✅

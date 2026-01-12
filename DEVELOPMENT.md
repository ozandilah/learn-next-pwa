# Development Guide

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Generate VAPID keys
npx web-push generate-vapid-keys

# Add keys to .env.local
# NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
# VAPID_PRIVATE_KEY=your_private_key

# Run development server
npm run dev

# Run with HTTPS (required for push notifications)
npm run dev -- --experimental-https
```

## 📁 File Structure Explanation

### Core PWA Files

#### `src/app/manifest.ts`
Web App Manifest yang mendefinisikan metadata PWA:
- Name, short name, description
- Icons untuk berbagai sizes
- Display mode (standalone membuat app full-screen)
- Theme colors
- Start URL dan orientation

#### `public/sw.js`
Service Worker yang handles:
- **Install event:** Cache essential resources saat first install
- **Activate event:** Clean up old caches
- **Fetch event:** Network-first strategy dengan cache fallback
- **Push event:** Handle incoming push notifications
- **Notificationclick event:** Handle user interaction dengan notifications

#### `src/app/components/PushNotificationManager.tsx`
Client component untuk manage push notifications:
- Service Worker registration
- Subscription management (subscribe/unsubscribe)
- Send test notifications
- Permission handling
- Error states

#### `src/app/components/InstallPrompt.tsx`
Client component untuk install prompts:
- Detect platform (iOS vs Android/Desktop)
- Handle `beforeinstallprompt` event (Chrome/Edge)
- Show iOS-specific instructions
- Detect if already installed (standalone mode)

#### `src/app/actions.ts`
Server Actions untuk push notifications:
- `subscribeUser()` - Store subscription
- `unsubscribeUser()` - Remove subscription
- `sendNotification()` - Send single notification
- `sendBulkNotifications()` - Send to multiple users

### Configuration Files

#### `next.config.ts`
Next.js configuration dengan:
- Security headers (X-Frame-Options, CSP, etc)
- Service Worker specific headers
- Cache control untuk SW

#### `.env.local`
Environment variables:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - Public key (exposed to client)
- `VAPID_PRIVATE_KEY` - Private key (server-only, NEVER expose)

## 🔧 Development Workflow

### 1. Local Development (HTTP)

```bash
npm run dev
```

- URL: http://localhost:3000
- ⚠️ Push notifications TIDAK akan work
- Service Worker tetap work
- Install prompt TIDAK akan muncul

### 2. Local Development (HTTPS)

```bash
npm run dev -- --experimental-https
```

- URL: https://localhost:3000
- ✅ Push notifications work
- ✅ Install prompt work
- ⚠️ Browser akan warning tentang self-signed certificate (normal, klik proceed)

### 3. Testing Service Worker

**Chrome DevTools:**
1. Open DevTools (F12)
2. Go to Application tab
3. Click Service Workers
4. You can:
   - Unregister SW
   - Update SW
   - Skip waiting
   - View SW lifecycle

**Test Offline:**
1. Application > Service Workers > Check "Offline"
2. Refresh page
3. Should show offline page

### 4. Testing Push Notifications

**Prerequisites:**
- Run with HTTPS
- Allow notification permissions

**Steps:**
1. Click "Subscribe to Notifications"
2. Allow permissions when prompted
3. Enter test message
4. Click "Send Test Notification"
5. Notification should appear!

**Debug:**
- Check browser console for errors
- Verify VAPID keys are set correctly
- Check Service Worker is registered
- Ensure notifications are not blocked in browser settings

### 5. Testing Installation

**Chrome/Edge:**
- Install icon should appear in address bar
- Or use "Install app" from menu
- App will open in standalone window

**iOS Safari:**
- Share button > Add to Home Screen
- Icon appears on home screen
- Opens in full-screen mode

**Testing Install Detection:**
```javascript
// Check if already installed
if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('App is installed')
}
```

## 🐛 Common Issues & Solutions

### Issue: Push notifications not working

**Solutions:**
1. Check HTTPS is enabled
2. Verify VAPID keys in `.env.local`
3. Check notification permissions
4. Verify Service Worker is registered:
   ```javascript
   navigator.serviceWorker.ready.then(reg => {
     console.log('SW registered:', reg)
   })
   ```

### Issue: Service Worker not updating

**Solutions:**
1. In DevTools > Application > Service Workers
2. Check "Update on reload"
3. Or click "Unregister" then refresh

### Issue: Icons not showing

**Solutions:**
1. Generate proper PNG icons (192x192 and 512x512)
2. Use tools like:
   - https://realfavicongenerator.net/
   - https://favicon.io/
3. Place in `public/` folder
4. Update paths in `manifest.ts`

### Issue: Install prompt not showing

**Reasons:**
1. Already installed
2. Not running on HTTPS
3. Browser already dismissed prompt
4. PWA criteria not met

**Check PWA criteria:**
- Valid manifest.json
- Valid Service Worker
- Served over HTTPS
- Has icons (192x192 minimum)

## 📊 Performance Optimization

### 1. Optimize Service Worker Caching

```javascript
// Cache only essential resources
const urlsToCache = [
  '/',
  '/offline',
  '/icon-192x192.png',
  // Don't cache everything!
]
```

### 2. Use Appropriate Caching Strategy

**Network First (current):**
- Good for: Dynamic content, API calls
- Fresh content when online
- Fallback to cache when offline

**Cache First:**
```javascript
// For static assets that rarely change
caches.match(event.request)
  .then(response => response || fetch(event.request))
```

**Stale While Revalidate:**
```javascript
// Serve cached, fetch in background
caches.match(event.request)
  .then(cachedResponse => {
    const fetchPromise = fetch(event.request)
      .then(response => {
        cache.put(event.request, response.clone())
        return response
      })
    return cachedResponse || fetchPromise
  })
```

### 3. Optimize Images

```bash
# Use next/image for automatic optimization
import Image from 'next/image'

<Image
  src="/icon-512x512.png"
  alt="PWA Icon"
  width={512}
  height={512}
  priority
/>
```

### 4. Code Splitting

Next.js automatically code-splits, but you can optimize further:

```javascript
// Lazy load heavy components
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
})
```

## 🧪 Testing Checklist

- [ ] Service Worker registers successfully
- [ ] Offline page shows when offline
- [ ] Push notifications work
- [ ] Install prompt shows (if not installed)
- [ ] App installs correctly
- [ ] Icons display correctly
- [ ] Manifest.json accessible
- [ ] Security headers present
- [ ] HTTPS works
- [ ] Works on iOS Safari
- [ ] Works on Chrome/Edge
- [ ] Works on Firefox
- [ ] Lighthouse PWA score > 90

## 🚀 Production Deployment

### Pre-deployment Checklist

1. **Generate production VAPID keys:**
   ```bash
   npx web-push generate-vapid-keys
   ```

2. **Set environment variables on deployment platform**

3. **Generate real icons:**
   - Use https://realfavicongenerator.net/
   - Generate all sizes: 192x192, 512x512, etc
   - Consider maskable icons for Android

4. **Replace in-memory storage with database:**
   ```typescript
   // Example with Prisma
   await prisma.pushSubscription.create({
     data: { endpoint, p256dh, auth }
   })
   ```

5. **Add analytics:**
   ```javascript
   // Track install events
   window.addEventListener('appinstalled', () => {
     analytics.track('pwa_installed')
   })
   ```

6. **Test on real devices:**
   - iOS Safari
   - Android Chrome
   - Desktop browsers

### Deployment Platforms

**Vercel (Recommended):**
```bash
vercel
```

**Environment Variables:**
- NEXT_PUBLIC_VAPID_PUBLIC_KEY
- VAPID_PRIVATE_KEY

**Auto HTTPS:** ✅ (Vercel provides)

## 📈 Monitoring & Analytics

### Track PWA Metrics

```javascript
// Install events
window.addEventListener('appinstalled', () => {
  console.log('PWA installed')
  // Send to analytics
})

// Push notification clicks
self.addEventListener('notificationclick', (event) => {
  // Track click
})

// Offline usage
if (!navigator.onLine) {
  // Track offline usage
}
```

### Lighthouse CI

Add to package.json:
```json
{
  "scripts": {
    "lighthouse": "lighthouse https://your-site.com --view"
  }
}
```

## 🔐 Security Best Practices

1. **Never commit private keys**
2. **Validate all user input**
3. **Use HTTPS in production**
4. **Implement rate limiting for push notifications**
5. **Validate push subscription endpoints**
6. **Use CSP headers**
7. **Keep dependencies updated**

## 📚 Additional Resources

- [Next.js PWA Docs](https://nextjs.org/docs/app/building-your-application/configuring/progressive-web-apps)
- [MDN Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [PWA Builder](https://www.pwabuilder.com/)

---

Happy coding! 🚀

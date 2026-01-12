# 🚀 Production Deployment Checklist

Complete checklist untuk deploy PWA ke production dengan best practices.

---

## 📋 Pre-Deployment Checklist

### 1. Security

- [ ] **Generate new VAPID keys untuk production**
  ```bash
  npx web-push generate-vapid-keys
  ```
  ⚠️ **NEVER reuse development keys in production**

- [ ] **Update .env.local dengan production keys**
  ```env
  NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_new_public_key
  VAPID_PRIVATE_KEY=your_new_private_key
  ```

- [ ] **Verify .gitignore includes:**
  ```
  .env.local
  .env*.local
  ```

- [ ] **Security headers configured** (already done in `next.config.ts`)

- [ ] **CSP policies validated**

### 2. Assets

- [ ] **Replace placeholder icons dengan production icons**
  
  **Required sizes:**
  - icon-192x192.png
  - icon-512x512.png
  - icon-192x192-maskable.png (recommended)
  - icon-512x512-maskable.png (recommended)
  - apple-touch-icon.png (180x180 for iOS)
  - favicon.ico

  **Generate with:**
  - https://realfavicongenerator.net/
  - Or: `npx pwa-asset-generator logo.png public/icons`

- [ ] **Add apple-touch-icon** untuk iOS
  ```tsx
  // In layout.tsx
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  ```

- [ ] **Update manifest.ts dengan production URLs**
  ```typescript
  // Change start_url if needed
  start_url: '/',
  // Update icon paths
  icons: [
    { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    // ...
  ]
  ```

- [ ] **Add screenshots untuk app stores** (optional)
  ```typescript
  screenshots: [
    {
      src: '/screenshots/desktop.png',
      sizes: '1280x720',
      type: 'image/png',
      form_factor: 'wide',
    },
    {
      src: '/screenshots/mobile.png',
      sizes: '750x1334',
      type: 'image/png',
      form_factor: 'narrow',
    },
  ]
  ```

### 3. Database Setup

- [ ] **Setup production database** (PostgreSQL, MongoDB, etc.)

- [ ] **Create subscriptions table/collection**
  
  **Example Prisma schema:**
  ```prisma
  model PushSubscription {
    id        String   @id @default(cuid())
    endpoint  String   @unique
    p256dh    String
    auth      String
    userId    String?
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
    
    @@index([userId])
    @@index([endpoint])
  }
  ```

- [ ] **Update actions.ts untuk use database**
  ```typescript
  export async function subscribeUser(sub: PushSubscription) {
    await prisma.pushSubscription.create({
      data: {
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      }
    })
    return { success: true }
  }
  ```

- [ ] **Run database migrations**
  ```bash
  npx prisma migrate deploy
  ```

### 4. Code Quality

- [ ] **Run linting**
  ```bash
  npm run lint
  ```
  Fix all errors and warnings

- [ ] **Run type checking**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Remove console.logs** (or use proper logging)
  ```typescript
  // Replace
  console.log('Debug info')
  
  // With
  if (process.env.NODE_ENV === 'development') {
    console.log('Debug info')
  }
  ```

- [ ] **Check for TODO/FIXME comments**
  ```bash
  grep -r "TODO\|FIXME" src/
  ```

### 5. Testing

- [ ] **All features tested locally**
- [ ] **Lighthouse PWA score: 100**
- [ ] **Tested on Chrome desktop**
- [ ] **Tested on Safari iOS**
- [ ] **Tested on Chrome Android**
- [ ] **Push notifications work**
- [ ] **Offline mode works**
- [ ] **Install works on all platforms**
- [ ] **No console errors**

---

## 🌐 Deployment Steps

### Option 1: Vercel (Recommended)

#### Initial Setup

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set environment variables**
   ```bash
   vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY
   vercel env add VAPID_PRIVATE_KEY
   ```
   
   Or via Vercel Dashboard:
   - Go to Project Settings
   - Environment Variables
   - Add variables for Production

5. **Redeploy after adding env vars**
   ```bash
   vercel --prod
   ```

#### Vercel Configuration

Create `vercel.json` (optional):
```json
{
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    }
  ]
}
```

### Option 2: Netlify

1. **Build command:**
   ```bash
   npm run build
   ```

2. **Publish directory:**
   ```
   .next
   ```

3. **Add environment variables** in Netlify dashboard

4. **Add headers** in `netlify.toml`:
   ```toml
   [[headers]]
     for = "/sw.js"
     [headers.values]
       Cache-Control = "no-cache, no-store, must-revalidate"
   ```

### Option 3: Self-Hosted

1. **Build project**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

3. **Use process manager** (PM2)
   ```bash
   npm install -g pm2
   pm2 start npm --name "pwa-app" -- start
   pm2 save
   pm2 startup
   ```

4. **Setup reverse proxy** (Nginx)
   ```nginx
   server {
     listen 443 ssl http2;
     server_name your-domain.com;
     
     ssl_certificate /path/to/cert.pem;
     ssl_certificate_key /path/to/key.pem;
     
     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

---

## 🔐 SSL/HTTPS Setup

### Vercel/Netlify
✅ **Automatic HTTPS** - nothing to do!

### Self-Hosted

**Option 1: Let's Encrypt (Free)**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

**Option 2: Cloudflare (Free)**
1. Add site to Cloudflare
2. Update nameservers
3. Enable "Full (strict)" SSL mode

---

## 📊 Post-Deployment Verification

### 1. Check Production URL

- [ ] **HTTPS working** (🔒 in address bar)
- [ ] **No SSL errors**
- [ ] **Service Worker registers**
- [ ] **Manifest loads** (check DevTools)
- [ ] **Icons load correctly**

### 2. Test PWA Features

- [ ] **Install prompt shows**
- [ ] **App installs successfully**
- [ ] **Push notifications work**
- [ ] **Offline mode works**
- [ ] **Security headers present**

### 3. Run Lighthouse on Production

```bash
lighthouse https://your-domain.com --view
```

**Target scores:**
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+
- PWA: 100 ✅

### 4. Test on Real Devices

- [ ] **iOS Safari** (iPhone/iPad)
- [ ] **Chrome Android**
- [ ] **Chrome Desktop**
- [ ] **Edge Desktop**
- [ ] **Firefox Desktop**

### 5. Verify Environment Variables

```bash
# Check in production console (be careful!)
console.log(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) // Should show
console.log(process.env.VAPID_PRIVATE_KEY) // Should be undefined (server-only)
```

---

## 📈 Monitoring & Analytics

### 1. Error Monitoring

**Setup Sentry:**
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

**Configure:**
```typescript
// sentry.client.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
})
```

### 2. Analytics

**Track PWA events:**
```typescript
// Track installs
window.addEventListener('appinstalled', () => {
  analytics.track('pwa_installed')
})

// Track notification engagement
self.addEventListener('notificationclick', () => {
  analytics.track('notification_clicked')
})
```

### 3. Performance Monitoring

**Web Vitals:**
```bash
npm install web-vitals
```

```typescript
// pages/_app.tsx
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

function sendToAnalytics(metric) {
  analytics.track(metric.name, metric)
}

getCLS(sendToAnalytics)
getFID(sendToAnalytics)
getFCP(sendToAnalytics)
getLCP(sendToAnalytics)
getTTFB(sendToAnalytics)
```

---

## 🔄 Update Strategy

### Service Worker Updates

**Current strategy** (in sw.js):
```javascript
self.addEventListener('install', (event) => {
  self.skipWaiting() // Activate immediately
})

self.addEventListener('activate', (event) => {
  self.clients.claim() // Take control immediately
})
```

**For production**, consider:
```javascript
// Show update available notification
self.addEventListener('activate', (event) => {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SW_UPDATED',
        message: 'New version available! Refresh to update.'
      })
    })
  })
})
```

**Add update notification** in app:
```typescript
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'SW_UPDATED') {
        // Show update notification
        setShowUpdateBanner(true)
      }
    })
  }
}, [])
```

---

## 🎯 Performance Optimization

### 1. Image Optimization

```typescript
// Use next/image
import Image from 'next/image'

<Image
  src="/icon-512x512.png"
  alt="PWA Icon"
  width={512}
  height={512}
  priority
/>
```

### 2. Code Splitting

```typescript
// Lazy load components
import dynamic from 'next/dynamic'

const PushNotifications = dynamic(
  () => import('./components/PushNotificationManager'),
  { loading: () => <p>Loading...</p> }
)
```

### 3. Caching Strategy

```javascript
// In sw.js, customize cache strategy
const CACHE_NAME = 'pwa-v1'
const STATIC_CACHE = 'static-v1'
const DYNAMIC_CACHE = 'dynamic-v1'

// Cache static assets aggressively
// Cache API responses with short TTL
// Cache images with long TTL
```

---

## 🔒 Security Hardening

### 1. Rate Limiting

**For push notifications:**
```typescript
// Example with Upstash Rate Limit
import { Ratelimit } from '@upstash/ratelimit'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 notifications per hour
})

export async function sendNotification(message: string) {
  const { success } = await ratelimit.limit('notification-send')
  
  if (!success) {
    throw new Error('Rate limit exceeded')
  }
  
  // Send notification...
}
```

### 2. Input Validation

```typescript
// Validate all inputs
export async function sendNotification(message: string) {
  if (!message || message.length > 100) {
    throw new Error('Invalid message')
  }
  
  // Sanitize
  const cleanMessage = message.replace(/[<>]/g, '')
  
  // Send...
}
```

### 3. CORS Configuration

```typescript
// next.config.ts
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'https://your-domain.com' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST' },
      ],
    },
  ]
}
```

---

## 📱 App Store Submission (Optional)

### PWABuilder Package

```bash
# Generate store packages
npx @pwabuilder/cli package https://your-domain.com
```

**Generates:**
- Android APK/AAB
- Windows MSIX
- iOS package (with additional steps)

### Requirements
- Valid manifest.json ✅
- HTTPS ✅
- Service Worker ✅
- High-quality icons ✅
- Privacy policy (required for stores)
- Terms of service

---

## ✅ Final Checklist

### Before Launch

- [ ] Production VAPID keys generated
- [ ] Environment variables set
- [ ] Database configured
- [ ] Icons replaced (PNG, not SVG)
- [ ] SSL certificate valid
- [ ] All tests passing
- [ ] Lighthouse score 100 (PWA)
- [ ] Error monitoring setup
- [ ] Analytics configured
- [ ] Tested on real devices
- [ ] Documentation updated
- [ ] Privacy policy added
- [ ] Terms of service added

### Launch Day

- [ ] Deploy to production
- [ ] Verify PWA installability
- [ ] Test push notifications
- [ ] Monitor error logs
- [ ] Check analytics
- [ ] Announce launch! 🎉

### Post-Launch

- [ ] Monitor performance
- [ ] Track user engagement
- [ ] Collect feedback
- [ ] Plan updates
- [ ] Maintain service worker

---

## 🆘 Troubleshooting Production Issues

### Issue: Service Worker not updating

**Solution:**
```javascript
// Force update
navigator.serviceWorker.getRegistrations()
  .then(registrations => {
    registrations.forEach(reg => reg.update())
  })
```

### Issue: Push notifications failing

**Check:**
1. VAPID keys set correctly
2. Database storing subscriptions
3. Subscription endpoints valid
4. Rate limits not exceeded
5. Error logs for details

### Issue: Icons not showing

**Solutions:**
- Clear CDN cache
- Verify file paths
- Check file sizes (<= 512KB recommended)
- Use PNG, not SVG

---

## 📞 Support & Resources

**Documentation:**
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Deployment](https://vercel.com/docs)
- [Web Push Protocol](https://datatracker.ietf.org/doc/html/rfc8030)

**Tools:**
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [PWA Builder](https://www.pwabuilder.com/)
- [Web.dev](https://web.dev/progressive-web-apps/)

---

**Good luck with your production deployment! 🚀**

Your PWA is ready to provide an amazing user experience to users worldwide! 🌍

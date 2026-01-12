/**
 * PWA Utilities
 * Helper functions untuk PWA functionality
 */

/**
 * Check if app is running as PWA (installed)
 */
export function isPWA(): boolean {
  if (typeof window === 'undefined') return false
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  )
}

/**
 * Check if Service Worker is supported
 */
export function isServiceWorkerSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'serviceWorker' in navigator
}

/**
 * Check if Push Notifications are supported
 */
export function isPushNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'PushManager' in window && 'serviceWorker' in navigator
}

/**
 * Check if Notification API is supported
 */
export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'Notification' in window
}

/**
 * Get current notification permission
 */
export function getNotificationPermission(): NotificationPermission | null {
  if (!isNotificationSupported()) return null
  return Notification.permission
}

/**
 * Check if user is online
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true
  return navigator.onLine
}

/**
 * Detect iOS device
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

/**
 * Detect Android device
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false
  return /Android/.test(navigator.userAgent)
}

/**
 * Get device type
 */
export function getDeviceType(): 'ios' | 'android' | 'desktop' {
  if (isIOS()) return 'ios'
  if (isAndroid()) return 'android'
  return 'desktop'
}

/**
 * Format notification permission for display
 */
export function formatPermissionStatus(permission: NotificationPermission): {
  status: string
  color: string
  icon: string
} {
  switch (permission) {
    case 'granted':
      return {
        status: 'Granted',
        color: 'text-green-600',
        icon: '✅',
      }
    case 'denied':
      return {
        status: 'Denied',
        color: 'text-red-600',
        icon: '❌',
      }
    case 'default':
      return {
        status: 'Not asked',
        color: 'text-yellow-600',
        icon: '⚠️',
      }
    default:
      return {
        status: 'Unknown',
        color: 'text-gray-600',
        icon: '❓',
      }
  }
}

/**
 * Register service worker with error handling
 */
export async function registerServiceWorker(
  swPath: string = '/sw.js'
): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    console.warn('Service Workers not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register(swPath, {
      scope: '/',
      updateViaCache: 'none',
    })

    console.log('Service Worker registered successfully:', registration.scope)
    return registration
  } catch (error) {
    console.error('Service Worker registration failed:', error)
    return null
  }
}

/**
 * Unregister all service workers
 */
export async function unregisterServiceWorkers(): Promise<boolean> {
  if (!isServiceWorkerSupported()) return false

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    
    await Promise.all(
      registrations.map(registration => registration.unregister())
    )

    console.log('All Service Workers unregistered')
    return true
  } catch (error) {
    console.error('Failed to unregister Service Workers:', error)
    return false
  }
}

/**
 * Check if there's a service worker update available
 */
export async function checkServiceWorkerUpdate(): Promise<boolean> {
  if (!isServiceWorkerSupported()) return false

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration) return false

    await registration.update()
    return registration.waiting !== null
  } catch (error) {
    console.error('Failed to check for updates:', error)
    return false
  }
}

/**
 * Convert VAPID key from base64 to Uint8Array
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  
  return outputArray
}

/**
 * Show browser notification (for testing)
 */
export async function showNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported')
    return
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted')
    return
  }

  if (!isServiceWorkerSupported()) {
    // Fallback to basic notification
    new Notification(title, options)
    return
  }

  // Use service worker to show notification
  const registration = await navigator.serviceWorker.ready
  await registration.showNotification(title, options)
}

/**
 * Listen to online/offline status
 */
export function setupConnectivityListeners(
  onOnline?: () => void,
  onOffline?: () => void
): () => void {
  if (typeof window === 'undefined') return () => {}

  const handleOnline = () => {
    console.log('App is online')
    onOnline?.()
  }

  const handleOffline = () => {
    console.log('App is offline')
    onOffline?.()
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Cleanup function
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

/**
 * Get PWA installation source
 */
export function getInstallSource(): string | null {
  if (typeof window === 'undefined') return null

  // Check if installed from home screen
  if ((window.navigator as any).standalone) {
    return 'ios_home_screen'
  }

  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'web_app_manifest'
  }

  if (document.referrer.includes('android-app://')) {
    return 'android_webapk'
  }

  return null
}

/**
 * Estimate storage quota usage
 */
export async function getStorageEstimate(): Promise<{
  usage: number
  quota: number
  percentage: number
} | null> {
  if (!('storage' in navigator && 'estimate' in navigator.storage)) {
    return null
  }

  try {
    const estimate = await navigator.storage.estimate()
    const usage = estimate.usage || 0
    const quota = estimate.quota || 0
    const percentage = quota > 0 ? (usage / quota) * 100 : 0

    return {
      usage: Math.round(usage / 1024 / 1024), // MB
      quota: Math.round(quota / 1024 / 1024), // MB
      percentage: Math.round(percentage),
    }
  } catch (error) {
    console.error('Failed to estimate storage:', error)
    return null
  }
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<boolean> {
  if (!('caches' in window)) return false

  try {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map(name => caches.delete(name)))
    console.log('All caches cleared')
    return true
  } catch (error) {
    console.error('Failed to clear caches:', error)
    return false
  }
}

'use client'

import { useEffect, useState } from 'react'

export default function PWARefresh() {
  const [needsRefresh, setNeedsRefresh] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    // Check for service worker updates
    navigator.serviceWorker.ready.then((registration) => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setNeedsRefresh(true)
            }
          })
        }
      })
    })

    // Check for updates periodically
    const checkForUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          await registration.update()
        }
      } catch (error) {
        console.error('Failed to check for updates:', error)
      }
    }

    const interval = setInterval(checkForUpdates, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    if (typeof window === 'undefined') return
    
    // Force reload to activate new service worker
    window.location.reload()
  }

  const handleClearCache = async () => {
    if (typeof window === 'undefined') return

    try {
      // Unregister all service workers
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const registration of registrations) {
        await registration.unregister()
      }

      // Clear all caches
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map((name) => caches.delete(name)))

      alert('Cache cleared! Page will reload.')
      window.location.reload()
    } catch (error) {
      console.error('Failed to clear cache:', error)
      alert('Failed to clear cache. Please try again.')
    }
  }

  if (!needsRefresh) return null

  return (
    <div className="fixed bottom-4 right-4 max-w-sm z-50">
      <div className="bg-blue-600 text-white p-4 rounded-lg shadow-lg">
        <p className="font-semibold mb-2">🔄 Update Available</p>
        <p className="text-sm mb-3">A new version is available. Refresh to update.</p>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="flex-1 px-4 py-2 bg-white text-blue-600 rounded hover:bg-blue-50 font-medium"
          >
            Refresh
          </button>
          <button
            onClick={() => setNeedsRefresh(false)}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  )
}

// Export clear cache function for manual use
export function ClearCacheButton() {
  const handleClearCache = async () => {
    if (typeof window === 'undefined') return

    try {
      // Unregister all service workers
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const registration of registrations) {
        await registration.unregister()
      }

      // Clear all caches
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map((name) => caches.delete(name)))

      alert('✅ Cache cleared! Page will reload.')
      window.location.reload()
    } catch (error) {
      console.error('Failed to clear cache:', error)
      alert('❌ Failed to clear cache. Please try again.')
    }
  }

  return (
    <button
      onClick={handleClearCache}
      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
    >
      🗑️ Clear Cache & Reload
    </button>
  )
}

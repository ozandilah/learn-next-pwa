'use client'

import { useState, useEffect } from 'react'

/**
 * InstallPrompt Component
 * Handles:
 * - PWA installation prompt for different platforms
 * - iOS specific instructions (manual install)
 * - beforeinstallprompt event handling (Chrome/Edge)
 * - Display mode detection (standalone = already installed)
 */
export function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
    // Detect iOS devices
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    )

    // Check if already installed (running in standalone mode)
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    )

    // Listen for beforeinstallprompt event (Chrome/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstallable(false)
      setDeferredPrompt(null)
      console.log('PWA was installed')
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  /**
   * Trigger installation prompt (Chrome/Edge only)
   */
  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for user's choice
    const { outcome } = await deferredPrompt.userChoice
    console.log(`User response to install prompt: ${outcome}`)

    // Clear the deferred prompt
    setDeferredPrompt(null)
    setIsInstallable(false)
  }

  // Don't show if already installed
  if (isStandalone) {
    return (
      <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
        <p className="text-green-800 dark:text-green-300 font-medium">
          ✅ App is already installed!
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 
                    border border-purple-200 dark:border-purple-700 rounded-lg shadow-sm">
      <h3 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
        📱 Install App
      </h3>

      {/* Chrome/Edge Install Button */}
      {isInstallable && !isIOS && (
        <button
          onClick={handleInstallClick}
          className="w-full mb-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 
                   text-white rounded-lg hover:from-purple-700 hover:to-blue-700 
                   transition-all font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          ⬇️ Add to Home Screen
        </button>
      )}

      {/* iOS Instructions */}
      {isIOS && (
        <div className="space-y-3">
          <p className="text-zinc-700 dark:text-zinc-300 font-medium">
            To install this app on your iOS device:
          </p>
          <ol className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400 list-decimal list-inside">
            <li>
              Tap the <strong>Share button</strong>{' '}
              <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-lg">
                📤
              </span>{' '}
              in Safari
            </li>
            <li>
              Scroll and tap{' '}
              <strong className="text-blue-600 dark:text-blue-400">
                "Add to Home Screen"
              </strong>{' '}
              <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-lg">
                ➕
              </span>
            </li>
            <li>Tap <strong>"Add"</strong> in the top right corner</li>
          </ol>
        </div>
      )}

      {/* Generic Instructions for other browsers */}
      {!isInstallable && !isIOS && (
        <div className="space-y-3">
          <p className="text-zinc-700 dark:text-zinc-300">
            To install this app:
          </p>
          <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside">
            <li>
              <strong>Chrome/Edge:</strong> Look for the install icon in the address bar
            </li>
            <li>
              <strong>Firefox:</strong> Tap the menu and select "Install"
            </li>
            <li>
              <strong>Safari:</strong> Use the Share menu and "Add to Home Screen"
            </li>
          </ul>
        </div>
      )}

      {/* Benefits Section */}
      <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-700">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 font-medium">
          Benefits of installing:
        </p>
        <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
          <li>🚀 Faster loading times</li>
          <li>📡 Works offline</li>
          <li>🔔 Receive push notifications</li>
          <li>📱 Full-screen app experience</li>
        </ul>
      </div>
    </div>
  )
}

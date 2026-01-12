'use client'

import { useState, useEffect } from 'react'
import { subscribeUser, unsubscribeUser, sendNotification } from '../actions'

/**
 * Utility function to convert VAPID public key from base64 to Uint8Array
 * Required for Web Push API subscription
 */
function urlBase64ToUint8Array(base64String: string) {
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
 * PushNotificationManager Component
 * Handles:
 * - Service Worker registration
 * - Push notification subscription/unsubscription
 * - Sending test notifications
 * - Permission handling
 */
export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if Push Notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      registerServiceWorker()
    }
  }, [])

  /**
   * Register Service Worker and check existing subscription
   */
  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      })
      
      // Check if already subscribed
      const sub = await registration.pushManager.getSubscription()
      setSubscription(sub)
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      setError('Failed to register Service Worker')
    }
  }

  /**
   * Subscribe to push notifications
   */
  async function subscribeToPush() {
    setIsLoading(true)
    setError(null)

    try {
      // Request notification permission
      const permission = await Notification.requestPermission()
      
      if (permission !== 'granted') {
        setError('Notification permission denied')
        setIsLoading(false)
        return
      }

      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready
      
      // Subscribe to push manager
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })

      setSubscription(sub)
      
      // Send subscription to server
      const serializedSub = JSON.parse(JSON.stringify(sub))
      await subscribeUser(serializedSub)
      
    } catch (error) {
      console.error('Failed to subscribe:', error)
      setError('Failed to subscribe to push notifications')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async function unsubscribeFromPush() {
    setIsLoading(true)
    setError(null)

    try {
      await subscription?.unsubscribe()
      setSubscription(null)
      await unsubscribeUser()
    } catch (error) {
      console.error('Failed to unsubscribe:', error)
      setError('Failed to unsubscribe')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Send a test notification
   */
  async function sendTestNotification() {
    if (!subscription || !message.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      await sendNotification(message)
      setMessage('')
    } catch (error) {
      console.error('Failed to send notification:', error)
      setError('Failed to send notification')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isSupported) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          ⚠️ Push notifications are not supported in this browser.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
      <h3 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
        🔔 Push Notifications
      </h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {subscription ? (
        <div className="space-y-4">
          <p className="text-green-600 dark:text-green-400 font-medium">
            ✅ You are subscribed to push notifications
          </p>
          
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Enter notification message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg 
                       bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <div className="flex gap-2">
              <button
                onClick={sendTestNotification}
                disabled={isLoading || !message.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg
                         hover:bg-blue-700 disabled:bg-zinc-300 disabled:cursor-not-allowed
                         transition-colors font-medium"
              >
                {isLoading ? 'Sending...' : 'Send Test Notification'}
              </button>
              
              <button
                onClick={unsubscribeFromPush}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg
                         hover:bg-red-700 disabled:bg-zinc-300 disabled:cursor-not-allowed
                         transition-colors font-medium"
              >
                {isLoading ? 'Processing...' : 'Unsubscribe'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-zinc-600 dark:text-zinc-400">
            Enable push notifications to receive updates even when the app is closed.
          </p>
          
          <button
            onClick={subscribeToPush}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg
                     hover:bg-green-700 disabled:bg-zinc-300 disabled:cursor-not-allowed
                     transition-colors font-medium"
          >
            {isLoading ? 'Subscribing...' : '🔔 Subscribe to Notifications'}
          </button>
        </div>
      )}
    </div>
  )
}

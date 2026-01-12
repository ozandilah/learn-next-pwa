'use client'

import { useEffect, useState } from 'react'
import {
  isPWA,
  isOnline,
  getDeviceType,
  getNotificationPermission,
  formatPermissionStatus,
  getStorageEstimate,
} from '@/lib/pwa-utils'

/**
 * PWAStatus Component
 * Displays current PWA status information
 * Useful for debugging and user awareness
 */
export function PWAStatus() {
  const [isInstalled, setIsInstalled] = useState(false)
  const [online, setOnline] = useState(true)
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop')
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [storage, setStorage] = useState<{ usage: number; quota: number; percentage: number } | null>(null)
  const [swStatus, setSwStatus] = useState<'active' | 'installing' | 'waiting' | 'none'>('none')

  useEffect(() => {
    // Check installation status
    setIsInstalled(isPWA())
    
    // Check online status
    setOnline(isOnline())
    
    // Detect device
    setDeviceType(getDeviceType())
    
    // Get notification permission
    const permission = getNotificationPermission()
    if (permission) setNotificationPermission(permission)

    // Get storage estimate
    getStorageEstimate().then(estimate => {
      if (estimate) setStorage(estimate)
    })

    // Check service worker status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        if (registration.active) {
          setSwStatus('active')
        } else if (registration.installing) {
          setSwStatus('installing')
        } else if (registration.waiting) {
          setSwStatus('waiting')
        }
      }).catch(() => {
        setSwStatus('none')
      })
    }

    // Listen to online/offline events
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const permissionStatus = formatPermissionStatus(notificationPermission)

  return (
    <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
      <h3 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
        📊 PWA Status
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Installation Status */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Installation</div>
          <div className="flex items-center gap-2">
            <span className="text-lg">{isInstalled ? '✅' : '📱'}</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {isInstalled ? 'Installed' : 'Not Installed'}
            </span>
          </div>
        </div>

        {/* Connection Status */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Connection</div>
          <div className="flex items-center gap-2">
            <span className="text-lg">{online ? '🟢' : '🔴'}</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {online ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Device Type */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Device</div>
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {deviceType === 'ios' ? '📱' : deviceType === 'android' ? '🤖' : '💻'}
            </span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100 capitalize">
              {deviceType}
            </span>
          </div>
        </div>

        {/* Notification Permission */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Notifications</div>
          <div className="flex items-center gap-2">
            <span className="text-lg">{permissionStatus.icon}</span>
            <span className={`font-medium ${permissionStatus.color}`}>
              {permissionStatus.status}
            </span>
          </div>
        </div>

        {/* Service Worker Status */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Service Worker</div>
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {swStatus === 'active' ? '✅' : swStatus === 'installing' ? '⏳' : swStatus === 'waiting' ? '⏸️' : '❌'}
            </span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100 capitalize">
              {swStatus}
            </span>
          </div>
        </div>

        {/* Storage Usage */}
        {storage && (
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Storage</div>
            <div className="flex items-center gap-2">
              <span className="text-lg">💾</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {storage.usage}MB / {storage.quota}MB
              </span>
            </div>
            <div className="mt-2 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${storage.percentage}%` }}
              />
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {storage.percentage}% used
            </div>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          {!isInstalled && (
            <p>💡 Install the app for a better experience!</p>
          )}
          {notificationPermission !== 'granted' && (
            <p>💡 Enable notifications to receive updates</p>
          )}
          {!online && (
            <p>⚡ You're offline, but the app still works!</p>
          )}
        </div>
      </div>
    </div>
  )
}

import { PushNotificationManager } from './components/PushNotificationManager'
import { InstallPrompt } from './components/InstallPrompt'
import { PWAStatus } from './components/PWAStatus'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-900 dark:via-black dark:to-zinc-900">
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            Next.js PWA Tutorial
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400">
            Progressive Web App with Push Notifications & Offline Support
          </p>
          
          {/* Feature badges */}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
              ⚡ Lightning Fast
            </span>
            <span className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
              📱 Installable
            </span>
            <span className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium">
              🔔 Push Notifications
            </span>
            <span className="px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full text-sm font-medium">
              📡 Offline Ready
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* PWA Status */}
          <PWAStatus />
          
          {/* Install Prompt */}
          <InstallPrompt />
          
          {/* Push Notifications Manager */}
          <PushNotificationManager />
          
          {/* Info Section */}
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
              ℹ️ About This PWA
            </h3>
            <div className="space-y-3 text-zinc-600 dark:text-zinc-400">
              <p>
                This is a fully functional Progressive Web App built with <strong>Next.js 15</strong> featuring:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Service Worker:</strong> Handles caching, offline support, and push notifications</li>
                <li><strong>Web App Manifest:</strong> Makes the app installable on devices</li>
                <li><strong>Push Notifications:</strong> Real-time notifications using Web Push API</li>
                <li><strong>Offline Support:</strong> Works without internet connection</li>
                <li><strong>Responsive Design:</strong> Works on all devices and screen sizes</li>
              </ul>
            </div>
          </div>

          {/* Technology Stack */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 
                          border border-blue-200 dark:border-blue-700 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                🎨 Frontend
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                <li>• Next.js 15 (App Router)</li>
                <li>• React 19</li>
                <li>• TypeScript</li>
                <li>• Tailwind CSS</li>
              </ul>
            </div>

            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 
                          border border-green-200 dark:border-green-700 rounded-lg">
              <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">
                🔧 Backend
              </h4>
              <ul className="text-sm text-green-800 dark:text-green-400 space-y-1">
                <li>• Server Actions</li>
                <li>• Web Push API</li>
                <li>• Service Workers</li>
                <li>• VAPID Protocol</li>
              </ul>
            </div>
          </div>

          {/* Next Steps */}
          <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 
                        border border-purple-200 dark:border-purple-700 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-purple-900 dark:text-purple-300">
              🚀 Next Steps
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-purple-800 dark:text-purple-400">
              <li>Install VAPID keys (see README.md)</li>
              <li>Run in HTTPS mode: <code className="px-2 py-1 bg-purple-100 dark:bg-purple-900 rounded text-sm">npm run dev -- --experimental-https</code></li>
              <li>Test push notifications</li>
              <li>Install the app to your home screen</li>
              <li>Test offline functionality</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  )
}

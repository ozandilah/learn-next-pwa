'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-black p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center">
            <svg 
              className="w-12 h-12 text-zinc-500 dark:text-zinc-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" 
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          You're Offline
        </h1>

        {/* Description */}
        <p className="text-zinc-600 dark:text-zinc-400 text-lg">
          It looks like you've lost your internet connection. This page is available offline thanks to our PWA capabilities!
        </p>

        {/* Features list */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 shadow-sm border border-zinc-200 dark:border-zinc-700">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            What you can do offline:
          </h2>
          <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400 text-left">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>View previously loaded pages</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Access cached content</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Browse offline-enabled features</span>
            </li>
          </ul>
        </div>

        {/* Retry button */}
        <button
          onClick={() => window.location.reload()}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg 
                   transition-colors shadow-sm hover:shadow-md"
        >
          Try Again
        </button>

        {/* Tips */}
        <div className="text-xs text-zinc-500 dark:text-zinc-500 space-y-1">
          <p>💡 Tip: This page was cached by our service worker</p>
          <p>Check your connection and try refreshing</p>
        </div>
      </div>
    </div>
  )
}

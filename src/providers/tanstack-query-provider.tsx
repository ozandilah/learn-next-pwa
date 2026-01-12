'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, type ReactNode } from 'react'

export function TanstackQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Offline-first configuration
            staleTime: 5 * 60 * 1000, // 5 minutes - data dianggap fresh
            gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            refetchOnMount: true,
            retry: (failureCount, error: any) => {
              // Don't retry on 404 or other client errors
              if (error?.response?.status === 404) return false
              return failureCount < 3
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // PENTING: Network mode untuk offline support
            networkMode: 'offlineFirst', // Coba cache dulu, baru network
          },
          mutations: {
            // PENTING: Retry mutations when back online
            networkMode: 'offlineFirst',
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
            // Mutation tetap jalan meskipun offline (optimistic updates)
            onError: (error) => {
              console.log('Mutation failed (might be offline):', error)
            },
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

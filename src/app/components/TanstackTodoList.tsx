'use client'

import { useCreateTodo, useDeleteTodo, useTodos, useUpdateTodo } from '@/hooks/useTodos'
import { useEffect, useState } from 'react'
import { ClearCacheButton } from './PWARefresh'

export default function TanstackTodoList() {
  const [newTodo, setNewTodo] = useState('')
  const [isOnline, setIsOnline] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Ensure client-side only
  useEffect(() => {
    setMounted(true)
  }, [])

  // Monitor online/offline status with connectivity check
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Initial check
    const checkConnectivity = async () => {
      try {
        // Try to fetch a small resource to verify real connectivity
        const response = await fetch('/manifest.webmanifest', {
          method: 'HEAD',
          cache: 'no-cache'
        })
        setIsOnline(response.ok)
      } catch {
        setIsOnline(false)
      }
    }

    checkConnectivity()

    const handleOnline = () => {
      checkConnectivity()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Periodic connectivity check (every 10 seconds)
    const interval = setInterval(checkConnectivity, 10000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  // Don't render until mounted (prevent SSR issues)
  if (!mounted) {
    return (
      <div className="p-8 border border-zinc-700 rounded-lg bg-zinc-900/50">
        <div className="animate-pulse text-center">Initializing...</div>
      </div>
    )
  }

  return <TanstackTodoListClient isOnline={isOnline} />
}

// Separate client component that uses hooks
function TanstackTodoListClient({ isOnline }: { isOnline: boolean }) {
  const [newTodo, setNewTodo] = useState('')
  const [initialized, setInitialized] = useState(false)

  // TanStack Query hooks - only called after mounting
  const { data: todos = [], isLoading, error, refetch } = useTodos()
  const createMutation = useCreateTodo()
  const updateMutation = useUpdateTodo()
  const deleteMutation = useDeleteTodo()

  // Initialize and pre-populate cache from IndexedDB if offline
  useEffect(() => {
    const initializeOfflineData = async () => {
      if (!navigator.onLine) {
        console.log('Offline mode - checking IndexedDB')
        try {
          const { offlineDB } = await import('@/lib/offline-storage')
          await offlineDB.init()
          const offlineTodos = await offlineDB.todos.getAll()
          console.log(`Loaded ${offlineTodos.length} todos from IndexedDB`)
        } catch (error) {
          console.error('Failed to load offline data:', error)
        }
      }
      setInitialized(true)
    }

    initializeOfflineData()
  }, [])

  // CREATE - Add new todo (works offline!)
  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.trim()) return

    try {
      await createMutation.mutateAsync({
        title: newTodo,
        completed: false,
      })
      setNewTodo('')
    } catch (error) {
      console.error('Failed to create todo:', error)
    }
  }

  // UPDATE
  const handleToggleTodo = async (id: string, completed: boolean) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: { completed: !completed },
      })
    } catch (error) {
      console.error('Failed to toggle todo:', error)
    }
  }

  // DELETE
  const handleDeleteTodo = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
    } catch (error) {
      console.error('Failed to delete todo:', error)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="p-8 border border-zinc-700 rounded-lg bg-zinc-900/50">
        <div className="animate-pulse text-center">Loading todos from Supabase...</div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-8 border border-red-700 rounded-lg bg-red-900/20">
        <div className="text-red-500">
          <p className="font-bold mb-2">Error loading todos</p>
          <p className="text-sm">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const completedCount = todos.filter((t) => t.completed).length
  const activeCount = todos.filter((t) => !t.completed).length
  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  return (
    <div className="p-8 border border-zinc-700 rounded-lg bg-zinc-900/50">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Todo List (Supabase + TanStack Query)</h2>
          <div className="flex items-center gap-4">
            {/* Online/Offline Status */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {/* Clear Cache Button for Debugging */}
            <ClearCacheButton />

            {/* Mutation Status */}
            {isMutating && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-sm text-blue-500">Syncing...</span>
              </div>
            )}
          </div>
        </div>

        {/* Info Badge */}
        <div className="p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700 rounded-lg">
          <p className="text-sm">
            ⚡ <strong>TanStack Query + Supabase:</strong> Optimistic updates, automatic refetching,
            offline-first caching. Try disconnecting your internet - changes are cached and will sync
            when you reconnect!
          </p>
        </div>
      </div>

      {/* Add Todo Form */}
      <form onSubmit={handleAddTodo} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="What needs to be done?"
            className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!newTodo.trim() || createMutation.isPending}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? 'Adding...' : 'Add'}
          </button>
        </div>
      </form>

      {/* Todo List */}
      <div className="space-y-2">
        {todos.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">No todos yet. Add one above!</div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                todo.id.startsWith('temp-')
                  ? 'bg-yellow-900/20 border-yellow-700/50 animate-pulse'
                  : 'bg-zinc-800/50 border-zinc-700'
              }`}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggleTodo(todo.id, todo.completed)}
                disabled={updateMutation.isPending}
                className="w-5 h-5 cursor-pointer disabled:opacity-50"
              />

              {/* Title */}
              <span className={`flex-1 ${todo.completed ? 'line-through text-zinc-500' : ''}`}>
                {todo.title}
              </span>

              {/* Badges */}
              <div className="flex items-center gap-2">
                {todo.id.startsWith('temp-') && (
                  <span className="text-xs px-2 py-1 bg-yellow-900/50 text-yellow-500 rounded">
                    Syncing...
                  </span>
                )}

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteTodo(todo.id)}
                  disabled={deleteMutation.isPending}
                  className="px-3 py-1 text-sm bg-red-600/20 hover:bg-red-600/40 text-red-500 rounded disabled:opacity-50"
                >
                  {deleteMutation.isPending ? '...' : 'Delete'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="mt-6 pt-6 border-t border-zinc-700">
        <div className="flex justify-between text-sm text-zinc-400">
          <span>Total: {todos.length}</span>
          <span>Completed: {completedCount}</span>
          <span>Active: {activeCount}</span>
        </div>
      </div>

      {/* Technology Stack */}
      <div className="mt-6 pt-6 border-t border-zinc-700">
        <div className="flex flex-wrap gap-2">
          <span className="text-xs px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full">
            🗄️ Supabase PostgreSQL
          </span>
          <span className="text-xs px-3 py-1 bg-purple-900/30 text-purple-400 rounded-full">
            ⚛️ TanStack Query v5
          </span>
          <span className="text-xs px-3 py-1 bg-green-900/30 text-green-400 rounded-full">
            🔄 Optimistic Updates
          </span>
          <span className="text-xs px-3 py-1 bg-orange-900/30 text-orange-400 rounded-full">
            📡 Offline-First
          </span>
        </div>
      </div>
    </div>
  )
}

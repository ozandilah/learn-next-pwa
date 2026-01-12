'use client'

import { useEffect, useState } from 'react'
import { offlineDB, syncManager } from '@/lib/offline-storage'

interface Todo {
  id: number
  title: string
  completed: boolean
  synced: boolean
  localOnly?: boolean
  createdAt: number
  updatedAt: number
}

export default function OfflineTodoList() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Initialize offline storage
  useEffect(() => {
    const init = async () => {
      await offlineDB.init()
      await loadTodos()
      setInitialized(true)
      
      // Register for background sync
      await syncManager.registerSync()
    }

    init()
  }, [])

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true)
      setIsSyncing(true)
      await syncManager.syncNow()
      await loadTodos() // Reload after sync
      setIsSyncing(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    setIsOnline(navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load todos from IndexedDB
  const loadTodos = async () => {
    try {
      const allTodos = await offlineDB.todos.getAll()
      setTodos(allTodos.sort((a, b) => b.createdAt - a.createdAt))
    } catch (error) {
      console.error('Failed to load todos:', error)
    }
  }

  // CREATE - Add new todo (works offline!)
  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.trim()) return

    try {
      const id = await offlineDB.todos.create({
        title: newTodo,
        completed: false,
      })

      console.log('✅ Todo created locally with ID:', id)

      // Reload todos
      await loadTodos()
      setNewTodo('')

      // If online, try to sync immediately
      if (isOnline) {
        setIsSyncing(true)
        await syncManager.syncNow()
        await loadTodos()
        setIsSyncing(false)
      }
    } catch (error) {
      console.error('Failed to add todo:', error)
      alert('Failed to add todo')
    }
  }

  // UPDATE - Toggle todo completion (works offline!)
  const toggleTodo = async (id: number, completed: boolean) => {
    try {
      await offlineDB.todos.update(id, { completed: !completed })
      console.log('✅ Todo updated locally')

      // Reload todos
      await loadTodos()

      // If online, try to sync immediately
      if (isOnline) {
        setIsSyncing(true)
        await syncManager.syncNow()
        await loadTodos()
        setIsSyncing(false)
      }
    } catch (error) {
      console.error('Failed to toggle todo:', error)
      alert('Failed to update todo')
    }
  }

  // DELETE - Remove todo (works offline!)
  const deleteTodo = async (id: number) => {
    try {
      await offlineDB.todos.delete(id)
      console.log('✅ Todo deleted locally')

      // Reload todos
      await loadTodos()

      // If online, try to sync immediately
      if (isOnline) {
        setIsSyncing(true)
        await syncManager.syncNow()
        await loadTodos()
        setIsSyncing(false)
      }
    } catch (error) {
      console.error('Failed to delete todo:', error)
      alert('Failed to delete todo')
    }
  }

  // Manual sync trigger
  const handleManualSync = async () => {
    if (!isOnline) {
      alert('Cannot sync while offline')
      return
    }

    setIsSyncing(true)
    await syncManager.syncNow()
    await loadTodos()
    setIsSyncing(false)
  }

  if (!initialized) {
    return (
      <div className="p-8 border border-gray-700 rounded-lg bg-gray-900/50">
        <div className="animate-pulse">Initializing offline storage...</div>
      </div>
    )
  }

  const unsyncedCount = todos.filter((t) => !t.synced).length

  return (
    <div className="p-8 border border-gray-700 rounded-lg bg-gray-900/50">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Offline Todo List</h2>
          <div className="flex items-center gap-4">
            {/* Online/Offline Status */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Sync Status */}
            {unsyncedCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-sm text-yellow-500">
                  {unsyncedCount} unsynced
                </span>
              </div>
            )}

            {/* Sync Button */}
            {isOnline && unsyncedCount > 0 && (
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
              >
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
            )}
          </div>
        </div>

        {/* Info Badge */}
        <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
          <p className="text-sm">
            ✨ <strong>Offline-First Demo:</strong> Try disconnecting your internet!
            You can still <strong>create, edit, and delete</strong> todos.
            Changes will automatically sync when you reconnect.
          </p>
        </div>
      </div>

      {/* Add Todo Form */}
      <form onSubmit={addTodo} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="What needs to be done?"
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!newTodo.trim()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </form>

      {/* Todo List */}
      <div className="space-y-2">
        {todos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No todos yet. Add one above!
          </div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className={`flex items-center gap-3 p-4 rounded-lg border ${
                todo.synced
                  ? 'bg-gray-800/50 border-gray-700'
                  : 'bg-yellow-900/20 border-yellow-700/50'
              }`}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id, todo.completed)}
                className="w-5 h-5 cursor-pointer"
              />

              {/* Title */}
              <span
                className={`flex-1 ${
                  todo.completed ? 'line-through text-gray-500' : ''
                }`}
              >
                {todo.title}
              </span>

              {/* Badges */}
              <div className="flex items-center gap-2">
                {!todo.synced && (
                  <span className="text-xs px-2 py-1 bg-yellow-900/50 text-yellow-500 rounded">
                    Not Synced
                  </span>
                )}
                {todo.localOnly && (
                  <span className="text-xs px-2 py-1 bg-blue-900/50 text-blue-500 rounded">
                    Local Only
                  </span>
                )}

                {/* Delete Button */}
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="px-3 py-1 text-sm bg-red-600/20 hover:bg-red-600/40 text-red-500 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <div className="flex justify-between text-sm text-gray-400">
          <span>Total: {todos.length}</span>
          <span>Completed: {todos.filter((t) => t.completed).length}</span>
          <span>Active: {todos.filter((t) => !t.completed).length}</span>
        </div>
      </div>
    </div>
  )
}

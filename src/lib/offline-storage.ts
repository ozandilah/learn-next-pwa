/**
 * Offline Storage Manager
 * Handles CRUD operations with offline support using IndexedDB
 */

// IndexedDB wrapper untuk offline storage
class OfflineStorage {
  private dbName = 'pwa-offline-db'
  private version = 1
  private db: IDBDatabase | null = null

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores
        if (!db.objectStoreNames.contains('todos')) {
          const todoStore = db.createObjectStore('todos', { keyPath: 'id', autoIncrement: true })
          todoStore.createIndex('synced', 'synced', { unique: false })
          todoStore.createIndex('createdAt', 'createdAt', { unique: false })
        }

        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true })
        }
      }
    })
  }

  /**
   * CREATE - Add new item (works offline)
   */
  async create(storeName: string, data: any): Promise<number> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      
      const item = {
        ...data,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        synced: false, // Belum sync ke server
        localOnly: true, // Dibuat saat offline
      }

      const request = store.add(item)

      request.onsuccess = () => resolve(request.result as number)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * READ - Get all items
   */
  async getAll(storeName: string): Promise<any[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * READ - Get single item by ID
   */
  async getById(storeName: string, id: number): Promise<any> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * UPDATE - Update existing item (works offline)
   */
  async update(storeName: string, id: number, data: any): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      
      // Get existing item first
      const getRequest = store.get(id)

      getRequest.onsuccess = () => {
        const existing = getRequest.result
        if (!existing) {
          reject(new Error('Item not found'))
          return
        }

        const updated = {
          ...existing,
          ...data,
          updatedAt: Date.now(),
          synced: false, // Mark as not synced
        }

        const updateRequest = store.put(updated)
        updateRequest.onsuccess = () => resolve()
        updateRequest.onerror = () => reject(updateRequest.error)
      }

      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  /**
   * DELETE - Delete item (works offline)
   */
  async delete(storeName: string, id: number): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get unsynced items (to sync when back online)
   */
  async getUnsynced(storeName: string): Promise<any[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const index = store.index('synced')
      const request = index.getAll(IDBKeyRange.only(false))

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Mark item as synced
   */
  async markAsSynced(storeName: string, id: number): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      
      const getRequest = store.get(id)

      getRequest.onsuccess = () => {
        const item = getRequest.result
        if (!item) {
          reject(new Error('Item not found'))
          return
        }

        item.synced = true
        item.localOnly = false

        const updateRequest = store.put(item)
        updateRequest.onsuccess = () => resolve()
        updateRequest.onerror = () => reject(updateRequest.error)
      }

      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  /**
   * Add operation to sync queue
   */
  async addToSyncQueue(operation: {
    type: 'create' | 'update' | 'delete'
    storeName: string
    data: any
    localId?: number
  }): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite')
      const store = transaction.objectStore('syncQueue')
      
      const item = {
        ...operation,
        timestamp: Date.now(),
        retries: 0,
      }

      const request = store.add(item)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get sync queue
   */
  async getSyncQueue(): Promise<any[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readonly')
      const store = transaction.objectStore('syncQueue')
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Clear sync queue after successful sync
   */
  async clearSyncQueue(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite')
      const store = transaction.objectStore('syncQueue')
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorage()

// Helper functions for common operations
export const offlineDB = {
  /**
   * Initialize database
   */
  init: () => offlineStorage.init(),

  /**
   * CRUD operations for todos (example)
   */
  todos: {
    create: (data: { title: string; completed?: boolean }) => 
      offlineStorage.create('todos', data),
    
    getAll: () => 
      offlineStorage.getAll('todos'),
    
    getById: (id: number) => 
      offlineStorage.getById('todos', id),
    
    update: (id: number, data: Partial<{ title: string; completed: boolean }>) => 
      offlineStorage.update('todos', id, data),
    
    delete: (id: number) => 
      offlineStorage.delete('todos', id),
    
    getUnsynced: () => 
      offlineStorage.getUnsynced('todos'),
    
    markAsSynced: (id: number) => 
      offlineStorage.markAsSynced('todos', id),
  },

  /**
   * Sync queue operations
   */
  sync: {
    add: (operation: any) => 
      offlineStorage.addToSyncQueue(operation),
    
    getQueue: () => 
      offlineStorage.getSyncQueue(),
    
    clear: () => 
      offlineStorage.clearSyncQueue(),
  },
}

/**
 * Background Sync Manager
 * Syncs data when connection is restored
 */
export class BackgroundSyncManager {
  private syncInProgress = false

  /**
   * Register for background sync (uses Service Worker)
   */
  async registerSync(tag: string = 'sync-data'): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in (ServiceWorkerRegistration as any).prototype) {
      const registration = await navigator.serviceWorker.ready
      try {
        await (registration as any).sync.register(tag)
        console.log('Background sync registered')
      } catch (error) {
        console.error('Background sync registration failed:', error)
        // Fallback: sync immediately
        await this.syncNow()
      }
    } else {
      // No background sync support, sync immediately when online
      this.setupOnlineListener()
    }
  }

  /**
   * Sync data immediately
   */
  async syncNow(): Promise<void> {
    if (this.syncInProgress) {
      console.log('Sync already in progress')
      return
    }

    if (!navigator.onLine) {
      console.log('Offline, cannot sync')
      return
    }

    this.syncInProgress = true

    try {
      await offlineStorage.init()
      
      // Get unsynced items
      const unsyncedTodos = await offlineStorage.getUnsynced('todos')
      
      console.log(`Syncing ${unsyncedTodos.length} unsynced items...`)

      // Sync each item
      for (const todo of unsyncedTodos) {
        try {
          if (todo.localOnly) {
            // Create on server
            const response = await fetch('/api/todos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(todo),
            })

            if (response.ok) {
              await offlineStorage.markAsSynced('todos', todo.id)
              console.log(`Synced todo ${todo.id}`)
            }
          } else {
            // Update on server
            const response = await fetch(`/api/todos/${todo.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(todo),
            })

            if (response.ok) {
              await offlineStorage.markAsSynced('todos', todo.id)
              console.log(`Updated todo ${todo.id}`)
            }
          }
        } catch (error) {
          console.error(`Failed to sync todo ${todo.id}:`, error)
        }
      }

      console.log('Sync completed!')
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      this.syncInProgress = false
    }
  }

  /**
   * Setup listener for when device comes back online
   */
  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      console.log('Back online! Syncing...')
      this.syncNow()
    })
  }
}

export const syncManager = new BackgroundSyncManager()

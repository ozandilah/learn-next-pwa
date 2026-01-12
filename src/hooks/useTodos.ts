import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { offlineDB } from '@/lib/offline-storage'

// Types
export interface Todo {
  id: string
  title: string
  completed: boolean
  userId?: string | null
  createdAt: Date
  updatedAt: Date
}

interface CreateTodoInput {
  title: string
  completed?: boolean
  userId?: string
}

interface UpdateTodoInput {
  title?: string
  completed?: boolean
}

// API functions
const fetchTodos = async (): Promise<Todo[]> => {
  const response = await fetch('/api/todos')
  if (!response.ok) throw new Error('Failed to fetch todos')
  return response.json()
}

const createTodo = async (data: CreateTodoInput): Promise<Todo> => {
  const response = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to create todo')
  return response.json()
}

const updateTodo = async (id: string, data: UpdateTodoInput): Promise<Todo> => {
  const response = await fetch(`/api/todos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to update todo')
  return response.json()
}

const deleteTodo = async (id: string): Promise<void> => {
  const response = await fetch(`/api/todos/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Failed to delete todo')
}

// Hooks
export function useTodos() {
  return useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      // Kalau offline, ambil dari cache atau IndexedDB
      if (!navigator.onLine) {
        console.log('Offline - loading from cache/IndexedDB')
        
        // Coba ambil dari IndexedDB dulu
        try {
          await offlineDB.init()
          const offlineTodos = await offlineDB.todos.getAll()
          
          if (offlineTodos.length > 0) {
            console.log(`Found ${offlineTodos.length} todos in IndexedDB`)
            // Convert IndexedDB todos to proper format
            return offlineTodos.map((todo: any) => ({
              id: todo.id?.toString() || `offline-${todo.createdAt}`,
              title: todo.title,
              completed: todo.completed,
              userId: null,
              createdAt: new Date(todo.createdAt),
              updatedAt: new Date(todo.updatedAt || todo.createdAt),
            })) as Todo[]
          }
        } catch (error) {
          console.log('IndexedDB error:', error)
        }
        
        // Kalau IndexedDB kosong, return empty array (cache will be used by TanStack Query)
        return []
      }
      
      // Kalau online, fetch dari API
      return fetchTodos()
    },
    // Offline-first: will use cached data when offline
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    // PENTING: Jangan refetch kalau offline
    refetchOnMount: (query) => {
      return navigator.onLine ? 'always' : false
    },
    refetchOnWindowFocus: (query) => {
      return navigator.onLine
    },
    refetchOnReconnect: true, // Auto refetch when online
    // Retry logic
    retry: (failureCount, error: any) => {
      // Kalau offline, jangan retry
      if (!navigator.onLine) return false
      return failureCount < 3
    },
  })
}

export function useCreateTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newTodo: CreateTodoInput) => {
      // Try API call, but don't fail if offline
      try {
        return await createTodo(newTodo)
      } catch (error) {
        // If offline, return temporary todo
        if (!navigator.onLine) {
          console.log('Offline - creating temporary todo')
          return {
            id: `temp-${Date.now()}`,
            title: newTodo.title,
            completed: newTodo.completed || false,
            userId: newTodo.userId || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Todo
        }
        throw error
      }
    },
    // Optimistic updates
    onMutate: async (newTodo) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['todos'] })

      // Snapshot previous value
      const previousTodos = queryClient.getQueryData<Todo[]>(['todos'])

      // Optimistically update cache
      queryClient.setQueryData<Todo[]>(['todos'], (old = []) => [
        {
          id: `temp-${Date.now()}`, // Temporary ID
          title: newTodo.title,
          completed: newTodo.completed || false,
          userId: newTodo.userId || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        ...old,
      ])

      // Store in IndexedDB for offline support
      if (!navigator.onLine) {
        offlineDB.init().then(() => {
          offlineDB.todos.create({
            title: newTodo.title,
            completed: newTodo.completed || false,
          })
        })
      }

      return { previousTodos }
    },
    // Rollback on error (only if online)
    onError: (err, newTodo, context) => {
      console.log('Create error:', err)
      // Only rollback if online (if offline, keep optimistic update)
      if (navigator.onLine && context?.previousTodos) {
        queryClient.setQueryData(['todos'], context.previousTodos)
      }
    },
    // Refetch on success (only if online)
    onSuccess: (data) => {
      // Always save to IndexedDB for offline access
      offlineDB.init().then(() => {
        offlineDB.todos.create({
          title: data.title,
          completed: data.completed,
        })
      })
      
      if (navigator.onLine) {
        queryClient.invalidateQueries({ queryKey: ['todos'] })
      }
    },
  })
}

export function useUpdateTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTodoInput }) => {
      // Try API call, but don't fail if offline
      try {
        return await updateTodo(id, data)
      } catch (error) {
        // If offline, return updated todo from cache
        if (!navigator.onLine) {
          console.log('Offline - updating in cache only')
          const todos = queryClient.getQueryData<Todo[]>(['todos']) || []
          const todo = todos.find((t) => t.id === id)
          if (todo) {
            return { ...todo, ...data, updatedAt: new Date() } as Todo
          }
        }
        throw error
      }
    },
    // Optimistic updates
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] })

      const previousTodos = queryClient.getQueryData<Todo[]>(['todos'])

      queryClient.setQueryData<Todo[]>(['todos'], (old = []) =>
        old.map((todo) =>
          todo.id === id
            ? {
                ...todo,
                ...data,
                updatedAt: new Date(),
              }
            : todo
        )
      )

      return { previousTodos }
    },
    onError: (err, variables, context) => {
      console.log('Update error:', err)
      // Only rollback if online
      if (navigator.onLine && context?.previousTodos) {
        queryClient.setQueryData(['todos'], context.previousTodos)
      }
    },
    onSuccess: () => {
      if (navigator.onLine) {
        queryClient.invalidateQueries({ queryKey: ['todos'] })
      }
    },
  })
}

export function useDeleteTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // Try API call, but don't fail if offline
      try {
        return await deleteTodo(id)
      } catch (error) {
        // If offline, just delete from cache
        if (!navigator.onLine) {
          console.log('Offline - deleting from cache only')
          return
        }
        throw error
      }
    },
    // Optimistic updates
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] })

      const previousTodos = queryClient.getQueryData<Todo[]>(['todos'])

      queryClient.setQueryData<Todo[]>(['todos'], (old = []) => old.filter((todo) => todo.id !== id))

      return { previousTodos }
    },
    onError: (err, id, context) => {
      console.log('Delete error:', err)
      // Only rollback if online
      if (navigator.onLine && context?.previousTodos) {
        queryClient.setQueryData(['todos'], context.previousTodos)
      }
    },
    onSuccess: () => {
      if (navigator.onLine) {
        queryClient.invalidateQueries({ queryKey: ['todos'] })
      }
    },
  })
}

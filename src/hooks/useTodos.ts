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
    queryFn: fetchTodos,
    // Offline-first: will use cached data when offline
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  })
}

export function useCreateTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTodo,
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
    // Rollback on error
    onError: (err, newTodo, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos'], context.previousTodos)
      }
    },
    // Refetch on success
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
}

export function useUpdateTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTodoInput }) => updateTodo(id, data),
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
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos'], context.previousTodos)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
}

export function useDeleteTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTodo,
    // Optimistic updates
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] })

      const previousTodos = queryClient.getQueryData<Todo[]>(['todos'])

      queryClient.setQueryData<Todo[]>(['todos'], (old = []) => old.filter((todo) => todo.id !== id))

      return { previousTodos }
    },
    onError: (err, id, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos'], context.previousTodos)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
}

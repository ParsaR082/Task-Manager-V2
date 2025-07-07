import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Task, ApiResponse, CreateTaskRequest, UpdateTaskRequest } from '@/types'
import { toast } from 'sonner'

// Fetch tasks from API
const fetchTasks = async (): Promise<Task[]> => {
  const response = await fetch('/api/tasks', {
    credentials: 'include',
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
  }
  
  const data: ApiResponse<{ tasks: Task[] }> = await response.json()
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch tasks')
  }
  
  return data.data?.tasks || []
}

// Update task via API
const updateTask = async ({ taskId, updates }: { taskId: string; updates: Partial<Task> }): Promise<Task> => {
  const response = await fetch(`/api/tasks/${taskId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(updates),
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
  }
  
  const data: ApiResponse<Task> = await response.json()
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to update task')
  }
  
  return data.data!
}

// Create task via API
const createTask = async (taskData: CreateTaskRequest): Promise<Task> => {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(taskData),
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
  }
  
  const data: ApiResponse<Task> = await response.json()
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to create task')
  }
  
  return data.data!
}

// Custom hook for tasks
export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Custom hook for updating tasks
export function useUpdateTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateTask,
    onMutate: async ({ taskId, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      
      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks'])
      
      // Optimistically update to the new value
      queryClient.setQueryData<Task[]>(['tasks'], (old) => 
        old?.map(task => task.id === taskId ? { ...task, ...updates } : task) || []
      )
      
      // Return a context object with the snapshotted value
      return { previousTasks }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks)
      }
      toast.error(err.message || 'Failed to update task')
    },
    onSuccess: (data) => {
      toast.success('Task updated successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

// Custom hook for creating tasks
export function useCreateTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createTask,
    onSuccess: (data) => {
      // Add the new task to the cache
      queryClient.setQueryData<Task[]>(['tasks'], (old) => 
        old ? [...old, data] : [data]
      )
      toast.success('Task created successfully')
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create task')
    },
  })
} 
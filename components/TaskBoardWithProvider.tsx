'use client'

import { TaskBoard } from '@/components/TaskBoard'
import { useTasks, useUpdateTask } from '@/hooks/use-tasks'
import { Task } from '@/types'
import { useQueryClient } from '@tanstack/react-query'

export function TaskBoardWithProvider() {
  const { data: tasks = [], isLoading } = useTasks()
  const updateTaskMutation = useUpdateTask()
  const queryClient = useQueryClient()

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    updateTaskMutation.mutate({ taskId, updates })
  }

  const handleTaskCreate = (newTask: Task) => {
    // The task is already added to the cache by the mutation
    // We can do any additional optimistic updates here if needed
    console.log('New task created:', newTask)
  }

  return (
    <TaskBoard
      tasks={tasks}
      onTaskUpdate={handleTaskUpdate}
      onTaskCreate={handleTaskCreate}
      loading={isLoading}
    />
  )
} 
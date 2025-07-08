'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Loader2, Calendar } from 'lucide-react'
import { useProjects } from '@/hooks/use-projects'
import { useToast } from '@/hooks/use-toast'
import { useCreateTask } from '@/hooks/use-tasks'
import { TaskPriority, TaskFormData, ApiResponse, Task } from '@/types'
import { format } from 'date-fns'

const taskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must be less than 200 characters'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  deadline: z.date().optional().refine((date) => {
    if (!date) return true
    return date > new Date()
  }, 'Deadline must be in the future'),
  projectId: z.string().min(1, 'Please select a project')
})

type TaskFormValues = z.infer<typeof taskSchema>

interface TaskFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskCreated: (task: Task) => void
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: 'text-gray-600' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-blue-600' },
  { value: 'HIGH', label: 'High', color: 'text-orange-600' },
  { value: 'URGENT', label: 'Urgent', color: 'text-red-600' }
]

export function TaskForm({ open, onOpenChange, onTaskCreated }: TaskFormProps) {
  const { toast } = useToast()
  const { data: projects, isLoading: projectsLoading } = useProjects()
  const createTaskMutation = useCreateTask()

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      projectId: ''
    }
  })

  const onSubmit = async (data: TaskFormValues) => {
    // Format the data for API
    const payload = {
      title: data.title,
      description: data.description || '',
      priority: data.priority,
      deadline: data.deadline ? data.deadline.toISOString() : undefined,
      projectId: data.projectId
    }

    createTaskMutation.mutate(payload, {
      onSuccess: (newTask) => {
        // Success - reset form and close modal
        form.reset()
        onOpenChange(false)
        onTaskCreated(newTask)
      }
    })
  }

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    if (value) {
      form.setValue('deadline', new Date(value))
    } else {
      form.setValue('deadline', undefined)
    }
    form.trigger('deadline')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to your project. Fill in the details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter task title..."
              {...form.register('title')}
              className={form.formState.errors.title ? 'border-red-500' : ''}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter task description..."
              {...form.register('description')}
              rows={3}
            />
          </div>

          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="project">Project *</Label>
            <Select 
              onValueChange={(value) => form.setValue('projectId', value)}
              value={form.watch('projectId')}
            >
              <SelectTrigger className={form.formState.errors.projectId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projectsLoading ? (
                  <SelectItem value="" disabled>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading projects...
                    </div>
                  </SelectItem>
                ) : projects && projects.length > 0 ? (
                  projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: project.color }}
                        />
                        {project.name}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    No projects available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {form.formState.errors.projectId && (
              <p className="text-sm text-red-500">{form.formState.errors.projectId.message}</p>
            )}
          </div>

          {/* Priority Selection */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select 
              onValueChange={(value) => form.setValue('priority', value as TaskPriority)}
              value={form.watch('priority')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className={option.color}>{option.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Deadline Field */}
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <div className="relative">
              <Input
                id="deadline"
                type="datetime-local"
                onChange={handleDateChange}
                min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                className={form.formState.errors.deadline ? 'border-red-500' : ''}
              />
              <Calendar className="absolute right-3 top-3 h-4 w-4 opacity-50" />
            </div>
            {form.formState.errors.deadline && (
              <p className="text-sm text-red-500">{form.formState.errors.deadline.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={createTaskMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createTaskMutation.isPending || !form.formState.isValid}
              className="min-w-[100px]"
            >
              {createTaskMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Task'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 
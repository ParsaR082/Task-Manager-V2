'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Calendar, 
  Clock, 
  Flag, 
  MoreHorizontal, 
  Plus,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Timer
} from 'lucide-react'
import { Task, TaskStatus, BoardColumn, DragDropResult } from '@/types'
import { format, isAfter, isToday, isTomorrow } from 'date-fns'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface TaskBoardProps {
  tasks: Task[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>
  onTaskCreate: () => void
  loading?: boolean
}

const BOARD_COLUMNS: BoardColumn[] = [
  {
    id: 'TODO',
    title: 'To Do',
    tasks: [],
    color: 'bg-gray-100'
  },
  {
    id: 'IN_PROGRESS',
    title: 'In Progress',
    tasks: [],
    color: 'bg-blue-50'
  },
  {
    id: 'REVIEW',
    title: 'Review',
    tasks: [],
    color: 'bg-yellow-50'
  },
  {
    id: 'DONE',
    title: 'Done',
    tasks: [],
    color: 'bg-green-50'
  }
]

const PRIORITY_COLORS = {
  LOW: 'bg-gray-500',
  MEDIUM: 'bg-blue-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-red-500'
}

const STATUS_ICONS = {
  TODO: Circle,
  IN_PROGRESS: Timer,
  REVIEW: AlertTriangle,
  DONE: CheckCircle2
}

export function TaskBoard({ tasks, onTaskUpdate, onTaskCreate, loading }: TaskBoardProps) {
  const [columns, setColumns] = useState<BoardColumn[]>(BOARD_COLUMNS)
  const { toast } = useToast()

  // Organize tasks into columns
  useEffect(() => {
    const updatedColumns = BOARD_COLUMNS.map(column => ({
      ...column,
      tasks: tasks
        .filter(task => task.status === column.id)
        .sort((a, b) => a.order - b.order)
    }))
    setColumns(updatedColumns)
  }, [tasks])

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result

    // If dropped outside a droppable area
    if (!destination) return

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const sourceColumn = columns.find(col => col.id === source.droppableId)
    const destColumn = columns.find(col => col.id === destination.droppableId)
    
    if (!sourceColumn || !destColumn) return

    const draggedTask = sourceColumn.tasks.find(task => task.id === draggableId)
    if (!draggedTask) return

    try {
      // Optimistic update
      const newColumns = [...columns]
      const sourceColIndex = newColumns.findIndex(col => col.id === source.droppableId)
      const destColIndex = newColumns.findIndex(col => col.id === destination.droppableId)

      // Remove from source
      newColumns[sourceColIndex].tasks.splice(source.index, 1)

      // Add to destination
      const updatedTask = {
        ...draggedTask,
        status: destination.droppableId as TaskStatus,
        order: destination.index
      }
      newColumns[destColIndex].tasks.splice(destination.index, 0, updatedTask)

      // Update order for affected tasks
      newColumns[destColIndex].tasks.forEach((task, index) => {
        task.order = index
      })

      setColumns(newColumns)

      // Update task status and order in database
      await onTaskUpdate(draggableId, {
        status: destination.droppableId as TaskStatus,
        order: destination.index
      })

      toast({
        title: "Task moved",
        description: `Task moved to ${destColumn.title}`,
        duration: 2000,
      })

    } catch (error) {
      // Revert optimistic update on error
      setColumns(BOARD_COLUMNS.map(column => ({
        ...column,
        tasks: tasks
          .filter(task => task.status === column.id)
          .sort((a, b) => a.order - b.order)
      })))

      toast({
        title: "Error",
        description: "Failed to move task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getDeadlineColor = (deadline?: Date) => {
    if (!deadline) return 'text-gray-500'
    
    const now = new Date()
    if (isAfter(now, deadline)) return 'text-red-500' // Overdue
    if (isToday(deadline)) return 'text-orange-500' // Due today
    if (isTomorrow(deadline)) return 'text-yellow-500' // Due tomorrow
    return 'text-gray-500' // Future
  }

  const getDeadlineText = (deadline?: Date) => {
    if (!deadline) return null
    
    if (isAfter(new Date(), deadline)) return 'Overdue'
    if (isToday(deadline)) return 'Due today'
    if (isTomorrow(deadline)) return 'Due tomorrow'
    return format(deadline, 'MMM d')
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-3 bg-gray-100 rounded w-8"></div>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-20 bg-gray-100 rounded"></div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => {
          const StatusIcon = STATUS_ICONS[column.id]
          return (
            <motion.div
              key={column.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="h-fit min-h-[400px]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <StatusIcon className="h-4 w-4" />
                      {column.title}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {column.tasks.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <CardContent
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "min-h-[300px] space-y-3 transition-colors",
                        snapshot.isDraggingOver && column.color
                      )}
                    >
                      <AnimatePresence>
                        {column.tasks.map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  "transition-all duration-200",
                                  snapshot.isDragging && "rotate-2 shadow-lg"
                                )}
                              >
                                <Card className="cursor-move hover:shadow-md border-l-4 border-l-transparent hover:border-l-blue-500">
                                  <CardContent className="p-4">
                                    {/* Priority indicator */}
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <div
                                          className={cn(
                                            "w-2 h-2 rounded-full",
                                            PRIORITY_COLORS[task.priority]
                                          )}
                                        />
                                        <span className="text-xs text-gray-500 uppercase">
                                          {task.priority}
                                        </span>
                                      </div>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <MoreHorizontal className="h-3 w-3" />
                                      </Button>
                                    </div>

                                    {/* Task title */}
                                    <h4 className="font-medium text-sm mb-2 line-clamp-2">
                                      {task.title}
                                    </h4>

                                    {/* Task description */}
                                    {task.description && (
                                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                                        {task.description}
                                      </p>
                                    )}

                                    {/* Tags */}
                                    {task.tags && task.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mb-3">
                                        {task.tags.slice(0, 3).map((taskTag) => (
                                          <Badge
                                            key={taskTag.tag.id}
                                            variant="outline"
                                            className="text-xs px-1 py-0"
                                            style={{ 
                                              borderColor: taskTag.tag.color,
                                              color: taskTag.tag.color 
                                            }}
                                          >
                                            {taskTag.tag.name}
                                          </Badge>
                                        ))}
                                        {task.tags.length > 3 && (
                                          <Badge variant="outline" className="text-xs px-1 py-0">
                                            +{task.tags.length - 3}
                                          </Badge>
                                        )}
                                      </div>
                                    )}

                                    {/* Footer */}
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                      {/* Deadline */}
                                      {task.deadline && (
                                        <div className={cn(
                                          "flex items-center gap-1",
                                          getDeadlineColor(task.deadline)
                                        )}>
                                          <Calendar className="h-3 w-3" />
                                          <span>{getDeadlineText(task.deadline)}</span>
                                        </div>
                                      )}

                                      {/* Time estimate */}
                                      {task.estimatedHours && (
                                        <div className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          <span>{task.estimatedHours}h</span>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))}
                      </AnimatePresence>
                      {provided.placeholder}

                      {/* Add task button */}
                      {column.id === 'TODO' && (
                        <Button
                          variant="ghost"
                          onClick={onTaskCreate}
                          className="w-full h-12 border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Task
                        </Button>
                      )}
                    </CardContent>
                  )}
                </Droppable>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </DragDropContext>
  )
} 
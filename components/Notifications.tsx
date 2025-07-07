'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Bell,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  X,
  Settings,
  Filter
} from 'lucide-react'
import { Task, Notification, DeadlineAlert } from '@/types'
import { format, isToday, isTomorrow, differenceInDays, isAfter } from 'date-fns'
import { cn } from '@/lib/utils'

interface NotificationsProps {
  tasks: Task[]
  className?: string
}

const NOTIFICATION_TYPES = {
  deadline_today: {
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  deadline_tomorrow: {
    icon: Calendar,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  deadline_week: {
    icon: Clock,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  overdue: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300'
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  }
}

export function Notifications({ tasks, className }: NotificationsProps) {
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'all' | 'urgent' | 'today'>('all')

  // Generate deadline alerts
  const deadlineAlerts = useMemo(() => {
    const alerts: DeadlineAlert[] = []
    const now = new Date()

    tasks.forEach(task => {
      if (!task.deadline || task.status === 'DONE') return

      const deadline = new Date(task.deadline)
      const alertId = `deadline-${task.id}`

      if (dismissedNotifications.has(alertId)) return

      if (isAfter(now, deadline)) {
        // Overdue
        alerts.push({
          taskId: task.id,
          taskTitle: task.title,
          deadline,
          daysRemaining: differenceInDays(now, deadline),
          priority: task.priority
        })
      } else if (isToday(deadline)) {
        // Due today
        alerts.push({
          taskId: task.id,
          taskTitle: task.title,
          deadline,
          daysRemaining: 0,
          priority: task.priority
        })
      } else if (isTomorrow(deadline)) {
        // Due tomorrow
        alerts.push({
          taskId: task.id,
          taskTitle: task.title,
          deadline,
          daysRemaining: 1,
          priority: task.priority
        })
      } else {
        const daysUntil = differenceInDays(deadline, now)
        if (daysUntil <= 7) {
          // Due within a week
          alerts.push({
            taskId: task.id,
            taskTitle: task.title,
            deadline,
            daysRemaining: daysUntil,
            priority: task.priority
          })
        }
      }
    })

    // Sort by urgency
    return alerts.sort((a, b) => {
      // Overdue first
      if (a.daysRemaining < 0 && b.daysRemaining >= 0) return -1
      if (b.daysRemaining < 0 && a.daysRemaining >= 0) return 1
      
      // Then by days remaining
      if (a.daysRemaining !== b.daysRemaining) {
        return a.daysRemaining - b.daysRemaining
      }
      
      // Finally by priority
      const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }, [tasks, dismissedNotifications])

  // Filter notifications based on selected filter
  const filteredAlerts = useMemo(() => {
    switch (filter) {
      case 'urgent':
        return deadlineAlerts.filter(alert => 
          alert.daysRemaining <= 0 || alert.priority === 'URGENT'
        )
      case 'today':
        return deadlineAlerts.filter(alert => alert.daysRemaining === 0)
      default:
        return deadlineAlerts
    }
  }, [deadlineAlerts, filter])

  const getNotificationType = (alert: DeadlineAlert) => {
    if (alert.daysRemaining < 0) return 'overdue'
    if (alert.daysRemaining === 0) return 'deadline_today'
    if (alert.daysRemaining === 1) return 'deadline_tomorrow'
    return 'deadline_week'
  }

  const getNotificationMessage = (alert: DeadlineAlert) => {
    if (alert.daysRemaining < 0) {
      const daysOverdue = Math.abs(alert.daysRemaining)
      return `Overdue by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''}`
    }
    if (alert.daysRemaining === 0) return 'Due today'
    if (alert.daysRemaining === 1) return 'Due tomorrow'
    return `Due in ${alert.daysRemaining} days`
  }

  const dismissNotification = (alertId: string) => {
    setDismissedNotifications(prev => new Set(Array.from(prev).concat(alertId)))
  }

  const clearAllNotifications = () => {
    const alertIds = deadlineAlerts.map(alert => `deadline-${alert.taskId}`)
    setDismissedNotifications(new Set(alertIds))
  }

  if (filteredAlerts.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </div>
            <Badge variant="secondary" className="text-xs">
              0
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">All caught up!</p>
            <p className="text-xs">No urgent notifications</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {filteredAlerts.length}
            </Badge>
            {deadlineAlerts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllNotifications}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardTitle>
        
        {/* Filter Buttons */}
        <div className="flex gap-2 mt-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="text-xs"
          >
            All
          </Button>
          <Button
            variant={filter === 'urgent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('urgent')}
            className="text-xs"
          >
            Urgent
          </Button>
          <Button
            variant={filter === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('today')}
            className="text-xs"
          >
            Today
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {filteredAlerts.map((alert) => {
            const notificationType = getNotificationType(alert)
            const config = NOTIFICATION_TYPES[notificationType]
            const Icon = config.icon
            const alertId = `deadline-${alert.taskId}`

            return (
              <motion.div
                key={alertId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "p-3 rounded-lg border-l-4 relative group",
                  config.bgColor,
                  config.borderColor
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", config.color)} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {alert.taskTitle}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissNotification(alertId)}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className={cn("text-xs", config.color)}>
                        {getNotificationMessage(alert)}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs px-1 py-0",
                            alert.priority === 'URGENT' && "border-red-500 text-red-700",
                            alert.priority === 'HIGH' && "border-orange-500 text-orange-700",
                            alert.priority === 'MEDIUM' && "border-blue-500 text-blue-700",
                            alert.priority === 'LOW' && "border-gray-500 text-gray-700"
                          )}
                        >
                          {alert.priority}
                        </Badge>
                        
                        <span className="text-xs text-gray-500">
                          {format(alert.deadline, 'MMM d')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
} 
'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  Target,
  Clock,
  CheckCircle2,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react'
import { Task, Project, TaskAnalytics, ChartData, TrendData } from '@/types'
import { format, subDays, eachDayOfInterval, isWithinInterval } from 'date-fns'

interface AnalyticsChartsProps {
  tasks: Task[]
  projects: Project[]
}

const CHART_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green  
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
]

export function AnalyticsCharts({ tasks, projects }: AnalyticsChartsProps) {
  // Calculate analytics data
  const analytics = useMemo(() => {
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(task => task.status === 'DONE').length
    const pendingTasks = totalTasks - completedTasks
    const overdueTasks = tasks.filter(task => 
      task.deadline && 
      new Date() > new Date(task.deadline) && 
      task.status !== 'DONE'
    ).length

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    // Average completion time calculation
    const completedTasksWithDates = tasks.filter(task => 
      task.status === 'DONE' && 
      task.completedAt && 
      task.createdAt
    )
    
    const avgCompletionTime = completedTasksWithDates.length > 0
      ? completedTasksWithDates.reduce((acc, task) => {
          const diffInDays = Math.ceil(
            (new Date(task.completedAt!).getTime() - new Date(task.createdAt).getTime()) / 
            (1000 * 60 * 60 * 24)
          )
          return acc + diffInDays
        }, 0) / completedTasksWithDates.length
      : 0

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completionRate,
      avgCompletionTime
    }
  }, [tasks])

  // Status distribution data
  const statusDistribution: ChartData[] = useMemo(() => {
    const statusCounts = {
      TODO: 0,
      IN_PROGRESS: 0,
      REVIEW: 0,
      DONE: 0
    }

    tasks.forEach(task => {
      statusCounts[task.status]++
    })

    return [
      { name: 'To Do', value: statusCounts.TODO, color: CHART_COLORS[0] },
      { name: 'In Progress', value: statusCounts.IN_PROGRESS, color: CHART_COLORS[1] },
      { name: 'Review', value: statusCounts.REVIEW, color: CHART_COLORS[2] },
      { name: 'Done', value: statusCounts.DONE, color: CHART_COLORS[3] }
    ].filter(item => item.value > 0)
  }, [tasks])

  // Priority distribution data
  const priorityDistribution: ChartData[] = useMemo(() => {
    const priorityCounts = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0
    }

    tasks.forEach(task => {
      priorityCounts[task.priority]++
    })

    return [
      { name: 'Low', value: priorityCounts.LOW, color: CHART_COLORS[4] },
      { name: 'Medium', value: priorityCounts.MEDIUM, color: CHART_COLORS[5] },
      { name: 'High', value: priorityCounts.HIGH, color: CHART_COLORS[6] },
      { name: 'Urgent', value: priorityCounts.URGENT, color: CHART_COLORS[7] }
    ].filter(item => item.value > 0)
  }, [tasks])

  // Project progress data
  const projectProgress = useMemo(() => {
    return projects.map(project => {
      const projectTasks = tasks.filter(task => task.projectId === project.id)
      const completedTasks = projectTasks.filter(task => task.status === 'DONE').length
      const completionRate = projectTasks.length > 0 
        ? (completedTasks / projectTasks.length) * 100 
        : 0

      return {
        name: project.name,
        total: projectTasks.length,
        completed: completedTasks,
        completion: completionRate,
        color: project.color
      }
    }).filter(item => item.total > 0)
  }, [tasks, projects])

  // Trend data for the last 7 days
  const trendData: TrendData[] = useMemo(() => {
    const endDate = new Date()
    const startDate = subDays(endDate, 6) // Last 7 days
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate })

    return dateRange.map(date => {
      const dayStart = new Date(date.setHours(0, 0, 0, 0))
      const dayEnd = new Date(date.setHours(23, 59, 59, 999))

      const created = tasks.filter(task => 
        isWithinInterval(new Date(task.createdAt), { start: dayStart, end: dayEnd })
      ).length

      const completed = tasks.filter(task => 
        task.completedAt && 
        isWithinInterval(new Date(task.completedAt), { start: dayStart, end: dayEnd })
      ).length

      return {
        date: format(date, 'MMM dd'),
        created,
        completed
      }
    })
  }, [tasks])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.name === 'completion' ? '%' : ''}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold">{analytics.completionRate.toFixed(1)}%</p>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                {analytics.completionRate >= 70 ? (
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                )}
                <span className="text-xs text-gray-600">
                  {analytics.completedTasks} of {analytics.totalTasks} tasks
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Completion</p>
                  <p className="text-2xl font-bold">{analytics.avgCompletionTime.toFixed(1)} days</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <Activity className="h-4 w-4 text-blue-600 mr-1" />
                <span className="text-xs text-gray-600">
                  Based on completed tasks
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue Tasks</p>
                  <p className="text-2xl font-bold text-red-600">{analytics.overdueTasks}</p>
                </div>
                <div className="p-2 bg-red-100 rounded-full">
                  <CheckCircle2 className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <span className="text-xs text-gray-600">
                  Need immediate attention
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Projects</p>
                  <p className="text-2xl font-bold">{projects.length}</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-full">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <span className="text-xs text-gray-600">
                  {projectProgress.length} with tasks
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Task Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Priority Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Priority Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={priorityDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#8884d8">
                    {priorityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Project Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Project Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectProgress} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="completion" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* 7-Day Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>7-Day Activity Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stackId="1"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="created"
                    stackId="2"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
} 
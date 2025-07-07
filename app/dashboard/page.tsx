'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TaskBoard } from '@/components/TaskBoard'
import { AnalyticsCharts } from '@/components/AnalyticsCharts'
import { Notifications } from '@/components/Notifications'
import { Toaster } from 'sonner'
import Image from 'next/image'
import { 
  LayoutDashboard,
  BarChart3,
  Bell,
  Settings,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Users,
  Folder,
  AlertCircle
} from 'lucide-react'
import { Task, Project } from '@/types'
import { useTasks, useUpdateTask } from '@/hooks/use-tasks'
import { useProjects } from '@/hooks/use-projects'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('board')

  // 🔍 DEBUG: Log auth status and session data
  console.log('🔍 Dashboard Debug - Auth Status:', status)
  console.log('🔍 Dashboard Debug - Session:', session)
  console.log('🔍 Dashboard Debug - User ID:', session?.user?.id)

  // Fetch data using React Query
  const { 
    data: tasks = [], 
    isLoading: tasksLoading, 
    error: tasksError,
    refetch: refetchTasks 
  } = useTasks()
  
  const { 
    data: projects = [], 
    isLoading: projectsLoading, 
    error: projectsError,
    refetch: refetchProjects 
  } = useProjects()

  const updateTaskMutation = useUpdateTask()

  // 🔍 DEBUG: Log data fetching states
  console.log('🔍 Dashboard Debug - Tasks Loading:', tasksLoading)
  console.log('🔍 Dashboard Debug - Projects Loading:', projectsLoading)
  console.log('🔍 Dashboard Debug - Tasks Data:', tasks)
  console.log('🔍 Dashboard Debug - Projects Data:', projects)
  console.log('🔍 Dashboard Debug - Tasks Error:', tasksError)
  console.log('🔍 Dashboard Debug - Projects Error:', projectsError)

  // 🔍 DEBUG: Monitor loading conditions
  const isAuthLoading = status === 'loading'
  const isDataLoading = tasksLoading && projectsLoading
  const overallLoading = isAuthLoading || isDataLoading

  console.log('🔍 Dashboard Debug - Auth Loading:', isAuthLoading)
  console.log('🔍 Dashboard Debug - Data Loading:', isDataLoading)
  console.log('🔍 Dashboard Debug - Overall Loading:', overallLoading)

  // 🔍 DEBUG: Add timeout fallback
  useEffect(() => {
    console.log('🔍 Dashboard Debug - Component mounted')
    
    // Timeout fallback to prevent infinite loading
    const timeout = setTimeout(() => {
      if (overallLoading) {
        console.log('⚠️ Dashboard Debug - Loading timeout reached (10s)')
        toast.error('Loading is taking longer than expected. Please refresh the page.')
      }
    }, 10000)

    return () => clearTimeout(timeout)
  }, [overallLoading])

  // 🔍 DEBUG: Track data changes
  useEffect(() => {
    console.log('🔍 Dashboard Debug - Tasks data updated:', {
      count: tasks.length,
      isLoading: tasksLoading,
      error: tasksError?.message
    })
  }, [tasks, tasksLoading, tasksError])

  useEffect(() => {
    console.log('🔍 Dashboard Debug - Projects data updated:', {
      count: projects.length,
      isLoading: projectsLoading,
      error: projectsError?.message
    })
  }, [projects, projectsLoading, projectsError])

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  const refreshData = async () => {
    console.log('🔄 Dashboard Debug - Refreshing data...')
    try {
      await Promise.all([
        refetchTasks(),
        refetchProjects()
      ])
      console.log('✅ Dashboard Debug - Data refreshed successfully')
      toast.success('Dashboard data refreshed successfully')
    } catch (error) {
      console.error('❌ Dashboard Debug - Refresh failed:', error)
      toast.error('Failed to refresh data')
    }
  }

  const handleTaskUpdate = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      await updateTaskMutation.mutateAsync({ taskId, updates })
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error('Task update failed:', error)
    }
  }, [updateTaskMutation])

  const handleTaskCreate = () => {
    toast.info('Task creation dialog will be implemented next')
  }

  // 🔍 DEBUG: Log before each render condition
  console.log('🔍 Dashboard Debug - Render Decision:', {
    status,
    isAuthLoading,
    isDataLoading,
    overallLoading,
    hasErrors: !!(tasksError || projectsError),
    hasData: tasks.length > 0 || projects.length > 0
  })

  // Loading state with debug info
  if (overallLoading) {
    console.log('🔄 Dashboard Debug - Showing loading spinner')
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"
          />
          <p className="mt-4 text-sm text-gray-600">
            Loading dashboard... ({status === 'loading' ? 'Authenticating' : 'Fetching data'})
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Debug: Auth={status}, Tasks={tasksLoading ? 'loading' : 'ready'}, Projects={projectsLoading ? 'loading' : 'ready'}
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (tasksError || projectsError) {
    console.log('❌ Dashboard Debug - Showing error state')
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">Failed to Load Dashboard</h3>
              <p className="text-sm text-gray-600 mt-1">
                {tasksError?.message || projectsError?.message || 'An unexpected error occurred'}
              </p>
              <details className="mt-2 text-xs text-gray-500">
                <summary>Debug Info</summary>
                <pre className="mt-1 text-left">
                  {JSON.stringify({ tasksError: tasksError?.message, projectsError: projectsError?.message }, null, 2)}
                </pre>
              </details>
            </div>
            <div className="flex gap-2">
              <Button onClick={refreshData} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button onClick={handleSignOut} variant="outline">
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Empty state - no data but no errors
  if (!tasksLoading && !projectsLoading && tasks.length === 0 && projects.length === 0) {
    console.log('📭 Dashboard Debug - Showing empty state')
    return (
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Task Manager</h1>
                  <p className="text-sm text-gray-500">Welcome back, {session?.user?.name?.split(' ')[0]}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {session?.user?.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    width={40}
                    height={40}
                    className="rounded-full ring-2 ring-blue-100"
                  />
                )}
                <Button onClick={handleSignOut} variant="outline" size="sm">
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Empty State */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <LayoutDashboard className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No data found</h3>
            <p className="mt-2 text-sm text-gray-600">
              Get started by running the database seed script to populate your dashboard with sample data.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button onClick={refreshData} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleTaskCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Task
              </Button>
            </div>
            <div className="mt-8 p-4 bg-blue-50 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-blue-800">
                <strong>Need sample data?</strong> Run <code className="bg-blue-100 px-1 rounded">npm run db:seed</code> to populate your database.
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  console.log('✅ Dashboard Debug - Showing main dashboard')
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Task Manager</h1>
                <p className="text-sm text-gray-500">Welcome back, {session?.user?.name?.split(' ')[0]}</p>
              </div>
              
              <div className="hidden md:flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshData}
                  disabled={updateTaskMutation.isPending}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${updateTaskMutation.isPending ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                
                <Button
                  onClick={handleTaskCreate}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Task
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {session?.user?.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  width={40}
                  height={40}
                  className="rounded-full ring-2 ring-blue-100"
                />
              )}
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{session?.user?.name}</p>
                <p className="text-xs text-gray-500">{session?.user?.email}</p>
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="ml-4"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Tasks</p>
                  <p className="text-2xl font-bold">{tasks.length}</p>
                </div>
                <LayoutDashboard className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Completed</p>
                  <p className="text-2xl font-bold">
                    {tasks.filter(task => task.status === 'DONE').length}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">In Progress</p>
                  <p className="text-2xl font-bold">
                    {tasks.filter(task => task.status === 'IN_PROGRESS').length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Projects</p>
                  <p className="text-2xl font-bold">{projects.length}</p>
                </div>
                <Folder className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-400">
            <TabsTrigger value="board" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Board
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
              {tasks.filter(task => 
                task.deadline && 
                new Date() <= new Date(task.deadline) && 
                task.status !== 'DONE'
              ).length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
                  {tasks.filter(task => 
                    task.deadline && 
                    new Date() <= new Date(task.deadline) && 
                    task.status !== 'DONE'
                  ).length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Board View */}
          <TabsContent value="board">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <TaskBoard
                tasks={tasks}
                onTaskUpdate={handleTaskUpdate}
                onTaskCreate={handleTaskCreate}
                loading={tasksLoading || updateTaskMutation.isPending}
              />
            </motion.div>
          </TabsContent>

          {/* Analytics View */}
          <TabsContent value="analytics">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AnalyticsCharts
                tasks={tasks}
                projects={projects}
              />
            </motion.div>
          </TabsContent>

          {/* Notifications View */}
          <TabsContent value="notifications">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2">
                <Notifications tasks={tasks} />
              </div>
              
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      onClick={handleTaskCreate}
                      className="w-full justify-start gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create Task
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={refreshData}
                      className="w-full justify-start gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh Data
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Button>
                  </CardContent>
                </Card>

                {/* Debug Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Debug Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Auth Status:</span>
                        <span className="font-medium">{status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tasks loaded:</span>
                        <span className="font-medium">{tasks.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Projects loaded:</span>
                        <span className="font-medium">{projects.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tasks loading:</span>
                        <span className={`font-medium ${tasksLoading ? 'text-orange-600' : 'text-green-600'}`}>
                          {tasksLoading ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Projects loading:</span>
                        <span className={`font-medium ${projectsLoading ? 'text-orange-600' : 'text-green-600'}`}>
                          {projectsLoading ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
} 
import { User } from 'next-auth'

// ============= CORE ENTITIES =============

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  deadline?: Date
  order: number
  projectId: string
  userId: string
  tags: TaskTag[]
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  estimatedHours?: number
  actualHours?: number
}

export interface Project {
  id: string
  name: string
  description?: string
  color: string
  userId: string
  tasks: Task[]
  createdAt: Date
  updatedAt: Date
  deadline?: Date
  status: ProjectStatus
}

export interface Tag {
  id: string
  name: string
  color: string
  createdAt: Date
}

export interface TaskTag {
  id: string
  taskId: string
  tagId: string
  task: Task
  tag: Tag
}

// ============= ENUMS & TYPES =============

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'ON_HOLD'

// ============= API TYPES =============

export interface CreateTaskRequest {
  title: string
  description?: string
  priority: TaskPriority
  deadline?: string
  projectId: string
  tagIds?: string[]
  estimatedHours?: number
}

export interface UpdateTaskRequest {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  deadline?: string
  order?: number
  projectId?: string
  tagIds?: string[]
  estimatedHours?: number
  actualHours?: number
}

export interface CreateProjectRequest {
  name: string
  description?: string
  color?: string
  deadline?: string
}

export interface UpdateProjectRequest {
  name?: string
  description?: string
  color?: string
  deadline?: string
  status?: ProjectStatus
}

// ============= ANALYTICS TYPES =============

export interface TaskAnalytics {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  overdueTasks: number
  completionRate: number
  avgCompletionTime: number
  productivityScore: number
}

export interface ProjectAnalytics {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  projectCompletionRate: number
}

export interface TimeAnalytics {
  totalEstimatedHours: number
  totalActualHours: number
  efficiencyRate: number
}

export interface ChartData {
  name: string
  value: number
  color?: string
}

export interface TrendData {
  date: string
  completed: number
  created: number
}

// ============= DASHBOARD TYPES =============

export interface DashboardData {
  tasks: Task[]
  projects: Project[]
  analytics: {
    task: TaskAnalytics
    project: ProjectAnalytics
    time: TimeAnalytics
  }
  recentActivity: Activity[]
}

export interface Activity {
  id: string
  type: 'task_created' | 'task_completed' | 'project_created' | 'deadline_approaching'
  title: string
  description: string
  timestamp: Date
  taskId?: string
  projectId?: string
}

// ============= DRAG & DROP TYPES =============

export interface DragDropResult {
  source: {
    droppableId: string
    index: number
  }
  destination: {
    droppableId: string
    index: number
  } | null
  draggableId: string
}

export interface BoardColumn {
  id: TaskStatus
  title: string
  tasks: Task[]
  color: string
}

// ============= NOTIFICATION TYPES =============

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
}

export interface DeadlineAlert {
  taskId: string
  taskTitle: string
  deadline: Date
  daysRemaining: number
  priority: TaskPriority
}

// ============= FORM TYPES =============

export interface TaskFormData {
  title: string
  description: string
  priority: TaskPriority
  deadline?: Date
  projectId: string
  tagIds: string[]
  estimatedHours?: number
}

export interface ProjectFormData {
  name: string
  description: string
  color: string
  deadline?: Date
}

// ============= FILTER & SEARCH TYPES =============

export interface TaskFilters {
  status?: TaskStatus[]
  priority?: TaskPriority[]
  projectId?: string
  tagIds?: string[]
  dueDateRange?: {
    start: Date
    end: Date
  }
  search?: string
}

export interface SortOptions {
  field: 'title' | 'deadline' | 'priority' | 'createdAt' | 'updatedAt'
  direction: 'asc' | 'desc'
}

// ============= UI STATE TYPES =============

export interface UIState {
  sidebarOpen: boolean
  activeView: 'board' | 'list' | 'calendar' | 'analytics'
  selectedProject?: string
  activeFilters: TaskFilters
  sortOptions: SortOptions
  notifications: Notification[]
}

// ============= API RESPONSE TYPES =============

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  code?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ============= CALENDAR TYPES =============

export interface CalendarEvent {
  id: string
  title: string
  date: Date
  type: 'deadline' | 'milestone' | 'meeting'
  taskId?: string
  projectId?: string
  color: string
}

// ============= EXTENDED USER TYPE =============

export interface ExtendedUser extends User {
  id: string
  preferences?: {
    theme: 'light' | 'dark' | 'system'
    notifications: boolean
    emailDigest: boolean
    timezone: string
  }
}

// ============= EXPORT TYPES =============

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf'
  dateRange?: {
    start: Date
    end: Date
  }
  includeAnalytics: boolean
  projectIds?: string[]
} 
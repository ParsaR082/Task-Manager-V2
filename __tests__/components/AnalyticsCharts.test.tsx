import { render, screen } from '@testing-library/react'
import { AnalyticsCharts } from '@/components/AnalyticsCharts'
import { Task, Project } from '@/types'
import '@testing-library/jest-dom'

// Mock recharts components
jest.mock('recharts', () => ({
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Test Project 1',
    description: 'Test project',
    color: '#3B82F6',
    userId: 'user1',
    tasks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'ACTIVE'
  }
]

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Completed Task',
    description: 'Test description',
    status: 'DONE',
    priority: 'HIGH',
    deadline: new Date('2024-01-15'),
    order: 1,
    projectId: '1',
    userId: 'user1',
    tags: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-10'),
    completedAt: new Date('2024-01-10'),
    estimatedHours: 8,
    project: mockProjects[0]
  },
  {
    id: '2',
    title: 'In Progress Task',
    description: 'Test description',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    deadline: new Date('2024-02-01'),
    order: 2,
    projectId: '1',
    userId: 'user1',
    tags: [],
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-12'),
    estimatedHours: 12,
    project: mockProjects[0]
  },
  {
    id: '3',
    title: 'Todo Task',
    description: 'Test description',
    status: 'TODO',
    priority: 'LOW',
    deadline: new Date('2024-03-01'),
    order: 3,
    projectId: '1',
    userId: 'user1',
    tags: [],
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08'),
    estimatedHours: 4,
    project: mockProjects[0]
  }
]

describe('AnalyticsCharts', () => {
  it('renders all summary cards', () => {
    render(<AnalyticsCharts tasks={mockTasks} projects={mockProjects} />)

    expect(screen.getByText('Completion Rate')).toBeInTheDocument()
    expect(screen.getByText('Avg. Completion')).toBeInTheDocument()
    expect(screen.getByText('Overdue Tasks')).toBeInTheDocument()
    expect(screen.getByText('Active Projects')).toBeInTheDocument()
  })

  it('calculates completion rate correctly', () => {
    render(<AnalyticsCharts tasks={mockTasks} projects={mockProjects} />)

    // 1 completed out of 3 tasks = 33.3%
    expect(screen.getByText('33.3%')).toBeInTheDocument()
  })

  it('displays correct task counts', () => {
    render(<AnalyticsCharts tasks={mockTasks} projects={mockProjects} />)

    expect(screen.getByText('1 of 3 tasks')).toBeInTheDocument()
  })

  it('shows project count', () => {
    render(<AnalyticsCharts tasks={mockTasks} projects={mockProjects} />)

    expect(screen.getByText('1')).toBeInTheDocument() // Project count
  })

  it('renders all chart components', () => {
    render(<AnalyticsCharts tasks={mockTasks} projects={mockProjects} />)

    expect(screen.getByText('Task Status Distribution')).toBeInTheDocument()
    expect(screen.getByText('Priority Distribution')).toBeInTheDocument()
    expect(screen.getByText('Project Progress')).toBeInTheDocument()
    expect(screen.getByText('7-Day Activity Trend')).toBeInTheDocument()
  })

  it('renders charts with data', () => {
    render(<AnalyticsCharts tasks={mockTasks} projects={mockProjects} />)

    expect(screen.getAllByTestId('pie-chart')).toHaveLength(1)
    expect(screen.getAllByTestId('bar-chart')).toHaveLength(2)
    expect(screen.getAllByTestId('area-chart')).toHaveLength(1)
  })

  it('handles empty tasks gracefully', () => {
    render(<AnalyticsCharts tasks={[]} projects={[]} />)

    expect(screen.getByText('0.0%')).toBeInTheDocument() // Completion rate
    expect(screen.getByText('0')).toBeInTheDocument() // Active projects
  })

  it('calculates overdue tasks correctly', () => {
    const overdueTasks: Task[] = [
      {
        ...mockTasks[0],
        status: 'TODO',
        deadline: new Date('2023-12-01'), // Past deadline
      }
    ]

    render(<AnalyticsCharts tasks={overdueTasks} projects={mockProjects} />)

    expect(screen.getByText('1')).toBeInTheDocument() // Overdue count
  })
}) 
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TaskBoard } from '@/components/TaskBoard'
import { Task } from '@/types'
import '@testing-library/jest-dom'

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

// Mock @hello-pangea/dnd
jest.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: any) => children,
  Droppable: ({ children }: any) => children({ droppableProps: {}, innerRef: jest.fn() }),
  Draggable: ({ children }: any) => children({
    draggableProps: {},
    dragHandleProps: {},
    innerRef: jest.fn(),
  }),
}))

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Test Task 1',
    description: 'Test description',
    status: 'TODO',
    priority: 'HIGH',
    deadline: new Date('2024-02-01'),
    order: 1,
    projectId: '1',
    userId: 'user1',
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    estimatedHours: 4,
    project: {
      id: '1',
      name: 'Test Project',
      color: '#3B82F6',
      description: 'Test project',
      userId: 'user1',
      tasks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'ACTIVE'
    }
  },
  {
    id: '2',
    title: 'Test Task 2',
    description: 'Test description 2',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    deadline: new Date('2024-02-15'),
    order: 1,
    projectId: '1',
    userId: 'user1',
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    estimatedHours: 8,
    project: {
      id: '1',
      name: 'Test Project',
      color: '#3B82F6',
      description: 'Test project',
      userId: 'user1',
      tasks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'ACTIVE'
    }
  }
]

const mockOnTaskUpdate = jest.fn()
const mockOnTaskCreate = jest.fn()

describe('TaskBoard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders task board with columns', () => {
    render(
      <TaskBoard
        tasks={mockTasks}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskCreate={mockOnTaskCreate}
        loading={false}
      />
    )

    expect(screen.getByText('To Do')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('Review')).toBeInTheDocument()
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('displays tasks in correct columns', () => {
    render(
      <TaskBoard
        tasks={mockTasks}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskCreate={mockOnTaskCreate}
        loading={false}
      />
    )

    expect(screen.getByText('Test Task 1')).toBeInTheDocument()
    expect(screen.getByText('Test Task 2')).toBeInTheDocument()
  })

  it('shows loading state when loading prop is true', () => {
    render(
      <TaskBoard
        tasks={[]}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskCreate={mockOnTaskCreate}
        loading={true}
      />
    )

    expect(screen.getAllByTestId('task-skeleton')).toHaveLength(8) // 2 skeletons per column
  })

  it('displays empty state when no tasks', () => {
    render(
      <TaskBoard
        tasks={[]}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskCreate={mockOnTaskCreate}
        loading={false}
      />
    )

    expect(screen.getAllByText('No tasks yet')).toHaveLength(4) // One for each column
  })

  it('calls onTaskCreate when Add Task button is clicked', () => {
    render(
      <TaskBoard
        tasks={mockTasks}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskCreate={mockOnTaskCreate}
        loading={false}
      />
    )

    const addButton = screen.getAllByText('Add Task')[0]
    fireEvent.click(addButton)

    expect(mockOnTaskCreate).toHaveBeenCalledWith('TODO')
  })

  it('displays task priority badges correctly', () => {
    render(
      <TaskBoard
        tasks={mockTasks}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskCreate={mockOnTaskCreate}
        loading={false}
      />
    )

    expect(screen.getByText('HIGH')).toBeInTheDocument()
    expect(screen.getByText('MEDIUM')).toBeInTheDocument()
  })

  it('shows task deadlines', () => {
    render(
      <TaskBoard
        tasks={mockTasks}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskCreate={mockOnTaskCreate}
        loading={false}
      />
    )

    expect(screen.getByText('Feb 1')).toBeInTheDocument()
    expect(screen.getByText('Feb 15')).toBeInTheDocument()
  })

  it('displays project colors correctly', () => {
    render(
      <TaskBoard
        tasks={mockTasks}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskCreate={mockOnTaskCreate}
        loading={false}
      />
    )

    const taskCards = screen.getAllByTestId('task-card')
    expect(taskCards[0]).toHaveStyle('border-left-color: #3B82F6')
  })
}) 
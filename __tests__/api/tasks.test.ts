import { GET, POST } from '@/app/api/tasks/route'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  task: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
}))

const mockSession = {
  user: {
    id: 'user1',
    email: 'test@example.com',
    name: 'Test User',
  },
}

describe('/api/tasks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/tasks', () => {
    it('returns 401 when not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/tasks')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.error).toBe('Unauthorized')
    })

    it('returns tasks for authenticated user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const mockTasks = [
        {
          id: '1',
          title: 'Test Task',
          status: 'TODO',
          priority: 'HIGH',
          userId: 'user1',
        },
      ]

      const prisma = require('@/lib/prisma')
      prisma.task.findMany.mockResolvedValue(mockTasks)

      const request = new NextRequest('http://localhost:3000/api/tasks')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.tasks).toEqual(mockTasks)
    })

    it('handles database errors gracefully', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const prisma = require('@/lib/prisma')
      prisma.task.findMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/tasks')
      const response = await GET(request)

      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body.error).toBe('Internal server error')
    })
  })

  describe('POST /api/tasks', () => {
    it('returns 401 when not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Task',
          status: 'TODO',
          priority: 'MEDIUM',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.error).toBe('Unauthorized')
    })

    it('creates task with valid data', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const taskData = {
        title: 'New Task',
        description: 'Task description',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: 'project1',
      }

      const createdTask = {
        id: '1',
        ...taskData,
        userId: 'user1',
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const prisma = require('@/lib/prisma')
      prisma.task.create.mockResolvedValue(createdTask)

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.task).toEqual(createdTask)
    })

    it('validates required fields', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Missing title',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toContain('Title is required')
    })

    it('validates enum values', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Task',
          status: 'INVALID_STATUS',
          priority: 'MEDIUM',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toContain('Invalid status')
    })
  })
}) 
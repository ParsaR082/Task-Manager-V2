import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CreateTaskRequest, UpdateTaskRequest, ApiResponse, Task } from '@/types'
import { z } from 'zod'

// Validation schemas
const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  deadline: z.string().datetime().optional(),
  projectId: z.string().min(1, 'Project ID is required'),
  tagIds: z.array(z.string()).optional(),
  estimatedHours: z.number().positive().optional(),
})

const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string().min(1),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
  order: z.number().int().min(0).optional(),
  actualHours: z.number().positive().optional(),
})

// GET /api/tasks - Fetch user's tasks with filtering
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search')

    // Build where clause
    const where: any = {
      userId: session.user.id,
    }

    if (projectId) where.projectId = projectId
    if (status) where.status = status
    if (priority) where.priority = priority
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Fetch tasks with relations
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          project: {
            select: { id: true, name: true, color: true }
          },
          tags: {
            include: {
              tag: {
                select: { id: true, name: true, color: true }
              }
            }
          },
        },
        orderBy: [
          { status: 'asc' },
          { order: 'asc' },
          { createdAt: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.task.count({ where })
    ])

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        tasks: tasks,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('GET /api/tasks error:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/tasks - Create new task
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validatedData = createTaskSchema.parse(body)

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: validatedData.projectId,
        userId: session.user.id
      }
    })

    if (!project) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Project not found or unauthorized' },
        { status: 404 }
      )
    }

    // Get next order number for the TODO status
    const lastTask = await prisma.task.findFirst({
      where: {
        userId: session.user.id,
        status: 'TODO'
      },
      orderBy: { order: 'desc' }
    })

    const nextOrder = (lastTask?.order || 0) + 1

    // Create task
    const task = await prisma.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        priority: validatedData.priority,
        deadline: validatedData.deadline ? new Date(validatedData.deadline) : null,
        projectId: validatedData.projectId,
        userId: session.user.id,
        order: nextOrder,
        status: 'TODO',
      },
      include: {
        project: {
          select: { id: true, name: true, color: true }
        },
        tags: {
          include: {
            tag: {
              select: { id: true, name: true, color: true }
            }
          }
        },
      }
    })

    // Create tag associations if provided
    if (validatedData.tagIds && validatedData.tagIds.length > 0) {
      await prisma.taskTag.createMany({
        data: validatedData.tagIds.map(tagId => ({
          taskId: task.id,
          tagId
        }))
      })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: task,
      message: 'Task created successfully'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Validation error', message: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('POST /api/tasks error:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/tasks - Update task (for bulk operations)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    
    // Handle bulk status updates (for drag & drop)
    if (body.bulkUpdate && Array.isArray(body.tasks)) {
      const updatePromises = body.tasks.map((taskUpdate: any) =>
        prisma.task.update({
          where: {
            id: taskUpdate.id,
            userId: session.user.id
          },
          data: {
            status: taskUpdate.status,
            order: taskUpdate.order,
            ...(taskUpdate.status === 'DONE' && { completedAt: new Date() })
          }
        })
      )

      await Promise.all(updatePromises)

      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Tasks updated successfully'
      })
    }

    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Invalid bulk update format' },
      { status: 400 }
    )

  } catch (error) {
    console.error('PUT /api/tasks error:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
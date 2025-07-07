import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UpdateTaskRequest, ApiResponse, Task } from '@/types'
import { z } from 'zod'

const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  deadline: z.string().datetime().optional().nullable(),
  order: z.number().int().min(0).optional(),
  projectId: z.string().min(1).optional(),
  tagIds: z.array(z.string()).optional(),
  estimatedHours: z.number().positive().optional(),
  actualHours: z.number().positive().optional(),
})

// GET /api/tasks/[id] - Get single task
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const task = await prisma.task.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
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

    if (!task) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: task
    })

  } catch (error) {
    console.error('GET /api/tasks/[id] error:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/tasks/[id] - Update single task
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validatedData = updateTaskSchema.parse(body)

    // Check if task exists and user owns it
    const existingTask = await prisma.task.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingTask) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }

    // If changing project, verify new project ownership
    if (validatedData.projectId && validatedData.projectId !== existingTask.projectId) {
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
    }

    // Prepare update data
    const updateData: any = {}
    
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status
      // Set completion date when marking as done
      if (validatedData.status === 'DONE' && existingTask.status !== 'DONE') {
        updateData.completedAt = new Date()
      } else if (validatedData.status !== 'DONE') {
        updateData.completedAt = null
      }
    }
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority
    if (validatedData.deadline !== undefined) {
      updateData.deadline = validatedData.deadline ? new Date(validatedData.deadline) : null
    }
    if (validatedData.order !== undefined) updateData.order = validatedData.order
    if (validatedData.projectId !== undefined) updateData.projectId = validatedData.projectId
    if (validatedData.estimatedHours !== undefined) updateData.estimatedHours = validatedData.estimatedHours
    if (validatedData.actualHours !== undefined) updateData.actualHours = validatedData.actualHours

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: updateData,
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

    // Handle tag updates if provided
    if (validatedData.tagIds !== undefined) {
      // Remove existing tag associations
      await prisma.taskTag.deleteMany({
        where: { taskId: params.id }
      })

      // Add new tag associations
      if (validatedData.tagIds.length > 0) {
        await prisma.taskTag.createMany({
          data: validatedData.tagIds.map(tagId => ({
            taskId: params.id,
            tagId
          }))
        })
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: updatedTask,
      message: 'Task updated successfully'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Validation error', message: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('PUT /api/tasks/[id] error:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/tasks/[id] - Delete task
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if task exists and user owns it
    const task = await prisma.task.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!task) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }

    // Delete task (this will cascade delete TaskTag entries due to schema)
    await prisma.task.delete({
      where: { id: params.id }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Task deleted successfully'
    })

  } catch (error) {
    console.error('DELETE /api/tasks/[id] error:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
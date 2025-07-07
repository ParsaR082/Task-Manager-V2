import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export interface AuthenticatedUser {
  id: string
  email: string
  name?: string | null
  image?: string | null
}

/**
 * Get the authenticated user from the current session
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return null
  }
  
  return {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name,
    image: session.user.image,
  }
}

/**
 * Verify that the authenticated user owns the specified task
 */
export async function verifyTaskOwnership(taskId: string, userId: string): Promise<boolean> {
  try {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: userId,
      },
      select: { id: true }
    })
    
    return !!task
  } catch (error) {
    console.error('Error verifying task ownership:', error)
    return false
  }
}

/**
 * Verify that the authenticated user owns the specified project
 */
export async function verifyProjectOwnership(projectId: string, userId: string): Promise<boolean> {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: userId,
      },
      select: { id: true }
    })
    
    return !!project
  } catch (error) {
    console.error('Error verifying project ownership:', error)
    return false
  }
}

/**
 * Verify that all tasks in a list belong to the authenticated user
 */
export async function verifyTasksOwnership(taskIds: string[], userId: string): Promise<boolean> {
  try {
    const count = await prisma.task.count({
      where: {
        id: { in: taskIds },
        userId: userId,
      }
    })
    
    return count === taskIds.length
  } catch (error) {
    console.error('Error verifying tasks ownership:', error)
    return false
  }
}

/**
 * Check if a request has proper authentication and return user info
 */
export async function requireAuth(): Promise<{ user: AuthenticatedUser; error?: never } | { user?: never; error: { message: string; status: number } }> {
  const user = await getAuthenticatedUser()
  
  if (!user) {
    return {
      error: {
        message: 'Authentication required',
        status: 401
      }
    }
  }
  
  return { user }
}

/**
 * Validate request origin for CSRF protection
 */
export function validateRequestOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  const host = req.headers.get('host')
  
  // For GET requests, origin check is not required
  if (req.method === 'GET') {
    return true
  }
  
  // For other methods, verify origin matches host
  if (!origin || !host) {
    return false
  }
  
  return origin.endsWith(host)
}

/**
 * Rate limiting helper (basic implementation)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(identifier: string, maxRequests: number = 60, windowMs: number = 60000): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(identifier)
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    })
    return true
  }
  
  if (userLimit.count >= maxRequests) {
    return false
  }
  
  userLimit.count++
  return true
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and > characters
    .trim()
    .substring(0, 1000) // Limit length
}

/**
 * Validate that a project exists and user has access to it
 */
export async function validateProjectAccess(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: userId,
    },
    select: {
      id: true,
      name: true,
      color: true,
    }
  })
  
  return project
} 
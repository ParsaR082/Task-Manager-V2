import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { ApiResponse } from '@/types'

export interface ErrorDetails {
  message: string
  code: string
  status: number
  details?: any
}

/**
 * Standard error responses for common scenarios
 */
export const ErrorCodes = {
  UNAUTHORIZED: {
    message: 'Authentication required',
    code: 'UNAUTHORIZED',
    status: 401,
  },
  FORBIDDEN: {
    message: 'Access denied',
    code: 'FORBIDDEN',
    status: 403,
  },
  NOT_FOUND: {
    message: 'Resource not found',
    code: 'NOT_FOUND',
    status: 404,
  },
  VALIDATION_ERROR: {
    message: 'Invalid input data',
    code: 'VALIDATION_ERROR',
    status: 400,
  },
  RATE_LIMITED: {
    message: 'Too many requests',
    code: 'RATE_LIMITED',
    status: 429,
  },
  SERVER_ERROR: {
    message: 'Internal server error',
    code: 'SERVER_ERROR',
    status: 500,
  },
  DATABASE_ERROR: {
    message: 'Database operation failed',
    code: 'DATABASE_ERROR',
    status: 500,
  },
  TASK_NOT_FOUND: {
    message: 'Task not found or access denied',
    code: 'TASK_NOT_FOUND',
    status: 404,
  },
  PROJECT_NOT_FOUND: {
    message: 'Project not found or access denied',
    code: 'PROJECT_NOT_FOUND',
    status: 404,
  },
} as const

/**
 * Create a standardized error response
 */
export function createErrorResponse(error: ErrorDetails, context?: string): NextResponse<ApiResponse> {
  // Log error for debugging (but don't expose sensitive details to client)
  console.error(`[${error.code}] ${context || 'API Error'}:`, {
    message: error.message,
    status: error.status,
    details: error.details,
    timestamp: new Date().toISOString(),
  })

  return NextResponse.json<ApiResponse>(
    {
      success: false,
      error: error.message,
      code: error.code,
    },
    { status: error.status }
  )
}

/**
 * Handle Zod validation errors
 */
export function handleValidationError(error: ZodError): NextResponse<ApiResponse> {
  const details = error.issues.map(issue => ({
    field: issue.path.join('.'),
    message: issue.message,
  }))

  return createErrorResponse(
    {
      ...ErrorCodes.VALIDATION_ERROR,
      details,
    },
    'Validation Error'
  )
}

/**
 * Handle Prisma database errors
 */
export function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): NextResponse<ApiResponse> {
  switch (error.code) {
    case 'P2002':
      return createErrorResponse(
        {
          message: 'A record with this data already exists',
          code: 'DUPLICATE_RECORD',
          status: 409,
          details: { constraint: error.meta?.target },
        },
        'Prisma Unique Constraint Error'
      )
    
    case 'P2025':
      return createErrorResponse(
        ErrorCodes.NOT_FOUND,
        'Prisma Record Not Found'
      )
    
    case 'P2003':
      return createErrorResponse(
        {
          message: 'Foreign key constraint failed',
          code: 'FOREIGN_KEY_ERROR',
          status: 400,
          details: { field: error.meta?.field_name },
        },
        'Prisma Foreign Key Error'
      )
    
    default:
      return createErrorResponse(
        ErrorCodes.DATABASE_ERROR,
        `Prisma Error ${error.code}`
      )
  }
}

/**
 * Handle generic errors with context
 */
export function handleGenericError(error: unknown, context: string = 'Unknown Error'): NextResponse<ApiResponse> {
  // Handle known error types
  if (error instanceof ZodError) {
    return handleValidationError(error)
  }
  
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error)
  }
  
  // Handle standard errors
  if (error instanceof Error) {
    // Don't expose internal error messages to client in production
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    return createErrorResponse(
      {
        message: isDevelopment ? error.message : ErrorCodes.SERVER_ERROR.message,
        code: 'UNKNOWN_ERROR',
        status: 500,
        details: isDevelopment ? { stack: error.stack } : undefined,
      },
      context
    )
  }
  
  // Fallback for unknown error types
  return createErrorResponse(ErrorCodes.SERVER_ERROR, context)
}

/**
 * Wrap API route handlers with error handling
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  context: string
) {
  return async (...args: T): Promise<R | NextResponse<ApiResponse>> => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleGenericError(error, context)
    }
  }
}

/**
 * Custom error class for business logic errors
 */
export class AppError extends Error {
  public readonly code: string
  public readonly status: number
  public readonly details?: any

  constructor(errorDetails: ErrorDetails) {
    super(errorDetails.message)
    this.name = 'AppError'
    this.code = errorDetails.code
    this.status = errorDetails.status
    this.details = errorDetails.details
  }

  toErrorResponse(context?: string): NextResponse<ApiResponse> {
    return createErrorResponse(
      {
        message: this.message,
        code: this.code,
        status: this.status,
        details: this.details,
      },
      context
    )
  }
}

/**
 * Validate that required environment variables are set
 */
export function validateEnvironment() {
  const required = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ]

  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

/**
 * Safe JSON parsing with error handling
 */
export function safeParse<T = any>(json: string): { data?: T; error?: string } {
  try {
    const data = JSON.parse(json) as T
    return { data }
  } catch (error) {
    return { error: 'Invalid JSON format' }
  }
} 
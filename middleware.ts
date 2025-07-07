import { withAuth } from 'next-auth/middleware'
import { NextRequest, NextResponse } from 'next/server'

export default withAuth(
  function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl
    
    // For API routes, add additional security headers
    if (pathname.startsWith('/api/')) {
      const response = NextResponse.next()
      
      // Add security headers
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-XSS-Protection', '1; mode=block')
      response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
      
      // For sensitive endpoints, add additional CSRF protection
      if (pathname.match(/\/(tasks|projects)\/.*/) && req.method !== 'GET') {
        const origin = req.headers.get('origin')
        const host = req.headers.get('host')
        
        // Verify origin matches host for write operations
        if (origin && host && !origin.endsWith(host)) {
          return NextResponse.json(
            { success: false, error: 'Invalid origin' },
            { status: 403 }
          )
        }
      }
      
      return response
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow access to public routes
        if (pathname === '/' || pathname.startsWith('/api/auth/')) {
          return true
        }
        
        // Require authentication for protected routes
        if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/')) {
          return !!token
        }
        
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/tasks/:path*',
    '/api/projects/:path*',
    '/api/auth/:path*'
  ]
} 
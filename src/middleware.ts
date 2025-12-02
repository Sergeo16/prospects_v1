import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthUser } from './lib/auth'
import { prisma } from './lib/prisma'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect admin routes
  if (pathname.startsWith('/ss91')) {
    // Allow login page
    if (pathname === '/ss91/login' || pathname === '/ss91/change-password') {
      return NextResponse.next()
    }

    const user = await getAuthUser(request)

    if (!user) {
      return NextResponse.redirect(new URL('/ss91/login', request.url))
    }

    // Redirect to change password if required
    if (user.mustChangePassword && pathname !== '/ss91/change-password') {
      return NextResponse.redirect(new URL('/ss91/change-password', request.url))
    }

    // Check maintenance mode (except for settings page)
    if (pathname !== '/ss91/settings') {
      const settings = await prisma.appSettings.findFirst()
      if (settings?.maintenanceMode) {
        // Allow admins to access even in maintenance
        if (user.role !== 'ADMIN') {
          return NextResponse.json(
            { error: 'Application en maintenance' },
            { status: 503 }
          )
        }
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/ss91/:path*'],
}


import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { logger } from '@/lib/utils/logger'

export async function middleware(request: NextRequest) {
  let supabaseResponse: NextResponse
  let user: Awaited<ReturnType<typeof updateSession>>['user']

  try {
    const session = await updateSession(request)
    supabaseResponse = session.supabaseResponse
    user = session.user
  } catch (err) {
    logger.error('middleware', 'updateSession failed', { path: request.nextUrl.pathname, error: err instanceof Error ? err.message : String(err) })
    return NextResponse.next({ request })
  }

  const { pathname } = request.nextUrl

  // Protected routes: redirect unauthenticated users to /login
  if (pathname.startsWith('/admin') || pathname.startsWith('/score')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // If logged-in user visits /login or /register, redirect to home
  if (pathname === '/login' || pathname === '/register') {
    if (user) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Add security headers
  supabaseResponse.headers.set('X-Frame-Options', 'DENY')
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  supabaseResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static assets (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

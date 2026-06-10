import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  const path = request.nextUrl.pathname

  // Protected paths list
  const isProtectedRoute = 
    path.startsWith('/checkout') ||
    path.startsWith('/orders') ||
    path.startsWith('/tracker') ||
    path.startsWith('/perfil') ||
    path.startsWith('/rider') ||
    path.startsWith('/cafeteria') ||
    path.startsWith('/admin')

  // Public auth pages (e.g. /login)
  const isAuthRoute = path.startsWith('/login')

  if (isProtectedRoute && !user) {
    // Redirect to login page and preserve original destination
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('next', path)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthRoute && user) {
    // If logged in, don't allow access to login page - redirect to home
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/'
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

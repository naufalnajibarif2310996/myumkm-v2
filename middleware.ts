import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import * as jose from 'jose'

// List of public paths that don't require authentication
const publicPaths = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/marketplace',
  '/marketplace/[id]',
  '/forum',
  '/forum/[id]',
  '/tentang',
  '/kebijakan-privasi',
  '/syarat-ketentuan',
  '/.well-known/appspecific/com.chrome.devtools.json'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for public paths
  if (publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    return NextResponse.next()
  }

  const token = request.cookies.get('token')?.value
  
  // Redirect to login if no token is found
  if (!token) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('callbackUrl', encodeURI(request.url))
    return NextResponse.redirect(loginUrl)
  }

  try {
    // Verify the JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: 'my-umkm',
      audience: 'user',
    })

    // Add user data to request headers for API routes
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.userId as string)
    requestHeaders.set('x-user-email', payload.email as string)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    console.error('Invalid token:', error)
    
    // Clear invalid token
    const response = NextResponse.redirect(new URL('/auth/login', request.url))
    response.cookies.delete('token')
    
    return response
  }
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

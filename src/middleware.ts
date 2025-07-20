import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Define paths that don't require authentication
const PUBLIC_PATHS = ['/login', '/auth/success'];

// Paths that require authentication but should not redirect to setup
const EXEMPT_FROM_SETUP = ['/setup', '/auth/success', '/api', '/_next'];

export function middleware(request: NextRequest) {
  // Get the path
  const path = request.nextUrl.pathname;
  
  // Check if the path is public
  if (PUBLIC_PATHS.some(publicPath => path.startsWith(publicPath))) {
    return NextResponse.next();
  }
  
  // Check for auth token
  const authToken = request.cookies.get('auth_token')?.value;
  
  // If no auth token and not on public path, redirect to login
  if (!authToken) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }
  
  // If path is exempt from setup check, continue
  if (EXEMPT_FROM_SETUP.some(exemptPath => path.startsWith(exemptPath))) {
    return NextResponse.next();
  }
  
  // Always allow next middleware or route handler to execute
  return NextResponse.next();
}

export const config = {
  // Matcher for paths that should run this middleware
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/|api/upload).*)'
  ],
}; 
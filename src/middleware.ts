import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * NextAuth.js 미들웨어 - 보호된 경로에 대한 인증 확인
 */
export async function middleware(request: NextRequest) {
  // 세션 토큰 확인
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  
  const isAuthenticated = !!token;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  
  // 로그인 페이지에 접근하는 인증된 사용자를 대시보드로 리다이렉트
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // 보호된 경로에 접근하는 미인증 사용자를 로그인 페이지로 리다이렉트
  if (!isAuthenticated && !isAuthPage) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

/**
 * 미들웨어가 적용될 경로 패턴
 */
export const config = {
  matcher: [
    // 인증이 필요한 경로
    '/dashboard/:path*',
    '/documents/:path*',
    '/files/:path*',
    '/settings/:path*',
    
    // 인증 페이지 (리다이렉트 처리용)
    '/login'
  ],
}; 
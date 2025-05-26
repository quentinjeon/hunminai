import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import { compare } from 'bcrypt';
import type { SecurityClearance } from '@/types/auth';
import type { NextAuthOptions } from 'next-auth';

/**
 * NextAuth 설정
 * 애플리케이션 전체에서 일관된 인증 설정을 위해 분리
 * 서버 컴포넌트에서 사용하기 위해 별도 파일로 분리
 */
export const authOptions: NextAuthOptions = {
  // 환경 변수가 로드되지 않으므로 직접 값 설정
  secret: "hcG7ZRF2+zqzON5Hj+VH8Qct0Fe5/PtB9jsINNZs=",
  
  // 디버그 모드 비활성화
  debug: false,
  
  // PrismaAdapter 대신 Credentials 방식만 사용
  providers: [
    CredentialsProvider({
      name: '인증정보',
      credentials: {
        username: { label: '사용자 ID', type: 'text' },
        password: { label: '비밀번호', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }
        
        // 사용자 ID로 사용자 찾기
        try {
          const user = await prisma.user.findUnique({
            where: { username: credentials.username }
          });
          
          // 사용자 또는 비밀번호 검증 실패 시 null 반환
          if (!user || !(await compare(credentials.password, user.password))) {
            return null;
          }
          
          // 인증 성공 시 사용자 정보 반환
          return {
            id: user.id,
            name: user.name || null,
            email: user.email || null,
            username: user.username,
            securityClearance: user.securityClearance as SecurityClearance
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    // JWT에 추가 정보 저장
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.securityClearance = (user as any).securityClearance;
      }
      return token;
    },
    // 세션에 사용자 정보 추가
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.securityClearance = token.securityClearance as SecurityClearance;
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 60, // 30분 세션 유지
  },
  pages: {
    signIn: '/login', // 로그인 페이지 경로
    error: '/login', // 오류 발생 시 리다이렉트 페이지
  }
}; 
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '../generated/prisma';
import { compare } from 'bcrypt';
import type { SecurityClearance } from '@/types/auth';
import type { NextAuthOptions } from 'next-auth';

// PrismaClient 초기화를 위한 전역 타입 선언
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// PrismaClient 싱글톤 인스턴스 생성
export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// 개발 환경에서만 전역 객체에 할당
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// 환경 변수 검증
const secret = process.env.NEXTAUTH_SECRET;
if (!secret || secret.length < 32) {
  throw new Error('NEXTAUTH_SECRET must be at least 32 characters long');
}

/**
 * NextAuth 설정
 * 애플리케이션 전체에서 사용할 인증 설정을 위해 분리
 * 서버 컴포넌트에서 사용하기 위해 별도 파일로 분리
 */
export const authOptions: NextAuthOptions = {
  secret,
  
  // 디버그 모드 활성화
  debug: process.env.NODE_ENV === 'development',
  
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
          console.log('인증 실패: 자격 증명 누락');
          throw new Error('사용자 ID와 비밀번호를 입력해주세요.');
        }
        
        // 사용자 ID로 사용자 찾기
        try {
          console.log('=== 인증 시도 시작 ===');
          console.log('입력된 사용자 정보:', {
            username: credentials.username,
            passwordLength: credentials.password.length
          });
          
          const user = await prisma.user.findUnique({
            where: { username: credentials.username },
            select: {
              id: true,
              username: true,
              password: true,
              name: true,
              email: true,
              securityClearance: true
            }
          });
          
          console.log('데이터베이스 조회 결과:', {
            found: !!user,
            username: user?.username,
            hasPassword: !!user?.password,
            passwordLength: user?.password?.length
          });
          
          if (!user) {
            console.log('인증 실패: 사용자를 찾을 수 없음');
            return null;
          }
          
          // 비밀번호 비교
          try {
            const passwordMatch = await compare(credentials.password, user.password);
            console.log('비밀번호 비교 결과:', { 
              passwordMatch,
              inputLength: credentials.password.length,
              hashedLength: user.password.length
            });
            
            if (!passwordMatch) {
              console.log('인증 실패: 비밀번호 불일치');
              return null;
            }
            
            // 인증 성공 시 사용자 정보 반환
            console.log('인증 성공:', {
              id: user.id,
              username: user.username,
              name: user.name,
              securityClearance: user.securityClearance
            });
            
            return {
              id: user.id,
              name: user.name || null,
              email: user.email || null,
              username: user.username,
              securityClearance: user.securityClearance as SecurityClearance
            };
          } catch (error) {
            console.error('비밀번호 비교 중 오류:', error);
            return null;
          }
        } catch (error) {
          console.error("인증 처리 중 오류:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    // JWT에 추가 정보 포함
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
    error: '/login', // 오류 발생 시 리다이렉트할 페이지
  }
}; 

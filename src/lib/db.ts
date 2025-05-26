/**
 * Node.js 표준 라이브러리 가져오기 (환경 체크용)
 */
import { PrismaClient } from '@/generated/prisma'

/**
 * Prisma Client 초기화
 * 애플리케이션 생명주기 동안 단일 인스턴스를 유지하여 연결 효율성 보장
 * 
 * 참고: https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 */

// prisma 전역 인스턴스 선언 (타입 정의)
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

// 환경에 따른 Prisma 인스턴스 생성 방식
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// 개발 환경이 아닌 경우에만 전역 객체에 할당 (Hot Reload 시 중복 인스턴스 방지)
if (process.env.NODE_ENV !== 'development') {
  globalForPrisma.prisma = prisma
} 
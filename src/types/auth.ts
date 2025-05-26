/**
 * 보안 등급 (문서 등급)
 */
export type SecurityLevel = 'NORMAL' | 'CONFIDENTIAL' | 'SECRET_II' | 'SECRET_I';

/**
 * 보안 인가 등급 (사용자 등급)
 */
export type SecurityClearance = 'NORMAL' | 'CONFIDENTIAL' | 'SECRET_II' | 'SECRET_I';

/**
 * NextAuth 세션 타입 확장
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      securityClearance: SecurityClearance;
    }
  }
  
  interface User {
    id: string;
    securityClearance: SecurityClearance;
  }
}

/**
 * NextAuth JWT 타입 확장
 */
declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    securityClearance: SecurityClearance;
  }
} 
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { SecurityClearance } from '@/types/auth';

/**
 * 인증 관련 유틸리티 훅
 * 로그인 상태 확인, 보안 등급 검증 등의 기능 제공
 */
export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 인증 여부
  const isAuthenticated = status === 'authenticated' && !!session?.user;
  
  // 로그인한 사용자 정보
  const user = session?.user;
  
  // 사용자 보안 등급
  const securityClearance = user?.securityClearance || 'NORMAL';
  
  // 로그아웃 처리
  const logout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };
  
  // 보안 등급 검증 함수
  const hasSecurityClearance = (requiredClearance: SecurityClearance): boolean => {
    const clearanceLevels: Record<SecurityClearance, number> = {
      'NORMAL': 0,
      'CONFIDENTIAL': 1,
      'SECRET_II': 2,
      'SECRET_I': 3
    };
    
    const userLevel = clearanceLevels[securityClearance as SecurityClearance] || 0;
    const requiredLevel = clearanceLevels[requiredClearance] || 0;
    
    return userLevel >= requiredLevel;
  };
  
  return {
    isAuthenticated,
    isLoading: status === 'loading',
    user,
    securityClearance,
    logout,
    hasSecurityClearance
  };
}

/**
 * 인증이 필요한 페이지에서 사용하는 훅
 * 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
 */
export function useRequireAuth(requiredClearance?: SecurityClearance) {
  const { isAuthenticated, isLoading, hasSecurityClearance } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // 로딩 중이 아니고 인증되지 않은 경우 로그인 페이지로 리다이렉트
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
    
    // 보안 등급 요구사항이 있고, 요구 등급을 충족하지 못하는 경우 대시보드로 리다이렉트
    if (!isLoading && isAuthenticated && requiredClearance && !hasSecurityClearance(requiredClearance)) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, requiredClearance, hasSecurityClearance, router]);
  
  return { isAuthenticated, isLoading };
} 
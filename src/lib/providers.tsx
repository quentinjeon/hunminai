'use client'

import { ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// 전역 QueryClient 인스턴스 생성
const queryClient = new QueryClient()

/**
 * 앱에서 사용하는 모든 Provider를 관리하는 컴포넌트
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  )
} 
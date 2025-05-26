'use client';

import { ReactNode, useState } from 'react';
import { useAuth, useRequireAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Shield, ChevronDown, Settings } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { SecurityClearance } from '@/types/auth';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

// 보안 등급별 표시 정보
const SECURITY_BADGES: Record<SecurityClearance, { label: string; color: string }> = {
  'NORMAL': { label: '일반', color: 'bg-gray-200 text-gray-800' },
  'CONFIDENTIAL': { label: '대외비', color: 'bg-blue-100 text-blue-800' },
  'SECRET_II': { label: 'II급비밀', color: 'bg-amber-100 text-amber-800' },
  'SECRET_I': { label: 'I급비밀', color: 'bg-red-100 text-red-800' },
};

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useRequireAuth();
  const { user, logout, securityClearance } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  
  // 사용자 이름의 첫 글자 (아바타 대체 표시용)
  const userInitial = user?.name?.charAt(0) || '사';
  
  // 보안 등급 배지 정보
  const securityBadge = SECURITY_BADGES[securityClearance as SecurityClearance] || SECURITY_BADGES.NORMAL;
  
  // 로딩 중이거나 인증되지 않은 경우 내용을 표시하지 않음
  if (isLoading || !isAuthenticated) {
    return <div className="flex h-screen items-center justify-center">로딩 중...</div>;
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* 헤더 */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* 로고 및 타이틀 */}
          <div className="flex items-center space-x-2">
            <Link href="/dashboard" className="flex items-center">
              <Image src="/images/docenty-logo.svg" alt="훈민 AI 로고" width={32} height={32} className="mr-2" />
              <span className="text-lg font-medium">훈민 AI</span>
            </Link>
          </div>
          
          {/* 사용자 메뉴 */}
          <div className="flex items-center space-x-4">
            {/* 보안 등급 배지 */}
            <div className={`text-xs px-2 py-1 rounded-full ${securityBadge.color} flex items-center`}>
              <Shield className="h-3 w-3 mr-1" />
              {securityBadge.label}
            </div>
            
            {/* User Profile Dropdown - 명시적 open 상태 관리 추가 */}
            <DropdownMenu open={isProfileMenuOpen} onOpenChange={setIsProfileMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center">
                  <Image src="/images/avatar.png" alt="프로필" width={32} height={32} className="rounded-full mr-2" />
                  <span>{user?.name || '사용자'}</span>
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.name || '사용자'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>설정</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setIsProfileMenuOpen(false) // 메뉴 닫기
                  logout()
                }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>로그아웃</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      
      {/* 메인 콘텐츠 */}
      <main className="flex-1 bg-gray-50">
        {children}
      </main>
      
      {/* 푸터 */}
      <footer className="bg-white border-t py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} 국방부 - 훈민 AI 군사 문서 작성 시스템
        </div>
      </footer>
    </div>
  );
} 
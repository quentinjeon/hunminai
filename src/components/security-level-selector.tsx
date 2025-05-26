'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Shield, ShieldAlert, ShieldCheck, ChevronDown } from 'lucide-react'
import { useDocumentStore } from '@/lib/store'

const SECURITY_LEVELS = [
  {
    value: 'NORMAL',
    label: '일반',
    description: '보안 등급 없음',
    icon: Shield,
    color: 'text-gray-700',
    bgColor: 'bg-gray-100'
  },
  {
    value: 'CONFIDENTIAL',
    label: 'III급 비밀',
    description: '대외비 문서',
    icon: Shield,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100'
  },
  {
    value: 'SECRET_II',
    label: 'II급 비밀',
    description: '비밀 문서',
    icon: ShieldAlert,
    color: 'text-orange-700',
    bgColor: 'bg-orange-100'
  },
  {
    value: 'SECRET_I',
    label: 'I급 비밀',
    description: '극비 문서',
    icon: ShieldCheck,
    color: 'text-red-700',
    bgColor: 'bg-red-100'
  }
]

export default function SecurityLevelSelector() {
  const { currentDocument, setSecurityLevel } = useDocumentStore()
  const [mounted, setMounted] = useState(false)

  // 컴포넌트가 마운트된 후에만 렌더링
  useEffect(() => {
    setMounted(true)
  }, [])

  // 현재 보안 등급 객체 찾기
  const currentSecurityLevel = SECURITY_LEVELS.find(
    level => level.value === currentDocument.securityLevel
  ) || SECURITY_LEVELS[0]

  const handleSecurityLevelChange = useCallback((value: string) => {
    setSecurityLevel(value as 'NORMAL' | 'CONFIDENTIAL' | 'SECRET_II' | 'SECRET_I')
  }, [setSecurityLevel])

  // 클라이언트 사이드에서만 렌더링
  if (!mounted) {
    return (
      <Button
        variant="outline"
        className={`${currentSecurityLevel.bgColor} ${currentSecurityLevel.color} border-2`}
        disabled
      >
        <currentSecurityLevel.icon className="mr-2 h-4 w-4" />
        {currentSecurityLevel.label}
        <ChevronDown className="ml-2 h-4 w-4" />
      </Button>
    )
  }

  // 임시로 DropdownMenu 비활성화 - PopperAnchor 무한 루프 해결을 위해
  return (
    <Button
      variant="outline"
      className={`${currentSecurityLevel.bgColor} ${currentSecurityLevel.color} border-2`}
      disabled
    >
      <currentSecurityLevel.icon className="mr-2 h-4 w-4" />
      {currentSecurityLevel.label}
      <ChevronDown className="ml-2 h-4 w-4" />
    </Button>
  )
} 
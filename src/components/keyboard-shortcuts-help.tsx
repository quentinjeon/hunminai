'use client'

import { useState } from 'react'
// 무한 루프 문제로 Dialog 임시 비활성화
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Keyboard } from 'lucide-react'
import { formatShortcut } from '@/lib/keyboard-shortcuts'

interface ShortcutInfo {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  description: string
  category: string
}

const SHORTCUTS: ShortcutInfo[] = [
  // 문서 관리
  {
    key: 's',
    ctrl: true,
    description: '문서 저장',
    category: '문서 관리',
  },
  {
    key: 'l',
    ctrl: true,
    shift: true,
    description: '문서 검증 패널 열기',
    category: '문서 관리',
  },
  
  // AI 검증
  {
    key: 'v',
    ctrl: true,
    shift: true,
    description: '문서 검증 실행',
    category: 'AI 검증',
  },
  {
    key: 'F8',
    description: '다음 오류로 이동',
    category: 'AI 검증',
  },
  {
    key: 'F8',
    shift: true,
    description: '이전 오류로 이동',
    category: 'AI 검증',
  },
  {
    key: 'Escape',
    description: '검증 패널 닫기',
    category: 'AI 검증',
  },
  
  // 탭 네비게이션
  {
    key: '1',
    alt: true,
    description: 'HWP 미리보기 탭',
    category: '탭 네비게이션',
  },
  {
    key: '2',
    alt: true,
    description: '코드 보기 탭',
    category: '탭 네비게이션',
  },
  
  // 서식
  {
    key: 'b',
    ctrl: true,
    description: '볼드체',
    category: '서식',
  },
  {
    key: 'i',
    ctrl: true,
    description: '이탤릭체',
    category: '서식',
  },
  {
    key: 'u',
    ctrl: true,
    description: '밑줄',
    category: '서식',
  },
  {
    key: '1',
    ctrl: true,
    description: '제목 1',
    category: '서식',
  },
  {
    key: '2',
    ctrl: true,
    description: '제목 2',
    category: '서식',
  },
  {
    key: '3',
    ctrl: true,
    description: '제목 3',
    category: '서식',
  },
]

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false)

  // 카테고리별로 단축키 그룹화
  const shortcutsByCategory = SHORTCUTS.reduce<Record<string, ShortcutInfo[]>>(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = []
      }
      acc[shortcut.category].push(shortcut)
      return acc
    },
    {}
  )

  // 카테고리 순서 정의
  const categoryOrder = ['문서 관리', 'AI 검증', '탭 네비게이션', '서식']

  // 무한 루프 문제로 Dialog 대신 간단한 버튼으로 임시 대체
  return (
    <Button variant="ghost" size="icon" title="키보드 단축키 도움말">
      <Keyboard className="h-5 w-5" />
    </Button>
  )
  
  /* 원래 Dialog 코드 - 무한 루프 해결 후 복원
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="키보드 단축키 도움말">
          <Keyboard className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>키보드 단축키</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {categoryOrder.map((category) => {
            const shortcuts = shortcutsByCategory[category]
            if (!shortcuts) return null
            
            return (
              <div key={category}>
                <h3 className="font-semibold mb-3 text-lg border-b pb-1">{category}</h3>
                <div className="space-y-3">
                  {shortcuts.map((shortcut, index) => (
                    <div
                      key={`${shortcut.key}-${shortcut.ctrl}-${shortcut.shift}-${shortcut.alt}-${index}`}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm text-gray-700">{shortcut.description}</span>
                      <kbd className="px-3 py-1 text-sm font-mono font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded-md shadow-sm">
                        {formatShortcut(shortcut)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">💡 사용 팁</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 문서 작성 중에는 <kbd className="px-1 py-0.5 bg-blue-100 rounded">Ctrl+Shift+V</kbd>로 실시간 검증을 실행하세요</li>
              <li>• 오류가 발견되면 <kbd className="px-1 py-0.5 bg-blue-100 rounded">F8</kbd>과 <kbd className="px-1 py-0.5 bg-blue-100 rounded">Shift+F8</kbd>로 빠르게 이동할 수 있습니다</li>
              <li>• <kbd className="px-1 py-0.5 bg-blue-100 rounded">Ctrl+S</kbd>는 입력 필드에서도 작동합니다</li>
              <li>• AI 서비스 연결 상태는 상단 로고 옆 점으로 확인할 수 있습니다</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
  */
} 
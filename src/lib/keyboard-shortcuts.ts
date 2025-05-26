'use client'

import { useEffect, useCallback, useState } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  preventDefault?: boolean
  handler: () => void
  description?: string
}

export interface KeyboardShortcutFormatOptions {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  description?: string
}

/**
 * 키보드 단축키를 등록하는 훅
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // 입력 필드에서는 단축키 비활성화
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        // 저장 단축키(Ctrl+S)는 예외적으로 허용
        if (!(event.ctrlKey && event.key.toLowerCase() === 's')) {
          return
        }
      }

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey
        const altMatch = shortcut.alt ? event.altKey : !event.altKey

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault()
          }
          shortcut.handler()
          return
        }
      }
    },
    [shortcuts]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return shortcuts
}

/**
 * 단축키 표시를 위한 포맷팅 함수
 */
export function formatShortcut(shortcut: KeyboardShortcutFormatOptions): string {
  const parts: string[] = []
  if (shortcut.ctrl) parts.push('Ctrl')
  if (shortcut.shift) parts.push('Shift')
  if (shortcut.alt) parts.push('Alt')
  
  // 특수 키 이름을 보기 좋게 변환
  let keyName = shortcut.key.toUpperCase()
  
  // 특수 키 매핑
  const specialKeys: Record<string, string> = {
    'F8': 'F8',
    'F7': 'F7',
    'ESCAPE': 'Esc',
    'ENTER': 'Enter',
    'SPACE': 'Space',
    'ARROWUP': '↑',
    'ARROWDOWN': '↓',
    'ARROWLEFT': '←',
    'ARROWRIGHT': '→'
  }
  
  keyName = specialKeys[keyName] || keyName
  parts.push(keyName)
  
  return parts.join('+')
}

/**
 * 문서 검증 오류 네비게이션을 위한 훅
 */
export function useValidationNavigation() {
  const [currentErrorIndex, setCurrentErrorIndex] = useState(0)
  const [totalErrors, setTotalErrors] = useState(0)

  const navigateToNextError = useCallback(() => {
    if (totalErrors > 0) {
      setCurrentErrorIndex(prev => (prev + 1) % totalErrors)
      // 실제 구현에서는 에디터의 해당 위치로 스크롤
      const event = new CustomEvent('navigateToError', { 
        detail: { index: (currentErrorIndex + 1) % totalErrors, direction: 'next' } 
      })
      document.dispatchEvent(event)
    }
  }, [currentErrorIndex, totalErrors])

  const navigateToPreviousError = useCallback(() => {
    if (totalErrors > 0) {
      setCurrentErrorIndex(prev => prev === 0 ? totalErrors - 1 : prev - 1)
      // 실제 구현에서는 에디터의 해당 위치로 스크롤
      const event = new CustomEvent('navigateToError', { 
        detail: { index: currentErrorIndex === 0 ? totalErrors - 1 : currentErrorIndex - 1, direction: 'previous' } 
      })
      document.dispatchEvent(event)
    }
  }, [currentErrorIndex, totalErrors])

  const updateErrorCount = useCallback((count: number) => {
    setTotalErrors(count)
    if (count === 0) {
      setCurrentErrorIndex(0)
    }
  }, [])

  return {
    currentErrorIndex,
    totalErrors,
    navigateToNextError,
    navigateToPreviousError,
    updateErrorCount
  }
}

/**
 * AI 검증 관련 키보드 단축키 훅
 */
export function useAIValidationShortcuts(
  onValidate: () => void,
  onNextError: () => void,
  onPreviousError: () => void,
  onDismissPanel: () => void
) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'v',
      ctrl: true,
      shift: true,
      handler: onValidate,
      description: '문서 검증 실행',
    },
    {
      key: 'F8',
      handler: onNextError,
      description: '다음 오류로 이동',
    },
    {
      key: 'F8',
      shift: true,
      handler: onPreviousError,
      description: '이전 오류로 이동',
    },
    {
      key: 'Escape',
      handler: onDismissPanel,
      description: '검증 패널 닫기',
    }
  ]

  return useKeyboardShortcuts(shortcuts)
} 
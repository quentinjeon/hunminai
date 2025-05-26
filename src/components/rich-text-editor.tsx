'use client'

import { useState, useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Underline from '@tiptap/extension-underline'
import Heading from '@tiptap/extension-heading'
import TextStyle from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import Color from '@tiptap/extension-color'
import TextAlign from '@tiptap/extension-text-align'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import DocumentToolbar from './document-toolbar'
import { ValidationHighlight, ValidationIssue } from '@/lib/tiptap-extensions/validation-highlight'
import { useAIWebSocket } from '@/lib/ai-websocket'
import { useToast } from '@/components/ui/use-toast'
import '@/styles/validation-highlight.css'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  className?: string
  onCursorMove?: (line: number, column: number) => void
}

export default function RichTextEditor({ 
  content, 
  onChange, 
  className = '',
  onCursorMove 
}: RichTextEditorProps) {
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([])
  const [currentIssueIndex, setCurrentIssueIndex] = useState(-1)
  const editorRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  
  // AI WebSocket 연결
  const { lastValidation, isConnected } = useAIWebSocket()

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      Underline,
      Heading.configure({
        levels: [1, 2, 3, 4],
      }),
      TextStyle,
      FontFamily,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      BulletList,
      OrderedList,
      ListItem,
      ValidationHighlight.configure({
        issues: validationIssues,
        onIssueClick: (issue: ValidationIssue) => {
          toast({
            title: `${issue.severity.toUpperCase()}: ${issue.type}`,
            description: issue.message,
            variant: issue.severity === 'error' ? 'destructive' : 'default',
          })
        },
      }),
    ],
    content,
    onUpdate({ editor }) {
      onChange(editor.getHTML())
      
      // 커서 위치 업데이트
      if (onCursorMove) {
        const { from } = editor.state.selection
        const pos = editor.state.doc.resolve(from)
        // 문서 시작부터 현재 위치까지의 텍스트를 가져와서 줄 번호 계산
        const textBeforeCursor = editor.state.doc.textBetween(0, from)
        const lines = textBeforeCursor.split('\n')
        const line = lines.length
        const column = lines[lines.length - 1].length + 1
        onCursorMove(line, column)
      }
    },
    onSelectionUpdate({ editor }) {
      // 선택 영역 변경 시에도 커서 위치 업데이트
      if (onCursorMove) {
        const { from } = editor.state.selection
        const pos = editor.state.doc.resolve(from)
        // 문서 시작부터 현재 위치까지의 텍스트를 가져와서 줄 번호 계산
        const textBeforeCursor = editor.state.doc.textBetween(0, from)
        const lines = textBeforeCursor.split('\n')
        const line = lines.length
        const column = lines[lines.length - 1].length + 1
        onCursorMove(line, column)
      }
    },
  })

  // AI 검증 결과 처리 - 의존성 최소화
  useEffect(() => {
    if (lastValidation && editor) {
      const issues: ValidationIssue[] = lastValidation.issues.map(issue => ({
        type: issue.type,
        severity: issue.severity,
        message: issue.message,
        position: {
          start: Math.max(0, issue.position.start),
          end: Math.min(editor.state.doc.content.size, issue.position.end),
        },
      }))
      
      setValidationIssues(issues)
      
      // 에디터에 검증 이슈 설정
      editor.commands.setValidationIssues(issues)
      
      if (issues.length > 0) {
        setCurrentIssueIndex(0)
        toast({
          title: "문서 검증 완료",
          description: `${issues.length}개의 문제가 발견되었습니다.`,
          variant: issues.some(i => i.severity === 'error') ? 'destructive' : 'default',
        })
      } else {
        setCurrentIssueIndex(-1)
        toast({
          title: "문서 검증 완료",
          description: "문제가 발견되지 않았습니다.",
        })
      }
    }
  }, [lastValidation, editor]) // toast 제거 - 매번 새로 생성되어 무한 루프 유발

  // 에디터 내용 변경 시 검증 이슈 업데이트 - 조건부 업데이트로 무한 루프 방지
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  // 오류 네비게이션 이벤트 리스너
  useEffect(() => {
    const handleNavigateToError = (event: CustomEvent) => {
      if (editor && validationIssues.length > 0) {
        const { index, direction } = event.detail
        const issue = validationIssues[index]
        
        if (issue) {
          setCurrentIssueIndex(index)
          
          // 해당 위치로 스크롤 및 포커스
          const { start } = issue.position
          editor.commands.focus()
          editor.commands.setTextSelection(start)
          
          // 현재 오류 하이라이팅
          highlightCurrentError(index)
          
          toast({
            title: `오류 ${index + 1}/${validationIssues.length}`,
            description: issue.message,
            variant: issue.severity === 'error' ? 'destructive' : 'default',
          })
        }
      }
    }

    document.addEventListener('navigateToError', handleNavigateToError as EventListener)
    return () => {
      document.removeEventListener('navigateToError', handleNavigateToError as EventListener)
    }
  }, [editor, validationIssues, toast])

  // 현재 오류 하이라이팅 함수
  const highlightCurrentError = (index: number) => {
    if (!editorRef.current) return
    
    // 기존 current-error 클래스 제거
    const existingHighlights = editorRef.current.querySelectorAll('.validation-highlight.current-error')
    existingHighlights.forEach(el => el.classList.remove('current-error'))
    
    // 새로운 current-error 클래스 추가
    const currentHighlight = editorRef.current.querySelector(`[data-issue-index="${index}"]`)
    if (currentHighlight) {
      currentHighlight.classList.add('current-error')
      
      // 해당 요소로 스크롤
      currentHighlight.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }

  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!editor || validationIssues.length === 0) return
      
      if (event.key === 'F8') {
        event.preventDefault()
        
        if (event.shiftKey) {
          // 이전 오류로 이동
          editor.commands.navigateToPreviousIssue()
        } else {
          // 다음 오류로 이동
          editor.commands.navigateToNextIssue()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [editor, validationIssues])

  if (!editor) {
    return null
  }

  return (
    <div className={`rich-text-editor ${className}`} ref={editorRef}>
      <DocumentToolbar editor={editor} />
      <EditorContent 
        editor={editor} 
        className="border rounded-md p-3 min-h-[300px] bg-white focus-within:ring-1 focus-within:ring-primary focus-within:border-primary" 
      />
      
      {/* 검증 상태 표시 */}
      {validationIssues.length > 0 && (
        <div className="mt-2 text-xs text-gray-600 flex items-center justify-between">
          <span>
            {validationIssues.filter(i => i.severity === 'error').length}개 오류, {' '}
            {validationIssues.filter(i => i.severity === 'warning').length}개 경고, {' '}
            {validationIssues.filter(i => i.severity === 'suggestion').length}개 제안
          </span>
          {currentIssueIndex >= 0 && (
            <span>
              현재: {currentIssueIndex + 1}/{validationIssues.length}
            </span>
          )}
        </div>
      )}
    </div>
  )
} 
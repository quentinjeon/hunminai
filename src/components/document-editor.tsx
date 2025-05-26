"use client"

import { useState, useEffect, useReducer, useCallback, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Check, AlertTriangle, Loader2, BarChart3, Save } from "lucide-react"
import KnowledgeLibrary from "@/components/knowledge-library"
import DocumentPreview from "@/components/document-preview"
import CodeEditor from "@/components/code-editor"
import AIAgent from "@/components/ai-agent"
import FileUploader from "@/components/file-uploader"
import Image from "next/image"
import SecurityLevelSelector from "@/components/security-level-selector"
import { useDocumentStore } from "@/lib/store"
import { useSaveDocument } from "@/lib/document-hooks"
import { useToast } from "@/components/ui/use-toast"
import { useKeyboardShortcuts, useAIValidationShortcuts, useValidationNavigation } from "@/lib/keyboard-shortcuts"
import { KeyboardShortcutsHelp } from "@/components/keyboard-shortcuts-help"
import DocumentValidator from "@/components/document-validator"
import { useAIWebSocket } from "@/lib/ai-websocket"
import ValidationPanel from './validation-panel'
import HwpPreview from './hwp-preview'
import React from "react"

export default function DocumentEditor() {
  const { currentDocument, markAsSaved, isDirty } = useDocumentStore()
  const [activeTab, setActiveTab] = useState("visual")
  const [documentValid, setDocumentValid] = useState(true)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 })
  const [errorCount, setErrorCount] = useState(0)
  const [currentErrorIndex, setCurrentErrorIndex] = useState(0)
  const [isValidationPanelVisible, setIsValidationPanelVisible] = useState(false)
  const [uploadedHwpFile, setUploadedHwpFile] = useState<File | null>(null)
  const [, forceUpdate] = useReducer(x => x + 1, 0)
  
  const { saveDocument, loading: isSaving, error: saveError } = useSaveDocument()
  const { toast } = useToast()

  // AI WebSocket 연결 - 선택적으로 필요한 것만 가져오기
  const aiConnected = useAIWebSocket(state => state.isConnected)
  const analyzeDocument = useAIWebSocket(state => state.analyzeDocument)
  const lastValidation = useAIWebSocket(state => state.lastValidation)
  
  // analyzeDocument를 ref로 저장
  const analyzeDocumentRef = useRef(analyzeDocument)
  useEffect(() => {
    analyzeDocumentRef.current = analyzeDocument
  })

  // 검증 오류 네비게이션
  const {
    currentErrorIndex: validationCurrentErrorIndex,
    totalErrors,
    navigateToNextError,
    navigateToPreviousError,
    updateErrorCount
  } = useValidationNavigation()

  // AI 검증 관련 함수들 - useCallback으로 메모이제이션
  const handleValidateDocument = useCallback(() => {
    if (currentDocument.content && aiConnected) {
      analyzeDocumentRef.current(currentDocument.content, currentDocument.securityLevel || '일반')
      toast({
        title: "문서 검증 시작",
        description: "AI가 문서를 검증하고 있습니다...",
      })
    } else if (!aiConnected) {
      toast({
        title: "연결 오류",
        description: "AI 서비스에 연결되지 않았습니다.",
        variant: "destructive",
      })
    }
  }, [currentDocument.content, currentDocument.securityLevel, aiConnected, toast])

  const handleNextError = useCallback(() => {
    if (totalErrors > 0) {
      navigateToNextError()
      toast({
        title: "오류 네비게이션",
        description: `오류 ${validationCurrentErrorIndex + 2}/${totalErrors}로 이동`,
      })
    }
  }, [totalErrors, navigateToNextError, validationCurrentErrorIndex, toast])

  const handlePreviousError = useCallback(() => {
    if (totalErrors > 0) {
      navigateToPreviousError()
      toast({
        title: "오류 네비게이션", 
        description: `오류 ${validationCurrentErrorIndex}/${totalErrors}로 이동`,
      })
    }
  }, [totalErrors, navigateToPreviousError, validationCurrentErrorIndex, toast])

  const handleDismissValidationPanel = useCallback(() => {
    setIsValidationPanelVisible(false)
  }, [])

  // AI 검증 키보드 단축키 등록
  useAIValidationShortcuts(
    handleValidateDocument,
    handleNextError,
    handlePreviousError,
    handleDismissValidationPanel
  )

  // handleSave 함수를 useCallback으로 메모이제이션
  const handleSave = useCallback(async (isAutoSave = false) => {
    try {
      await saveDocument()
      const now = new Date().toISOString()
      setLastSaved(now)
      
      if (!isAutoSave) {
        toast({
          title: "저장 완료",
          description: "문서가 성공적으로 저장되었습니다.",
        })
      }
    } catch (error) {
      toast({
        title: "저장 실패",
        description: saveError || "문서를 저장하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }, [saveDocument, saveError, toast])

  // 기존 키보드 단축키 설정 - useMemo로 메모이제이션
  const keyboardShortcuts = React.useMemo(() => [
    {
      key: 's',
      ctrl: true,
      handler: () => handleSave(),
      description: '문서 저장',
    },
    {
      key: 'l',
      ctrl: true,
      shift: true,
      handler: () => setIsValidationPanelVisible(true),
      description: '문서 검증 패널 열기',
    },
    // 탭 전환 단축키
    {
      key: '1',
      alt: true,
      handler: () => setActiveTab('visual'),
      description: '비주얼 에디터 탭으로 전환',
    },
    {
      key: '2',
      alt: true,
      handler: () => setActiveTab('hwp-preview'),
      description: 'HWP 미리보기 탭으로 전환',
    },
    {
      key: '3',
      alt: true,
      handler: () => setActiveTab('code'),
      description: '코드 보기 탭으로 전환',
    },
  ], [handleSave])

  useKeyboardShortcuts(keyboardShortcuts)

  // AI 연결은 AIAgent 컴포넌트에서 관리하므로 여기서는 제거

  // 검증 결과 업데이트 - lastValidation이 변경될 때만 실행
  useEffect(() => {
    if (lastValidation) {
      const errorCount = lastValidation.issues.filter(issue => 
        issue.severity === 'error' || issue.severity === 'warning'
      ).length
      updateErrorCount(errorCount)
      setDocumentValid(lastValidation.is_valid)
    }
  }, [lastValidation, updateErrorCount])

  // 자동 저장 효과 - isDirty가 변경될 때만 실행
  useEffect(() => {
    if (isDirty) {
      const autosaveTimer = setTimeout(() => {
        handleSave(true)
      }, 30000) // 30초마다 자동 저장
      
      return () => clearTimeout(autosaveTimer)
    }
  }, [isDirty, handleSave])

  // 마지막 저장 시간 표시 업데이트
  useEffect(() => {
    if (!lastSaved) return
    
    const timer = setInterval(() => {
      forceUpdate()
    }, 30000) // 30초마다 업데이트
    
    return () => clearInterval(timer)
  }, [lastSaved])

  // 마지막 저장 시간 포맷팅 (forceUpdate에 의해 갱신됨)
  const formattedLastSaved = lastSaved 
    ? (() => {
        const savedDate = new Date(lastSaved)
        const now = new Date()
        const diffMs = now.getTime() - savedDate.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        
        if (diffMins < 1) {
          return `${Math.floor(diffMs / 1000)}초 전`
        } else if (diffMins < 60) {
          return `${diffMins}분 전`
        } else {
          return `${Math.floor(diffMins / 60)}시간 전`
        }
      })()
    : "저장되지 않음"

  // 커서 위치 업데이트 함수 (CodeEditor에서 호출)
  const handleCursorMove = useCallback((line: number, column: number) => {
    setCursorPosition({ line, column })
  }, [])

  // 검증 패널 토글
  const toggleValidationPanel = useCallback(() => {
    setIsValidationPanelVisible(prev => !prev)
  }, [])

  // 이슈 클릭 핸들러
  const handleIssueClick = useCallback((issue: any) => {
    if (issue.position) {
      // 에디터에서 해당 위치로 이동
      toast({
        title: "이슈 위치로 이동",
        description: `${issue.position.start}-${issue.position.end} 위치의 "${issue.type}" 이슈`,
      })
    }
  }, [toast])

  // 자동 수정 핸들러
  const handleAutoFix = useCallback((issue: any) => {
    // 실제 구현에서는 에디터 내용을 수정
    toast({
      title: "자동 수정 완료",
      description: `"${issue.type}" 이슈가 자동으로 수정되었습니다.`,
    })
  }, [toast])

  // 이슈 무시 핸들러
  const handleIgnoreIssue = useCallback((issue: any) => {
    toast({
      title: "이슈 무시됨",
      description: `"${issue.type}" 이슈가 목록에서 제거되었습니다.`,
    })
  }, [toast])

  // HWP 파일 업로드 핸들러
  const handleHwpFileUpload = useCallback((file: File) => {
    setUploadedHwpFile(file)
    setActiveTab("hwp-preview")
    toast({
      title: "HWP 파일 업로드됨",
      description: `${file.name} 파일이 업로드되었습니다.`,
    })
  }, [toast])

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* 좌측 패널 (지식 라이브러리 + 파일 업로드) - col 1-2, 240px */}
      <div className="w-[240px] border-r bg-gray-50 flex flex-col">
        <div className="flex-1 overflow-auto">
          <KnowledgeLibrary />
        </div>
        <Separator />
        <div className="p-4">
          <FileUploader onHwpFileUpload={handleHwpFileUpload} />
        </div>
      </div>

      {/* 중앙 에디터 (문서 미리보기 + 코드 탭) - col 3-9, auto */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 툴바 */}
        <div className="bg-white border-b p-2 flex items-center justify-between">
          {/* 문서 제목 및 로고 */}
          <div className="flex items-center">
            <Image src="/images/docenty-logo.svg" alt="훈민 AI 로고" width={24} height={24} className="mr-2" />
            <span className="text-sm font-medium">훈민 AI</span>
            {/* AI 연결 상태 표시 */}
            <div className={`ml-2 w-2 h-2 rounded-full ${aiConnected ? 'bg-green-500' : 'bg-red-500'}`} 
                 title={aiConnected ? 'AI 서비스 연결됨' : 'AI 서비스 연결 끊김'} />
          </div>
          
          {/* 보안 등급 선택기 및 단축키 도움말 */}
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleSave()}
              disabled={isSaving || !isDirty}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                isDirty ? "저장" : "저장됨"
              )}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleValidateDocument}
              disabled={!aiConnected}
              title="Ctrl+Shift+V"
            >
              검증
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={toggleValidationPanel}
            >
              검증 패널
            </Button>
            
            <SecurityLevelSelector />
            <KeyboardShortcutsHelp />
          </div>
        </div>

        {/* 탭 구성 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-2">
            <TabsTrigger value="visual">비주얼 에디터</TabsTrigger>
            <TabsTrigger value="hwp-preview">HWP 미리보기</TabsTrigger>
            <TabsTrigger value="code">코드 보기</TabsTrigger>
          </TabsList>
          <TabsContent value="visual" className="flex-1 p-4 overflow-auto">
            <DocumentPreview />
          </TabsContent>
          <TabsContent value="hwp-preview" className="flex-1 overflow-hidden">
            {uploadedHwpFile ? (
              <HwpPreview file={uploadedHwpFile} className="h-full" />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">HWP 파일이 업로드되지 않았습니다</p>
                  <p className="text-gray-500 text-sm mt-2">좌측 패널에서 HWP 파일을 업로드해주세요</p>
                </div>
              </div>
            )}
          </TabsContent>
          <TabsContent value="code" className="flex-1 p-4 overflow-auto">
            <CodeEditor onCursorMove={handleCursorMove} />
          </TabsContent>
        </Tabs>

        {/* 상태바 */}
        <div className="bg-gray-100 border-t px-4 py-1 text-xs text-gray-600 flex justify-between">
          <div>
            행 {cursorPosition.line}, 열 {cursorPosition.column}
          </div>
          <div>최종 저장: {formattedLastSaved}</div>
          <div className="flex items-center space-x-4">
            {/* 검증 상태 */}
            <div className="flex items-center">
              {documentValid ? (
                <>
                  <Check className="h-4 w-4 text-green-500 mr-1" />
                  <span>검증 완료</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-500 mr-1" />
                  <span>검증 필요</span>
                </>
              )}
            </div>
            
            {/* 오류 네비게이션 */}
            {totalErrors > 0 && (
              <div className="flex items-center space-x-1">
                <span>{validationCurrentErrorIndex + 1}/{totalErrors}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handlePreviousError}
                  title="Shift+F8"
                  className="h-6 px-2"
                >
                  ←
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleNextError}
                  title="F8"
                  className="h-6 px-2"
                >
                  →
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 우측 패널 (AI 에이전트 영역) - col 10-12, 300px */}
      <div className="w-[300px] border-l bg-gray-50 flex flex-col">
        <AIAgent />
      </div>

      {/* ValidationPanel 추가 */}
      <ValidationPanel
        validationResult={lastValidation}
        isVisible={isValidationPanelVisible}
        onClose={() => setIsValidationPanelVisible(false)}
        onIssueClick={handleIssueClick}
        onAutoFix={handleAutoFix}
        onIgnoreIssue={handleIgnoreIssue}
      />
    </div>
  )
}

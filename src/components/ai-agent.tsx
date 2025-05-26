"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Send, Loader2, Wifi, WifiOff, AlertCircle } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"
import { useDocumentStore } from "@/lib/store"
import { useAIWebSocket, ValidationResult, AIMessage, DocumentUpdate } from "@/lib/ai-websocket"
import { flushSync } from "react-dom"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp?: string
  type?: "chat" | "validation"
}

export default function AIAgent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "user",
      content: "작전계획 제목 추천해줘",
    },
    {
      id: "2",
      role: "assistant",
      content:
        '"23-2 분기 작전계획" 또는 "2023년도 2분기 전술 운용 계획"은 어떨까요? 두 제목 모두 명확하고 간결합니다.',
    },
    {
      id: "3",
      role: "assistant",
      content: "AI가 작전 개념도 추가를 제안합니다.",
    },
    {
      id: "4",
      role: "user",
      content: "문서 상단 좌측에 I급비밀 표시 추가해줘",
    },
    {
      id: "5",
      role: "assistant",
      content: '네, JSON 템플릿의 header 섹션에서 securityLevel 필드를 "I급비밀"로 업데이트하겠습니다. 적용할까요?',
    },
  ])

  const [input, setInput] = useState("")
  const [autoRevise, setAutoRevise] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [lastValidation, setLastValidation] = useState<ValidationResult | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const processedMessageCountRef = useRef(0)
  const lastProcessedValidationRef = useRef<string | null>(null)
  const { toast } = useToast()
  const { currentDocument, setContent, setSecurityLevel } = useDocumentStore()
  const documentContent = currentDocument.content

  // WebSocket 연결 관리 - 선택적으로 필요한 것만 가져오기
  const isConnected = useAIWebSocket(state => state.isConnected)
  const isConnecting = useAIWebSocket(state => state.isConnecting)
  const wsMessages = useAIWebSocket(state => state.messages)
  const wsLastValidation = useAIWebSocket(state => state.lastValidation)
  const connect = useAIWebSocket(state => state.connect)
  const disconnect = useAIWebSocket(state => state.disconnect)
  const analyzeDocument = useAIWebSocket(state => state.analyzeDocument)
  const sendWSChatMessage = useAIWebSocket(state => state.sendChatMessage)

  // 연결 함수들을 ref로 저장
  const connectRef = useRef(connect)
  const disconnectRef = useRef(disconnect)
  const analyzeDocumentRef = useRef(analyzeDocument)
  const sendWSChatMessageRef = useRef(sendWSChatMessage)
  
  // 함수 참조 업데이트
  useEffect(() => {
    connectRef.current = connect
    disconnectRef.current = disconnect
    analyzeDocumentRef.current = analyzeDocument
    sendWSChatMessageRef.current = sendWSChatMessage
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // 문서 업데이트 처리 함수
  const handleDocumentUpdate = useCallback((update: DocumentUpdate) => {
    try {
      switch (update.action) {
        case 'replace':
          if (update.content !== undefined) {
            setContent(update.content)
            toast({
              title: "문서 수정됨",
              description: "AI가 문서를 수정했습니다.",
            })
          }
          break
          
        case 'insert':
          if (update.content && update.position?.start !== undefined) {
            const newContent = 
              documentContent.slice(0, update.position.start) + 
              update.content + 
              documentContent.slice(update.position.start)
            setContent(newContent)
            toast({
              title: "텍스트 삽입됨",
              description: "AI가 텍스트를 추가했습니다.",
            })
          }
          break
          
        case 'append':
          if (update.content) {
            setContent(documentContent + update.content)
            toast({
              title: "텍스트 추가됨",
              description: "AI가 문서 끝에 텍스트를 추가했습니다.",
            })
          }
          break
          
        case 'update_style':
          if (update.style?.securityLevel) {
            setSecurityLevel(update.style.securityLevel as any)
            toast({
              title: "보안 등급 변경됨",
              description: `보안 등급이 ${update.style.securityLevel}로 변경되었습니다.`,
            })
          }
          break
      }
    } catch (error) {
      console.error('문서 업데이트 오류:', error)
      toast({
        title: "업데이트 실패",
        description: "문서 업데이트 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }, [documentContent, setContent, setSecurityLevel, toast])

  const handleWebSocketMessage = useCallback((message: AIMessage) => {
    if (message.type === 'chat' && typeof message.result === 'string') {
      const aiResponse: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: message.result,
        timestamp: message.timestamp
      }
      setMessages(prev => [...prev, aiResponse])
      setIsLoading(false)
    } else if (message.type === 'document_update' && message.result) {
      const update = message.result as DocumentUpdate
      handleDocumentUpdate(update)
    } else if (message.type === 'error') {
      toast({
        title: "AI 서비스 오류",
        description: message.message || "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }, [toast, handleDocumentUpdate])

  // 컴포넌트 마운트 시 WebSocket 연결
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      connectRef.current()
    }, 100) // 약간의 지연을 주어 초기화 완료 대기
    
    return () => {
      clearTimeout(timeoutId)
      disconnectRef.current()
    }
  }, []) // 빈 의존성 배열 - 마운트/언마운트 시에만 실행

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (input.trim() === "" || isLoading || !isConnected) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      sendWSChatMessageRef.current(input, documentContent, messages)
    } catch (error) {
      console.error("메시지 전송 오류:", error)
      toast({
        title: "오류 발생",
        description: "메시지 전송 중 오류가 발생했습니다.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }
  
  // 수동 문서 검증 트리거
  const triggerValidation = useCallback(() => {
    if (documentContent && isConnected && !isLoading) {
      analyzeDocumentRef.current(documentContent, currentDocument.securityLevel || '일반')
    } else if (!isConnected) {
      toast({
        title: "연결 오류",
        description: "AI 서비스에 연결되지 않았습니다.",
        variant: "destructive",
      })
    }
  }, [documentContent, isConnected, isLoading, currentDocument.securityLevel, toast])

  // WebSocket 메시지 처리 - 안정적인 버전
  useEffect(() => {
    if (wsMessages.length > processedMessageCountRef.current) {
      const unprocessedMessages = wsMessages.slice(processedMessageCountRef.current)
      
      // 배치 처리로 성능 최적화
      requestAnimationFrame(() => {
        unprocessedMessages.forEach(message => {
          handleWebSocketMessage(message)
        })
        processedMessageCountRef.current = wsMessages.length
      })
    }
  }, [wsMessages.length, handleWebSocketMessage]) // handleWebSocketMessage 의존성 추가

  // WebSocket 검증 결과 처리 - 최적화된 버전
  useEffect(() => {
    if (!wsLastValidation) return
    
    const validationTimestamp = wsLastValidation.timestamp
    
    if (validationTimestamp !== lastProcessedValidationRef.current) {
      lastProcessedValidationRef.current = validationTimestamp
      
      // requestAnimationFrame으로 렌더링 최적화
      requestAnimationFrame(() => {
        setLastValidation(wsLastValidation)
        
        // formatValidationResult를 인라인으로 유지
        const formatResult = (result: ValidationResult) => {
          const totalIssues = result.issues.length
          const errors = result.issues.filter(i => i.severity === 'error').length
          const warnings = result.issues.filter(i => i.severity === 'warning').length
          const suggestions = result.issues.filter(i => i.severity === 'suggestion').length
          
          let message = `📋 문서 검증이 완료되었습니다.\n\n`
          message += `✅ 전체 점수: ${result.compliance_score}/100\n`
          message += `📊 발견된 이슈: ${totalIssues}개\n`
          
          if (errors > 0) message += `   - ❌ 오류: ${errors}개\n`
          if (warnings > 0) message += `   - ⚠️ 경고: ${warnings}개\n`
          if (suggestions > 0) message += `   - 💡 제안: ${suggestions}개\n`
          
          if (totalIssues > 0) {
            message += `\n주요 이슈:\n`
            result.issues.slice(0, 3).forEach((issue, index) => {
              const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : '💡'
              message += `${index + 1}. ${icon} ${issue.message}\n`
            })
            
            if (totalIssues > 3) {
              message += `\n... 그 외 ${totalIssues - 3}개의 이슈가 더 있습니다.`
            }
          } else {
            message += `\n🎉 문서에 문제가 없습니다!`
          }
          
          return message
        }
        
        const validationMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: formatResult(wsLastValidation),
          type: "validation",
          timestamp: wsLastValidation.timestamp
        }
        
        setMessages(prev => [...prev, validationMessage])
      })
    }
  }, [wsLastValidation?.timestamp]) // timestamp만 체크

  // 자동 수정 활성화 시 문서 분석 - 수동으로 처리
  // 무한 루프 방지를 위해 제거

  // 문서 변경 적용
  const applyChanges = () => {
    // 실제 구현 시 문서 내용을 수정하는 로직 추가
    toast({
      title: "변경 적용",
      description: "AI 제안 사항이 문서에 적용되었습니다.",
    })
  }

  // 문서 변경 미리보기
  const previewChanges = () => {
    // 실제 구현 시 변경 사항 미리보기 로직 추가
    toast({
      title: "변경 미리보기",
      description: "AI 제안 사항 미리보기가 준비되었습니다.",
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* 시스템 카드 */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Image src="/images/docenty-logo.svg" alt="Docenty.ai 로고" width={24} height={24} className="mr-2" />
            <h2 className="font-semibold">훈민 AI</h2>
          </div>
          
          {/* 연결 상태 표시 */}
          <div className="flex items-center space-x-1">
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
            ) : isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-xs text-gray-500">
              {isConnecting ? '연결 중...' : isConnected ? '연결됨' : '연결 끊김'}
            </span>
          </div>
        </div>
        
        <Card className="p-3 bg-gray-100">
          <h3 className="text-xs font-medium mb-1">스타일.yml:</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <div>글꼴: 맑은 고딕</div>
            <div>글자크기: 12pt</div>
            <div>줄간격: 1.5</div>
            <div>기본보안등급: II급비밀</div>
            <div>머리글:</div>
            <div className="pl-2">보안표시위치: 좌측상단</div>
          </div>
        </Card>

        {/* 검증 결과 요약 */}
        {lastValidation && (
          <Card className="p-3 mt-2 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium">최근 검증 결과</h3>
              <Button variant="ghost" size="sm" onClick={triggerValidation} disabled={!isConnected}>
                <AlertCircle className="h-3 w-3 mr-1" />
                재검증
              </Button>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              <div>준수율: {lastValidation.compliance_score.toFixed(1)}%</div>
              <div>문제점: {lastValidation.issues.length}개</div>
              <div>제안사항: {lastValidation.suggestions.length}개</div>
            </div>
          </Card>
        )}
      </div>

      {/* 대화 인터페이스 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === "user" 
                  ? "bg-gray-200 text-gray-800" 
                  : message.type === "validation"
                    ? "bg-green-500 text-white"
                    : "bg-blue-500 text-white"
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              {message.timestamp && (
                <div className="text-xs opacity-70 mt-1" suppressHydrationWarning>
                  {typeof window !== 'undefined' ? new Date(message.timestamp).toLocaleTimeString() : ''}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 프롬프트 입력창 */}
      <div className="p-4 border-t">
        <div className="flex items-center space-x-2 mb-4">
          <Button variant="default" size="sm" onClick={applyChanges}>
            적용
          </Button>
          <Button variant="outline" size="sm" onClick={previewChanges}>
            미리보기
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={triggerValidation}
            disabled={!isConnected || isLoading}
          >
            {isLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <AlertCircle className="h-3 w-3 mr-1" />}
            검증
          </Button>
          <div className="flex items-center space-x-2 ml-auto">
            <Button
              variant={autoRevise ? "default" : "outline"}
              size="sm"
              onClick={() => {
                const newAutoRevise = !autoRevise
                setAutoRevise(newAutoRevise)
                
                // 자동 수정 활성화 시 즉시 한 번 분석
                if (newAutoRevise && isConnected && documentContent && !isLoading) {
                  analyzeDocumentRef.current(documentContent, currentDocument.securityLevel || '일반')
                }
              }}
              disabled={!isConnected}
            >
              AI 자동수정 {autoRevise ? "ON" : "OFF"}
            </Button>
          </div>
        </div>

        <div className="flex space-x-2">
          <Textarea
            placeholder={isConnected ? "예: 머리글에 I급 비밀 표기 추가해줘" : "AI 서비스에 연결 중..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[60px]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            disabled={isLoading || !isConnected}
          />
          <Button 
            size="icon" 
            onClick={handleSendMessage} 
            disabled={input.trim() === "" || isLoading || !isConnected}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* 푸터 */}
      <div className="p-2 text-center border-t">
        <p className="text-xs text-gray-500">Docenty 훈민 AI. 모든 권리 보유.</p>
      </div>
    </div>
  )
}

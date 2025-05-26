"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { validateDocument, ValidationResponse } from "@/lib/ai-service"
import { useDocumentStore } from "@/lib/store"

export default function DocumentValidator() {
  const [isValidating, setIsValidating] = useState(false)
  const [result, setResult] = useState<ValidationResponse | null>(null)
  const { currentDocument } = useDocumentStore()
  const { toast } = useToast()

  const handleValidate = async () => {
    if (isValidating) return
    
    const content = currentDocument.content
    
    if (!content || content.trim() === "") {
      toast({
        title: "문서 내용 없음",
        description: "검증할 문서 내용이 없습니다.",
        variant: "destructive",
      })
      return
    }
    
    setIsValidating(true)
    
    try {
      const response = await validateDocument(content)
      
      if (response.error) {
        toast({
          title: "검증 오류",
          description: response.error,
          variant: "destructive",
        })
        return
      }
      
      setResult(response.data || null)
    } catch (error) {
      console.error("문서 검증 오류:", error)
      toast({
        title: "오류 발생",
        description: "문서 검증 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsValidating(false)
    }
  }
  
  // 심각도에 따른 아이콘 반환
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }
  
  // 심각도에 따른 색상 클래스 반환
  const getSeverityColorClass = (severity: string) => {
    switch (severity) {
      case "error":
        return "border-red-500"
      case "warning":
        return "border-amber-500"
      case "info":
        return "border-blue-500"
      default:
        return "border-gray-300"
    }
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">문서 검증</h2>
        <Button 
          onClick={handleValidate} 
          disabled={isValidating}
          size="sm"
        >
          {isValidating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              검증 중...
            </>
          ) : (
            "문서 검증"
          )}
        </Button>
      </div>
      
      {result && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              {result.valid ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span>검증 완료</span>
                  <Badge className="ml-2 bg-green-500">통과</Badge>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                  <span>검증 완료</span>
                  <Badge className="ml-2 bg-amber-500">이슈 발견</Badge>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 이슈 목록 */}
            {result.issues.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">발견된 이슈 ({result.issues.length})</h3>
                <ul className="space-y-2">
                  {result.issues.map((issue, index) => (
                    <li 
                      key={index} 
                      className={`text-sm border-l-2 pl-3 py-1.5 ${getSeverityColorClass(issue.severity)}`}
                    >
                      <div className="flex items-start">
                        {getSeverityIcon(issue.severity)}
                        <span className="ml-2">{issue.message}</span>
                      </div>
                      {issue.position && (
                        <span className="text-xs text-gray-500 mt-1 block">
                          위치: {issue.position.line}행, {issue.position.column}열
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* 제안 목록 */}
            {result.suggestions.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">개선 제안 ({result.suggestions.length})</h3>
                <ul className="space-y-1.5">
                  {result.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm flex items-start">
                      <span className="text-xs bg-gray-200 rounded-full h-5 w-5 flex items-center justify-center mr-2 mt-0.5">
                        {index + 1}
                      </span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 
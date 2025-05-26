'use client'

import { useEffect, useState } from 'react'
import { X, AlertTriangle, AlertCircle, Info, Lightbulb, Zap, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import type { ValidationResult, ValidationIssue } from '@/lib/ai-websocket'

interface ValidationPanelProps {
  validationResult: ValidationResult | null
  isVisible: boolean
  onClose: () => void
  onIssueClick?: (issue: ValidationIssue) => void
  onAutoFix?: (issue: ValidationIssue) => void
  onIgnoreIssue?: (issue: ValidationIssue) => void
}

export default function ValidationPanel({
  validationResult,
  isVisible,
  onClose,
  onIssueClick,
  onAutoFix,
  onIgnoreIssue
}: ValidationPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'error' | 'warning' | 'suggestion'>('all')

  if (!isVisible) return null

  const getIssueIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'suggestion':
        return <Lightbulb className="h-4 w-4 text-blue-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'suggestion':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const filteredIssues = validationResult?.issues.filter(issue => 
    selectedCategory === 'all' || issue.severity === selectedCategory
  ) || []

  const errorCount = validationResult?.issues.filter(i => i.severity === 'error').length || 0
  const warningCount = validationResult?.issues.filter(i => i.severity === 'warning').length || 0
  const suggestionCount = validationResult?.issues.filter(i => i.severity === 'suggestion').length || 0

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-lg border-l z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">문서 검증 결과</h2>
          {validationResult && (
            <p className="text-sm text-gray-600 mt-1">
              준수율: {validationResult.compliance_score.toFixed(1)}%
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="p-4 border-b flex gap-2">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          전체 ({validationResult?.issues.length || 0})
        </Button>
        <Button
          variant={selectedCategory === 'error' ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('error')}
        >
          오류 ({errorCount})
        </Button>
        <Button
          variant={selectedCategory === 'warning' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('warning')}
          className={selectedCategory === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
        >
          경고 ({warningCount})
        </Button>
        <Button
          variant={selectedCategory === 'suggestion' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('suggestion')}
          className={selectedCategory === 'suggestion' ? 'bg-blue-500 hover:bg-blue-600' : ''}
        >
          제안 ({suggestionCount})
        </Button>
      </div>

      {/* Issues List */}
      <ScrollArea className="flex-1 p-4">
        {filteredIssues.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            {selectedCategory === 'all' 
              ? '검증 이슈가 없습니다.' 
              : `${selectedCategory === 'error' ? '오류' : selectedCategory === 'warning' ? '경고' : '제안'} 항목이 없습니다.`}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredIssues.map((issue, index) => (
              <Card 
                key={index} 
                className={`p-3 cursor-pointer hover:shadow-md transition-shadow border ${getSeverityColor(issue.severity)}`}
                onClick={() => onIssueClick?.(issue)}
              >
                <div className="flex items-start gap-2">
                  {getIssueIcon(issue.severity)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{issue.type}</p>
                    <p className="text-sm mt-1">{issue.message}</p>
                    {issue.position && (
                      <p className="text-xs text-gray-500 mt-1">
                        위치: {issue.position.start} - {issue.position.end}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  {onAutoFix && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onAutoFix(issue)
                      }}
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      자동 수정
                    </Button>
                  )}
                  {onIgnoreIssue && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onIgnoreIssue(issue)
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      무시
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Suggestions Section */}
      {validationResult && validationResult.suggestions.length > 0 && (
        <div className="p-4 border-t bg-blue-50">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">AI 추천 사항</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            {validationResult.suggestions.slice(0, 3).map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
} 
"use client"

import { useState } from "react"
import { Card } from '@/components/ui/card'
import { useDocumentStore } from '@/lib/store'
import RichTextEditor from './rich-text-editor'

interface CodeEditorProps {
  onCursorMove?: (line: number, column: number) => void
}

export default function CodeEditor({ onCursorMove }: CodeEditorProps) {
  const { currentDocument, setContent } = useDocumentStore()
  const [localContent, setLocalContent] = useState(currentDocument.content)

  const handleChange = (newContent: string) => {
    setLocalContent(newContent)
    setContent(newContent)
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-2">문서 코드 편집</h3>
        <RichTextEditor
          content={localContent}
          onChange={handleChange}
          onCursorMove={onCursorMove}
          className="w-full"
        />
      </Card>
      
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-2">미리보기 (HTML)</h3>
        <div className="bg-gray-50 p-3 rounded text-xs font-mono overflow-auto max-h-40">
          {localContent}
        </div>
      </Card>
    </div>
  )
}

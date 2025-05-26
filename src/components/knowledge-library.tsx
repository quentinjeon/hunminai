"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  ChevronRight, 
  ChevronDown, 
  FolderClosed, 
  FileText,
  Filter,
  Eye,
  Loader2
} from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useKnowledgeLibrary } from "@/hooks/use-knowledge-library"
import { KnowledgeDocument } from "@/lib/api"
import React from "react"

// 보안 등급별 색상 설정
const SECURITY_COLORS = {
  'NORMAL': 'bg-gray-100 text-gray-600',
  'CONFIDENTIAL': 'bg-blue-100 text-blue-600',
  'SECRET_II': 'bg-amber-100 text-amber-600',
  'SECRET_I': 'bg-red-100 text-red-600',
};

type DocumentItem = {
  id: string
  name: string
  type: "file" | "folder"
  security?: string
  tags?: string[]
  expanded?: boolean
  children?: DocumentItem[]
  data?: KnowledgeDocument
}

// 트리 행 컴포넌트를 분리하여 React.memo로 최적화
const TreeRow = React.memo(({ 
  item, 
  level, 
  onToggleFolder, 
  onViewDocument, 
  onDocumentDrag 
}: {
  item: DocumentItem
  level: number
  onToggleFolder: (id: string) => void
  onViewDocument: (item: DocumentItem) => void
  onDocumentDrag: (document: KnowledgeDocument, event: React.DragEvent) => void
}) => {
  const handleClick = useCallback(() => {
    if (item.type === "folder") {
      onToggleFolder(item.id)
    } else {
      onViewDocument(item)
    }
  }, [item.type, item.id, onToggleFolder, onViewDocument])

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (item.type === "file" && item.data) {
      onDocumentDrag(item.data, e)
    }
  }, [item.type, item.data, onDocumentDrag])

  const handleViewClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onViewDocument(item)
  }, [item, onViewDocument])

  return (
    <div
      className={`flex items-center py-1 px-2 hover:bg-accent rounded-sm cursor-pointer group`}
      style={{ paddingLeft: `${level * 16 + 8}px` }}
      onClick={handleClick}
      onContextMenu={(e) => {
        e.preventDefault()
        // TODO: 상위 컴포넌트로 우클릭 이벤트 및 item 정보 전달
      }}
      draggable={item.type === "file"}
      onDragStart={handleDragStart}
    >
      {item.type === "folder" ? (
        <>
          {item.expanded ? (
            <ChevronDown className="h-4 w-4 mr-1 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 mr-1 text-muted-foreground" />
          )}
          <FolderClosed className="h-4 w-4 mr-1 text-blue-500" />
        </>
      ) : (
        <>
          <FileText className="h-4 w-4 mr-1 ml-5 text-gray-500" />
          {item.security && (
            <span 
              className={cn(
                "ml-1 w-2 h-2 rounded-full",
                item.security === 'NORMAL' ? "bg-gray-400" : 
                item.security === 'CONFIDENTIAL' ? "bg-blue-500" : 
                item.security === 'SECRET_II' ? "bg-amber-500" : 
                "bg-red-500"
              )}
            />
          )}
        </>
      )}
      <span className="text-sm truncate ml-2">{item.name}</span>
      {item.type === "file" && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 ml-auto opacity-0 group-hover:opacity-100"
          onClick={handleViewClick}
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
})

TreeRow.displayName = 'TreeRow'

export default function KnowledgeLibrary() {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [securityFilter, setSecurityFilter] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['root'])
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { toast } = useToast()
  
  // 지식 라이브러리 훅 사용
  const {
    isAuthenticated,
    isAuthLoading,
    documents,
    categories,
    tags,
    isLoading,
    isError,
    searchParams,
    updateSearchParams,
    handleDocumentDrag,
    getSecurityInfo
  } = useKnowledgeLibrary()

  // 디바운스된 검색 처리 (개선된 버전) - useMemo로 안정적인 함수 생성
  const handleSearchChange = useMemo(() => {
    return (value: string) => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
      }
      searchDebounceRef.current = setTimeout(() => {
        updateSearchParams({ query: value })
      }, 300)
    }
  }, [updateSearchParams])

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
      }
    }
  }, [])

  // API 데이터로 트리 구조 생성 (메모이제이션)
  const treeData = useMemo(() => {
    if (!documents.length) {
      return []
    }

    // 카테고리로 문서 그룹화
    const categoriesMap: Record<string, KnowledgeDocument[]> = {}
    
    // 우선 모든 카테고리 추가 (빈 배열로)
    categories.forEach(category => {
      categoriesMap[category] = []
    })
    
    // 문서를 각 카테고리에 할당
    documents.forEach(doc => {
      if (!categoriesMap[doc.category]) {
        categoriesMap[doc.category] = []
      }
      categoriesMap[doc.category].push(doc)
    })
    
    // 트리 데이터 생성
    const rootItem: DocumentItem = {
      id: "root",
      name: "전체 문서",
      type: "folder",
      expanded: expandedFolders.includes("root"),
      children: []
    }
    
    // 각 카테고리를 폴더로 변환
    Object.entries(categoriesMap).forEach(([category, docs]) => {
      // 문서가 있는 카테고리만 포함
      if (docs.length === 0) return
      
      const categoryId = `category-${category}`
      const categoryItem: DocumentItem = {
        id: categoryId,
        name: category,
        type: "folder",
        expanded: expandedFolders.includes(categoryId),
        children: []
      }
      
      // 해당 카테고리의 문서들을 파일로 변환
      docs.forEach(doc => {
        categoryItem.children?.push({
          id: doc.id,
          name: doc.title,
          type: "file",
          security: doc.security,
          tags: doc.tags,
          data: doc
        })
      })
      
      rootItem.children?.push(categoryItem)
    })
    
    return [rootItem]
  }, [documents, categories, expandedFolders])

  // 안정적인 콜백 함수들
  const toggleFolder = useCallback((id: string) => {
    setExpandedFolders(prev => {
      if (prev.includes(id)) {
        return prev.filter(folderId => folderId !== id)
      } else {
        return [...prev, id]
      }
    })
  }, [])

  const toggleTag = useCallback((tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
      if (searchParams.tag === tag) {
        updateSearchParams({ tag: undefined })
      }
    } else {
      setSelectedTags([...selectedTags, tag])
      updateSearchParams({ tag })
    }
  }, [selectedTags, searchParams.tag, updateSearchParams])

  const toggleSecurityFilter = useCallback((security: string) => {
    if (securityFilter === security) {
      setSecurityFilter(null)
    } else {
      setSecurityFilter(security)
      // 실제 구현에서는 API에 보안 등급 필터 추가 필요
    }
  }, [securityFilter])

  const viewDocument = useCallback((item: DocumentItem) => {
    if (item.data) {
      toast({
        title: "문서 미리보기",
        description: `'${item.name}' 문서를 미리봅니다.`,
      })
      // 실제 구현에서는 문서 미리보기 모달 표시
    }
  }, [toast])

  const renderDocumentTree = useCallback((items: DocumentItem[], level = 0): React.ReactNode => {
    return items.map((item) => (
      <div key={`${item.id}-${level}`}>
        <TreeRow
          item={item}
          level={level}
          onToggleFolder={toggleFolder}
          onViewDocument={viewDocument}
          onDocumentDrag={handleDocumentDrag}
        />
        {item.children && item.expanded && renderDocumentTree(item.children, level + 1)}
      </div>
    ))
  }, [toggleFolder, viewDocument, handleDocumentDrag])

  return (
    <div className="p-4 h-full flex flex-col overflow-hidden">
      <div className="flex items-center mb-4">
        <Image src="/images/docenty-logo.svg" alt="훈민 AI 로고" width={20} height={20} className="mr-2" />
        <h2 className="font-semibold">지식 라이브러리</h2>
      </div>
      <div className="relative mb-2">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="문서 검색..."
          className="pl-8 pr-8"
          onChange={(e) => {
            handleSearchChange(e.target.value)
          }}
        />
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-1 top-1"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
          <Filter className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      {isFilterOpen && (
        <div className="mb-4 border rounded-md p-2 bg-muted/50">
          <div className="mb-2">
            <h3 className="text-xs font-medium mb-1">태그 필터</h3>
            <div className="flex flex-wrap gap-1">
              {tags.map(tag => (
                <Badge 
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"} 
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
              {tags.length === 0 && (
                <span className="text-xs text-muted-foreground">사용 가능한 태그가 없습니다</span>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-xs font-medium mb-1">보안 등급 필터</h3>
            <div className="flex flex-wrap gap-1">
              {['NORMAL', 'CONFIDENTIAL', 'SECRET_II', 'SECRET_I'].map(security => (
                <Badge 
                  key={security}
                  variant={securityFilter === security ? "default" : "outline"} 
                  className={cn(
                    "cursor-pointer",
                    securityFilter === security && SECURITY_COLORS[security as keyof typeof SECURITY_COLORS]
                  )}
                  onClick={() => toggleSecurityFilter(security)}
                >
                  {security === 'NORMAL' ? '일반' : 
                   security === 'CONFIDENTIAL' ? '대외비' : 
                   security === 'SECRET_II' ? 'II급비밀' : 'I급비밀'}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto border rounded-md">
        {isAuthLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">인증 확인 중...</span>
          </div>
        ) : !isAuthenticated ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4 text-center">
            로그인이 필요합니다.<br />
            지식 라이브러리를 사용하려면 먼저 로그인해주세요.
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4 text-center">
            문서를 불러오는 중 오류가 발생했습니다.<br />
            다시 시도해주세요.
          </div>
        ) : treeData.length > 0 ? (
          renderDocumentTree(treeData)
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            검색 결과가 없습니다
          </div>
        )}
      </div>
      
      <div className="mt-2 text-xs text-muted-foreground">
        <p>드래그 하여 문서를 에디터에 삽입할 수 있습니다.</p>
      </div>
    </div>
  )
}

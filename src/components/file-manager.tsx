"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  FileText, 
  FileImage, 
  FileAudio, 
  Download, 
  Trash2, 
  Search,
  Loader2
} from "lucide-react"
import { formatBytes } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

interface FileItem {
  id: string
  name: string
  mimeType: string
  size: number
  url: string
  uploadedAt: string
}

interface FileManagerProps {
  refreshTrigger?: number
}

export default function FileManager({ refreshTrigger = 0 }: FileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  // 파일 목록 가져오기
  const fetchFiles = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/files?page=${page}&search=${searchQuery}`)
      
      if (!response.ok) {
        throw new Error("파일 목록을 불러올 수 없습니다")
      }

      const data = await response.json()
      setFiles(data.files)
      setTotalPages(data.pagination.totalPages)
    } catch (error) {
      console.error("파일 목록 조회 오류:", error)
      toast({
        title: "오류",
        description: "파일 목록을 불러오는데 실패했습니다",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [page, searchQuery, refreshTrigger])

  // 파일 다운로드
  const handleDownload = async (file: FileItem) => {
    try {
      const response = await fetch(`/api/files/${file.id}/download`)
      
      if (!response.ok) {
        throw new Error("다운로드 URL을 가져올 수 없습니다")
      }

      const data = await response.json()
      
      // 새 탭에서 다운로드
      const link = document.createElement("a")
      link.href = data.url
      link.download = file.name
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "다운로드 시작",
        description: `${file.name} 다운로드를 시작합니다`,
      })
    } catch (error) {
      console.error("다운로드 오류:", error)
      toast({
        title: "오류",
        description: "파일 다운로드에 실패했습니다",
        variant: "destructive",
      })
    }
  }

  // 파일 삭제
  const handleDelete = async (file: FileItem) => {
    if (!confirm(`${file.name} 파일을 삭제하시겠습니까?`)) {
      return
    }

    try {
      const response = await fetch(`/api/files/${file.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("파일 삭제에 실패했습니다")
      }

      toast({
        title: "삭제 완료",
        description: `${file.name} 파일이 삭제되었습니다`,
      })

      // 목록 새로고침
      fetchFiles()
    } catch (error) {
      console.error("삭제 오류:", error)
      toast({
        title: "오류",
        description: "파일 삭제에 실패했습니다",
        variant: "destructive",
      })
    }
  }

  // 파일 아이콘 선택
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <FileImage className="h-4 w-4 text-blue-500" />
    } else if (mimeType.startsWith("audio/")) {
      return <FileAudio className="h-4 w-4 text-green-500" />
    } else {
      return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="파일 검색..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchQuery ? "검색 결과가 없습니다" : "업로드된 파일이 없습니다"}
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>파일명</TableHead>
                <TableHead>크기</TableHead>
                <TableHead>업로드 날짜</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getFileIcon(file.mimeType)}
                      <span className="truncate max-w-[300px]">{file.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatBytes(file.size)}</TableCell>
                  <TableCell>
                    {new Date(file.uploadedAt).toLocaleDateString("ko-KR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(file)}
                        title="다운로드"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(file)}
                        title="삭제"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                이전
              </Button>
              <span className="text-sm">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                다음
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
} 
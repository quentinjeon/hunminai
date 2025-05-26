"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Progress } from "@/components/ui/progress"
import { Upload, Check, AlertTriangle, FileText, FileImage, FileAudio, X } from "lucide-react"
import { isValidHWPFile } from "@/lib/hwp"

type UploadStatus = "idle" | "uploading" | "success" | "error"

type UploadFile = {
  id: string
  name: string
  progress: number
  status: UploadStatus
  error?: string
}

interface FileUploaderProps {
  onHwpFileUpload?: (file: File) => void
}

export default function FileUploader({ onHwpFileUpload }: FileUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File, id: string) => {
    const formData = new FormData()
    formData.append("file", file)
    
    const xhr = new XMLHttpRequest()
    xhr.open("POST", "/api/upload")
    
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100)
        setFiles((prev) => 
          prev.map((f) => (f.id === id ? { ...f, progress } : f))
        )
      }
    }
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setFiles((prev) => 
          prev.map((f) => (f.id === id ? { ...f, status: "success", progress: 100 } : f))
        )
      } else {
        let errorMessage = "업로드 실패"
        try {
          const response = JSON.parse(xhr.responseText)
          if (response.error) {
            errorMessage = response.error
          }
        } catch (e) {
          // 파싱 오류 무시
        }
        
        setFiles((prev) => 
          prev.map((f) => (f.id === id ? { ...f, status: "error", error: errorMessage } : f))
        )
      }
    }
    
    xhr.onerror = () => {
      setFiles((prev) => 
        prev.map((f) => (f.id === id ? { ...f, status: "error", error: "네트워크 오류" } : f))
      )
    }
    
    xhr.send(formData)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileArray = Array.from(e.target.files)
      
      // HWP 파일 처리
      fileArray.forEach(file => {
        if (isValidHWPFile(file) && onHwpFileUpload) {
          onHwpFileUpload(file)
          return // HWP 파일은 별도 처리하므로 업로드 목록에 추가하지 않음
        }
      })
      
      // 일반 파일들만 업로드 목록에 추가
      const regularFiles = fileArray.filter(file => !isValidHWPFile(file))
      
      if (regularFiles.length > 0) {
        const newFiles = regularFiles.map((file) => ({
          id: Math.random().toString(36).substring(7),
          name: file.name,
          progress: 0,
          status: "uploading" as UploadStatus,
        }))

        setFiles((prev) => [...prev, ...newFiles])

        // 실제 파일 업로드
        regularFiles.forEach((file, index) => {
          uploadFile(file, newFiles[index].id)
        })
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileArray = Array.from(e.dataTransfer.files)
      
      // HWP 파일 처리
      fileArray.forEach(file => {
        if (isValidHWPFile(file) && onHwpFileUpload) {
          onHwpFileUpload(file)
          return // HWP 파일은 별도 처리하므로 업로드 목록에 추가하지 않음
        }
      })
      
      // 일반 파일들만 업로드 목록에 추가
      const regularFiles = fileArray.filter(file => !isValidHWPFile(file))
      
      if (regularFiles.length > 0) {
        const newFiles = regularFiles.map((file) => ({
          id: Math.random().toString(36).substring(7),
          name: file.name,
          progress: 0,
          status: "uploading" as UploadStatus,
        }))

        setFiles((prev) => [...prev, ...newFiles])

        // 실제 파일 업로드
        regularFiles.forEach((file, index) => {
          uploadFile(file, newFiles[index].id)
        })
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id))
  }

  return (
    <div className="space-y-3">
      <div
        className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
        <div className="flex items-center justify-center gap-2 mb-2">
          <FileImage className="h-6 w-6 text-blue-500" />
          <FileAudio className="h-6 w-6 text-green-500" />
          <p className="text-sm text-gray-500">손글씨, 문서, 이미지, 녹음파일</p>
        </div>
        <p className="text-xs text-gray-400">클릭 or 끌어다 놓기</p>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          accept=".hwp,.pdf,.jpg,.jpeg,.png,.gif,.mp3,.wav,.m4a"
          onChange={handleFileChange}
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {files.map((file) => (
            <div key={file.id} className="text-xs">
              <div className="flex justify-between mb-1">
                <div className="flex items-center">
                  {file.name.match(/\.(jpg|jpeg|png|gif)$/i) && <FileImage className="h-3 w-3 mr-1 text-blue-500" />}
                  {file.name.match(/\.(mp3|wav|m4a)$/i) && <FileAudio className="h-3 w-3 mr-1 text-green-500" />}
                  {file.name.match(/\.(hwp|pdf|doc|docx)$/i) && <FileText className="h-3 w-3 mr-1 text-gray-500" />}
                  <span className="truncate max-w-[150px]">{file.name}</span>
                </div>
                <div className="flex items-center">
                  {file.status === "uploading" && <span className="text-xs mr-2">{file.progress}%</span>}
                  {file.status === "success" && <Check className="h-4 w-4 text-green-500" />}
                  {file.status === "error" && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                  <button onClick={() => removeFile(file.id)} className="ml-2">
                    <X className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                  </button>
                </div>
              </div>
              {file.status === "uploading" && <Progress value={file.progress} className="h-1" />}
              {file.status === "error" && file.error && (
                <p className="text-xs text-red-500 mt-1">{file.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

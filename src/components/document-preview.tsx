"use client"

import type React from "react"

import { useState } from "react"

export default function DocumentPreview() {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    // 지식 라이브러리에서 드롭된 문서 처리
    const data = e.dataTransfer.getData("text/plain")
    if (data) {
      try {
        const item = JSON.parse(data)
        console.log("드롭된 항목:", item)
        // 여기서 문서 내용을 삽입할 것
      } catch (error) {
        console.error("드롭된 데이터 파싱 실패")
      }
    }
  }

  return (
    <div
      className={`border rounded-md p-8 min-h-[600px] bg-white ${isDragging ? "border-blue-500 bg-blue-50" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* HWP 문서 미리보기 (간략 버전) */}
      <div className="mb-8 border-b pb-4">
        <div className="text-xs text-red-600 font-bold mb-2">II급 비밀</div>
        <h1 className="text-2xl font-bold mb-2">23-2 분기 작전계획</h1>
        <p className="text-sm text-gray-500">작성자: 홍길동 대위 | 작성일: 2024-05-13</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">1. 개요</h2>
        <p>
          본 작전계획은 23년 2분기 동안 수행될 부대 작전 및 훈련에 관한 종합 계획서이다. 주요 내용으로는 경계 작전, 합동
          훈련, 그리고 전술 개발에 관한 사항을 포함한다.
        </p>

        <div className="my-6 flex justify-center">
          <div className="w-[400px] h-[300px] bg-gray-100 rounded-md flex items-center justify-center">
            <div className="flex space-x-4">
              <div className="w-16 h-16 rounded-full bg-blue-200"></div>
              <div className="w-16 h-16 bg-green-200 transform rotate-45"></div>
              <div className="w-16 h-16 bg-amber-200 rounded-md"></div>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold">2. 작전 목표</h2>
        <p>
          경계 작전 효율성 15% 증가, 합동 훈련 성공률 90% 달성, 그리고 신규 전술 2건 이상 개발을 목표로 한다. 이는
          전반적인 부대 전투력 향상에 기여할 것으로 예상된다.
        </p>

        <h2 className="text-xl font-semibold">3. 주요 일정</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>5월 15일: 경계 작전 강화 훈련</li>
          <li>6월 3일: 인접 부대와 합동 훈련</li>
          <li>6월 20일: 신규 전술 개발 워크샵</li>
          <li>6월 30일: 분기 작전 평가회의</li>
        </ul>
      </div>
    </div>
  )
}

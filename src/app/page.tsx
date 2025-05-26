import type { Metadata } from "next"
import DocumentEditor from "@/components/document-editor"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Docenty 훈민 AI",
  description: "AI 기반 군사 문서 작성 및 편집 시스템",
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b bg-white px-6 py-3 flex items-center">
        <div className="flex items-center">
          <Image src="/images/docenty-logo.svg" alt="Docenty.ai 로고" width={40} height={40} className="mr-2" />
          <h1 className="text-xl font-semibold text-gray-800">Docenty 훈민 AI</h1>
        </div>
      </header>
      <DocumentEditor />
    </main>
  )
}

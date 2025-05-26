'use client'

import { useState } from 'react'
import { Editor } from '@tiptap/react'
import TextAlign from '@tiptap/extension-text-align'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { 
  Bold, 
  Italic, 
  Underline, 
  Heading1, 
  Heading2, 
  Heading3, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  List, 
  ListOrdered,
  ChevronDown 
} from 'lucide-react'

const FONT_FAMILIES = [
  { label: '맑은 고딕', value: 'Malgun Gothic, sans-serif' },
  { label: '나눔고딕', value: 'Nanum Gothic, sans-serif' },
  { label: '바탕체', value: 'Batang, serif' },
  { label: '돋움체', value: 'Dotum, sans-serif' },
]

const FONT_SIZES = [
  { label: '10pt', value: '10pt' },
  { label: '11pt', value: '11pt' },
  { label: '12pt', value: '12pt' },
  { label: '14pt', value: '14pt' },
  { label: '16pt', value: '16pt' },
  { label: '18pt', value: '18pt' },
]

const LINE_SPACINGS = [
  { label: '1.0', value: '1.0' },
  { label: '1.15', value: '1.15' },
  { label: '1.5', value: '1.5' },
  { label: '2.0', value: '2.0' },
]

const DOCUMENT_STYLES = [
  { label: '기본', value: 'default' },
  { label: '작전계획', value: 'operation-plan' },
  { label: '훈련보고서', value: 'training-report' },
  { label: '일일결산', value: 'daily-report' },
]

interface DocumentToolbarProps {
  editor: Editor | null
}

export default function DocumentToolbar({ editor }: DocumentToolbarProps) {
  // 각 드롭다운의 열림/닫힘 상태를 명시적으로 관리
  const [fontMenuOpen, setFontMenuOpen] = useState(false)
  const [sizeMenuOpen, setSizeMenuOpen] = useState(false)
  const [spacingMenuOpen, setSpacingMenuOpen] = useState(false)
  const [styleMenuOpen, setStyleMenuOpen] = useState(false)

  if (!editor) {
    return null
  }

  const setFontFamily = (fontFamily: string) => {
    editor.chain().focus().setFontFamily(fontFamily).run()
    setFontMenuOpen(false) // 메뉴 닫기
  }

  const setFontSize = (fontSize: string) => {
    editor.chain().focus().run()
    setSizeMenuOpen(false) // 메뉴 닫기
  }

  const setLineHeight = (lineHeight: string) => {
    editor.chain().focus().run()
    setSpacingMenuOpen(false) // 메뉴 닫기
  }

  const applyDocumentStyle = (style: string) => {
    switch (style) {
      case 'operation-plan':
        setFontFamily('Malgun Gothic, sans-serif')
        break
      case 'training-report':
        setFontFamily('Nanum Gothic, sans-serif')
        break
      case 'daily-report':
        setFontFamily('Dotum, sans-serif')
        break
      default:
        setFontFamily('Malgun Gothic, sans-serif')
    }
    setStyleMenuOpen(false) // 메뉴 닫기
  }

  return (
    <div className="bg-white border-b p-2 flex items-center flex-wrap gap-2">
      {/* 스타일링 버튼 */}
      <div className="flex items-center space-x-1">
        <Button
          variant={editor.isActive('bold') ? 'default' : 'outline'}
          size="icon"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="h-8 w-8"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('italic') ? 'default' : 'outline'}
          size="icon"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="h-8 w-8"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('underline') ? 'default' : 'outline'}
          size="icon"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className="h-8 w-8"
        >
          <Underline className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-6 w-px bg-gray-300 mx-1" />

      {/* 정렬 버튼 */}
      <div className="flex items-center space-x-1">
        <Button
          variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'outline'}
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className="h-8 w-8"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'outline'}
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className="h-8 w-8"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'outline'}
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className="h-8 w-8"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-6 w-px bg-gray-300 mx-1" />

      {/* 제목 버튼 */}
      <div className="flex items-center space-x-1">
        <Button
          variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'outline'}
          size="icon"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className="h-8 w-8"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'outline'}
          size="icon"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className="h-8 w-8"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'outline'}
          size="icon"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className="h-8 w-8"
        >
          <Heading3 className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-6 w-px bg-gray-300 mx-1" />

      {/* 목록 버튼 */}
      <div className="flex items-center space-x-1">
        <Button
          variant={editor.isActive('bulletList') ? 'default' : 'outline'}
          size="icon"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="h-8 w-8"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('orderedList') ? 'default' : 'outline'}
          size="icon"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className="h-8 w-8"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-6 w-px bg-gray-300 mx-1" />

      {/* 글꼴 드롭다운 */}
      <DropdownMenu open={fontMenuOpen} onOpenChange={setFontMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="min-w-24">
            글꼴 <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {FONT_FAMILIES.map((font) => (
            <DropdownMenuItem
              key={font.value}
              onClick={() => setFontFamily(font.value)}
              style={{ fontFamily: font.value }}
            >
              {font.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 크기 드롭다운 */}
      <DropdownMenu open={sizeMenuOpen} onOpenChange={setSizeMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="min-w-16">
            크기 <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {FONT_SIZES.map((size) => (
            <DropdownMenuItem
              key={size.value}
              onClick={() => setFontSize(size.value)}
            >
              {size.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 줄간격 드롭다운 */}
      <DropdownMenu open={spacingMenuOpen} onOpenChange={setSpacingMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="min-w-20">
            줄간격 <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {LINE_SPACINGS.map((spacing) => (
            <DropdownMenuItem
              key={spacing.value}
              onClick={() => setLineHeight(spacing.value)}
            >
              {spacing.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 스타일 드롭다운 */}
      <DropdownMenu open={styleMenuOpen} onOpenChange={setStyleMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="min-w-20">
            스타일 <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {DOCUMENT_STYLES.map((style) => (
            <DropdownMenuItem
              key={style.value}
              onClick={() => applyDocumentStyle(style.value)}
            >
              {style.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 
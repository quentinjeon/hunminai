import { NextRequest, NextResponse } from 'next/server'
import { getDocument, saveDocument } from '@/lib/document-service'
import { SecurityLevel } from '@/lib/store'

// 문서 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const document = await getDocument(params.id)
    return NextResponse.json(document)
  } catch (error) {
    console.error('문서 조회 오류:', error)
    return NextResponse.json(
      { error: '문서를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 문서 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    
    // 필수 필드 검증
    if (!data.title || !data.content || !data.security || !data.authorId) {
      return NextResponse.json(
        { error: '제목, 내용, 보안 등급, 작성자 ID는 필수 항목입니다.' },
        { status: 400 }
      )
    }
    
    // 보안 등급 검증
    const validSecurityLevels: SecurityLevel[] = ['NORMAL', 'CONFIDENTIAL', 'SECRET_II', 'SECRET_I']
    if (!validSecurityLevels.includes(data.security as SecurityLevel)) {
      return NextResponse.json(
        { error: '유효하지 않은 보안 등급입니다.' },
        { status: 400 }
      )
    }
    
    const result = await saveDocument({
      id: params.id,
      title: data.title,
      content: data.content,
      security: data.security,
      authorId: data.authorId,
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('문서 업데이트 오류:', error)
    return NextResponse.json(
      { error: '문서를 업데이트하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 
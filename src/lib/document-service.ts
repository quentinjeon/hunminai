import { SecurityLevel } from './store'
import { prisma } from './db'

export interface DocumentData {
  id?: string
  title: string
  content: string
  security: SecurityLevel
  authorId: string
}

/**
 * 문서 저장
 */
export async function saveDocument(document: DocumentData): Promise<{ id: string }> {
  try {
    // 기존 문서인 경우 업데이트
    if (document.id) {
      const updatedDoc = await prisma.document.update({
        where: { id: document.id },
        data: {
          title: document.title,
          content: document.content,
          security: document.security,
          // authorId는 변경하지 않음
        },
      })
      return { id: updatedDoc.id }
    } 
    // 새 문서인 경우 생성
    else {
      const newDoc = await prisma.document.create({
        data: {
          title: document.title,
          content: document.content,
          security: document.security,
          authorId: document.authorId,
        },
      })
      return { id: newDoc.id }
    }
  } catch (error) {
    console.error('문서 저장 오류:', error)
    throw new Error('문서를 저장하는 중 오류가 발생했습니다.')
  }
}

/**
 * 문서 불러오기
 */
export async function getDocument(id: string): Promise<DocumentData> {
  try {
    const document = await prisma.document.findUnique({
      where: { id },
    })

    if (!document) {
      throw new Error('문서를 찾을 수 없습니다.')
    }

    return {
      id: document.id,
      title: document.title,
      content: document.content,
      security: document.security as SecurityLevel,
      authorId: document.authorId,
    }
  } catch (error) {
    console.error('문서 불러오기 오류:', error)
    throw new Error('문서를 불러오는 중 오류가 발생했습니다.')
  }
}

/**
 * 최근 문서 목록 가져오기
 */
export async function getRecentDocuments(limit = 10): Promise<DocumentData[]> {
  try {
    const documents = await prisma.document.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit,
    })

    return documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      security: doc.security as SecurityLevel,
      authorId: doc.authorId,
    }))
  } catch (error) {
    console.error('문서 목록 불러오기 오류:', error)
    throw new Error('문서 목록을 불러오는 중 오류가 발생했습니다.')
  }
} 
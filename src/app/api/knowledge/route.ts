import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import type { SecurityClearance } from '@/types/auth';
import { CATEGORIES, SAMPLE_DOCUMENTS } from './data';

/**
 * 지식 라이브러리 문서 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 세션 및 사용자 보안 등급 확인
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 });
    }

    // URL 파라미터 추출
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const query = searchParams.get('query');
    const tag = searchParams.get('tag');
    const type = searchParams.get('type');

    // 사용자 보안 등급에 따른 접근 가능 문서 필터링
    const userSecurityClearance = session.user.securityClearance as SecurityClearance || 'NORMAL';
    
    // 보안 등급에 따른 접근 제어
    const allowedSecurityLevels: Record<SecurityClearance, string[]> = {
      'NORMAL': ['NORMAL'],
      'CONFIDENTIAL': ['NORMAL', 'CONFIDENTIAL'],
      'SECRET_II': ['NORMAL', 'CONFIDENTIAL', 'SECRET_II'],
      'SECRET_I': ['NORMAL', 'CONFIDENTIAL', 'SECRET_II', 'SECRET_I']
    };
    
    const accessibleSecurityLevels = allowedSecurityLevels[userSecurityClearance] || ['NORMAL'];

    // 문서 필터링
    let filteredDocuments = SAMPLE_DOCUMENTS.filter(doc => 
      accessibleSecurityLevels.includes(doc.security)
    );

    // 카테고리 필터링
    if (category) {
      filteredDocuments = filteredDocuments.filter(doc => 
        doc.category.toLowerCase() === category.toLowerCase()
      );
    }

    // 검색어 필터링
    if (query) {
      const lowerQuery = query.toLowerCase();
      filteredDocuments = filteredDocuments.filter(doc => 
        doc.title.toLowerCase().includes(lowerQuery) || 
        doc.content.toLowerCase().includes(lowerQuery) ||
        doc.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }

    // 태그 필터링
    if (tag) {
      filteredDocuments = filteredDocuments.filter(doc => 
        doc.tags.some(t => t.toLowerCase() === tag.toLowerCase())
      );
    }

    // 결과 반환
    if (type === 'categories') {
      return NextResponse.json({ categories: CATEGORIES });
    } else if (type === 'tags') {
      // 모든 태그 추출
      const allTags = Array.from(
        new Set(
          SAMPLE_DOCUMENTS.flatMap(doc => doc.tags)
            .filter(tag => tag) // null/undefined 제외
        )
      ).sort();
      return NextResponse.json({ tags: allTags });
    } else {
      return NextResponse.json({ documents: filteredDocuments });
    }
  } catch (error) {
    console.error('지식 라이브러리 조회 오류:', error);
    return NextResponse.json(
      { error: '지식 라이브러리 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 새 문서 추가 (실제 구현에서는 Database 저장 필요)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 });
    }

    const data = await request.json();
    const { title, content, category, security = 'NORMAL', tags = [] } = data;

    // 필수 필드 검증
    if (!title || !content || !category) {
      return NextResponse.json(
        { error: '제목, 내용, 카테고리는 필수 항목입니다.' },
        { status: 400 }
      );
    }
    
    // 보안 등급 검증
    const validSecurityLevels = ['NORMAL', 'CONFIDENTIAL', 'SECRET_II', 'SECRET_I'];
    if (!validSecurityLevels.includes(security)) {
      return NextResponse.json(
        { error: '유효하지 않은 보안 등급입니다.' },
        { status: 400 }
      );
    }

    // 실제 구현에서는 DB에 저장
    const newDocument = {
      id: `${Date.now()}`, // 임의 ID 생성
      title,
      content,
      category,
      security,
      tags,
      createdAt: new Date().toISOString(),
      authorId: session.user.id
    };

    // 실제 구현에서는 DB에 저장하고 결과 반환
    return NextResponse.json(newDocument, { status: 201 });
  } catch (error) {
    console.error('문서 생성 오류:', error);
    return NextResponse.json(
      { error: '문서를 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
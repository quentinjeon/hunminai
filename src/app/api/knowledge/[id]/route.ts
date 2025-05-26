import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import type { SecurityClearance } from '@/types/auth';
import { SAMPLE_DOCUMENTS, SampleDocument } from '../data';

/**
 * 특정 ID의 지식 문서 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 세션 및 사용자 보안 등급 확인
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 });
    }

    const documentId = params.id;
    
    // 문서 조회 (실제 구현에서는 DB에서 조회)
    const document = SAMPLE_DOCUMENTS.find((doc: SampleDocument) => doc.id === documentId);

    if (!document) {
      return NextResponse.json({ error: '문서를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 보안 등급에 따른 접근 제어
    const userSecurityClearance = session.user.securityClearance as SecurityClearance || 'NORMAL';
    
    const allowedSecurityLevels: Record<SecurityClearance, string[]> = {
      'NORMAL': ['NORMAL'],
      'CONFIDENTIAL': ['NORMAL', 'CONFIDENTIAL'],
      'SECRET_II': ['NORMAL', 'CONFIDENTIAL', 'SECRET_II'],
      'SECRET_I': ['NORMAL', 'CONFIDENTIAL', 'SECRET_II', 'SECRET_I']
    };
    
    const accessibleSecurityLevels = allowedSecurityLevels[userSecurityClearance] || ['NORMAL'];

    // 사용자 보안 등급으로 접근할 수 없는 문서인 경우
    if (!accessibleSecurityLevels.includes(document.security)) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error('문서 조회 오류:', error);
    return NextResponse.json(
      { error: '문서를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 특정 ID의 지식 문서 업데이트
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 });
    }

    const documentId = params.id;
    const data = await request.json();
    
    // 필수 필드 검증
    const { title, content, category, security, tags } = data;
    
    if (!title || !content || !category) {
      return NextResponse.json(
        { error: '제목, 내용, 카테고리는 필수 항목입니다.' },
        { status: 400 }
      );
    }

    // 실제 구현에서는 DB에서 조회 및 업데이트
    const document = SAMPLE_DOCUMENTS.find((doc: SampleDocument) => doc.id === documentId);
    
    if (!document) {
      return NextResponse.json({ error: '문서를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 권한 검증 로직 (실제 구현에서는 필요에 따라 추가)
    // 예: 작성자만 수정 가능하도록 제한

    // 업데이트된 문서
    const updatedDocument = {
      ...document,
      title,
      content,
      category,
      security,
      tags,
      updatedAt: new Date().toISOString(),
    };

    // 실제 구현에서는 DB 업데이트 후 결과 반환
    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error('문서 업데이트 오류:', error);
    return NextResponse.json(
      { error: '문서를 업데이트하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 특정 ID의 지식 문서 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 });
    }

    const documentId = params.id;
    
    // 실제 구현에서는 DB에서 조회
    const document = SAMPLE_DOCUMENTS.find((doc: SampleDocument) => doc.id === documentId);
    
    if (!document) {
      return NextResponse.json({ error: '문서를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 권한 검증 로직 (실제 구현에서는 필요에 따라 추가)
    // 예: 작성자 또는 관리자만 삭제 가능하도록 제한

    // 실제 구현에서는 DB에서 삭제
    return NextResponse.json({ success: true, message: '문서가 삭제되었습니다.' });
  } catch (error) {
    console.error('문서 삭제 오류:', error);
    return NextResponse.json(
      { error: '문서를 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
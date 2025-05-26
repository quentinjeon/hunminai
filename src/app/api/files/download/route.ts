import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/db';

// JWT 서명용 비밀키 (환경 변수에서 로드)
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-for-development';

/**
 * 토큰을 통한 파일 다운로드 처리
 * 
 * 이 API는 서명된 토큰을 통해 파일을 다운로드합니다.
 * 예: /api/files/download?token=<JWT_TOKEN>
 */
export async function GET(request: NextRequest) {
  try {
    // URL에서 토큰 추출
    const token = request.nextUrl.searchParams.get('token');
    
    if (!token) {
      return NextResponse.json({ error: '토큰이 제공되지 않았습니다.' }, { status: 400 });
    }
    
    // 토큰 검증
    let payload;
    try {
      payload = verify(token, JWT_SECRET) as { fileId: string; userId: string; issuedAt: number };
    } catch (error) {
      return NextResponse.json({ error: '토큰이 유효하지 않습니다.' }, { status: 401 });
    }
    
    // 발급 시간으로부터 5분 이상 경과한 경우 만료 처리
    const now = Date.now();
    const tokenAge = now - payload.issuedAt;
    if (tokenAge > 5 * 60 * 1000) {
      return NextResponse.json({ error: '토큰이 만료되었습니다.' }, { status: 401 });
    }
    
    // 파일 조회
    const file = await prisma.file.findUnique({
      where: { id: payload.fileId }
    });
    
    if (!file) {
      return NextResponse.json({ error: '파일을 찾을 수 없습니다.' }, { status: 404 });
    }
    
    // 실제 구현에서는 다음 중 하나를 선택:
    // 1. 파일 스토리지에서 직접 파일 내용을 가져와 응답으로 반환
    // 2. 파일 URL로 리다이렉트 (단, URL이 공개적으로 접근 가능한 경우에만)
    
    // 아래는 파일 URL로 리다이렉트하는 예시
    return NextResponse.redirect(file.url);
  } catch (error) {
    console.error('파일 다운로드 오류:', error);
    return NextResponse.json(
      { error: '파일 다운로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { sign, verify } from 'jsonwebtoken';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// JWT 서명용 비밀키 (환경 변수에서 로드)
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-for-development';

// S3 클라이언트 생성 (MinIO와 호환)
const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: process.env.MINIO_ENDPOINT,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || "",
    secretAccessKey: process.env.MINIO_SECRET_KEY || "",
  },
  forcePathStyle: true,
});

/**
 * 안전한 파일 다운로드를 위한 서명된 URL 생성
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 사용자 인증 확인
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    // 파일 정보 조회
    const file = await prisma.file.findUnique({
      where: { id: params.id }
    });

    if (!file) {
      return NextResponse.json({ error: "파일을 찾을 수 없습니다" }, { status: 404 });
    }

    // URL에서 S3 키 추출
    const urlParts = file.url.split("/");
    const key = urlParts[urlParts.length - 1];

    // 서명된 다운로드 URL 생성 (5분 유효)
    const command = new GetObjectCommand({
      Bucket: process.env.MINIO_BUCKET_NAME,
      Key: key,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: 300 // 5분
    });

    // 다운로드 로그 기록 (선택사항)
    console.log(`File download: ${file.name} by user ${session.user.id}`);

    return NextResponse.json({ 
      url: presignedUrl,
      filename: file.name,
      mimeType: file.mimeType,
      size: file.size
    });

  } catch (error) {
    console.error("다운로드 오류:", error);
    return NextResponse.json({ error: "파일 다운로드에 실패했습니다" }, { status: 500 });
  }
}

/**
 * 토큰 검증 후 파일 다운로드 처리
 */
export async function POST(request: NextRequest) {
  try {
    // 요청 본문에서 토큰 추출
    const body = await request.json();
    const { token } = body;
    
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
    
    // 실제 파일 URL로 리다이렉트 또는 파일 스트림 반환
    // (실제 구현에서는 스토리지 서비스에서 파일을 가져와 응답으로 반환하는 것이 일반적)
    return NextResponse.redirect(file.url);
  } catch (error) {
    console.error('파일 다운로드 오류:', error);
    return NextResponse.json(
      { error: '파일 다운로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
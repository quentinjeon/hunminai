import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRecentDocuments, saveDocument } from "@/lib/document-service";
import { SecurityLevel } from "@/lib/store";

// 문서 목록 조회
export async function GET(request: NextRequest) {
  try {
    // URL 쿼리 파라미터에서 limit 값 추출
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    
    const documents = await getRecentDocuments(limit);
    return NextResponse.json(documents);
  } catch (error) {
    console.error("문서 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "문서 목록을 조회하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 새 문서 생성
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const { title, content, security = "NORMAL", authorId } = data;
    
    if (!title || !content || !authorId) {
      return NextResponse.json(
        { error: "제목, 내용, 작성자 ID는 필수 항목입니다." },
        { status: 400 }
      );
    }
    
    // 보안 등급 검증
    const validSecurityLevels: SecurityLevel[] = ['NORMAL', 'CONFIDENTIAL', 'SECRET_II', 'SECRET_I'];
    if (!validSecurityLevels.includes(security as SecurityLevel)) {
      return NextResponse.json(
        { error: '유효하지 않은 보안 등급입니다.' },
        { status: 400 }
      );
    }
    
    const result = await saveDocument({
      title,
      content,
      security: security as SecurityLevel,
      authorId,
    });
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("문서 생성 오류:", error);
    return NextResponse.json(
      { error: "문서를 생성하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 
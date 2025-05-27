import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  try {
    // 사용자 인증 확인
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    // 쿼리 파라미터 추출
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    // 페이지네이션 계산
    const skip = (page - 1) * limit;

    // 검색 조건 설정
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { mimeType: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    // 전체 개수 조회
    const total = await prisma.file.count({ where });

    // 파일 목록 조회
    const files = await prisma.file.findMany({
      where,
      orderBy: { uploadedAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        mimeType: true,
        size: true,
        url: true,
        uploadedAt: true,
      },
    });

    return NextResponse.json({
      files,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("파일 목록 조회 오류:", error);
    return NextResponse.json({ error: "파일 목록을 불러올 수 없습니다" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const { name, mimeType, size, url } = data;
    
    if (!name || !mimeType || !size || !url) {
      return NextResponse.json(
        { error: "파일 이름, MIME 타입, 크기, URL은 필수 항목입니다." },
        { status: 400 }
      );
    }
    
    // URL이 이미 존재하는지 확인
    const existingFile = await prisma.file.findUnique({
      where: {
        url
      }
    });
    
    if (existingFile) {
      return NextResponse.json(
        { error: "이미 존재하는 URL입니다." },
        { status: 400 }
      );
    }
    
    const file = await prisma.file.create({
      data: {
        name,
        mimeType,
        size,
        url
      }
    });
    
    return NextResponse.json(file, { status: 201 });
  } catch (error) {
    console.error("파일 생성 오류:", error);
    return NextResponse.json(
      { error: "파일 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 
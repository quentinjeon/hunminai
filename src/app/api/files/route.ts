import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const files = await prisma.file.findMany({
      orderBy: {
        uploadedAt: 'desc'
      }
    });
    return NextResponse.json(files);
  } catch (error) {
    console.error("파일 조회 오류:", error);
    return NextResponse.json(
      { error: "파일 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
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
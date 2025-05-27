import { NextRequest, NextResponse } from "next/server";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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

export async function DELETE(
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

    // S3에서 파일 삭제
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.MINIO_BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(deleteCommand);

    // 데이터베이스에서 파일 정보 삭제
    await prisma.file.delete({
      where: { id: params.id }
    });

    console.log(`File deleted: ${file.name} by user ${session.user.id}`);

    return NextResponse.json({ 
      message: "파일이 성공적으로 삭제되었습니다",
      id: params.id 
    });

  } catch (error) {
    console.error("파일 삭제 오류:", error);
    return NextResponse.json({ error: "파일 삭제에 실패했습니다" }, { status: 500 });
  }
} 
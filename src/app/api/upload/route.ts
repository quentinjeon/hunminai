import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/db";

// S3 클라이언트 생성 (MinIO와 호환)
const s3Client = new S3Client({
  region: "us-east-1", // MinIO에서는 중요하지 않음
  endpoint: process.env.MINIO_ENDPOINT,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || "",
    secretAccessKey: process.env.MINIO_SECRET_KEY || "",
  },
  forcePathStyle: true, // MinIO에 필요함
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "파일이 제공되지 않았습니다" }, { status: 400 });
    }

    // 허용된 파일 타입 확인
    const allowedTypes = [
      "application/haansofthwp", // .hwp
      "application/pdf", // .pdf
      "image/jpeg", // .jpg, .jpeg
      "image/png", // .png
      "audio/mpeg", // .mp3
      "audio/wav", // .wav
      "audio/x-m4a", // .m4a
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "지원되지 않는 파일 유형입니다" }, { status: 400 });
    }

    // 파일 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "파일 크기가 10MB를 초과합니다" }, { status: 400 });
    }

    // 파일을 버퍼로 변환
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `${Date.now()}-${file.name}`;

    // MinIO에 파일 업로드
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.MINIO_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const url = `${process.env.MINIO_PUBLIC_URL}/${process.env.MINIO_BUCKET_NAME}/${key}`;

    // 파일 메타데이터를 데이터베이스에 저장
    const fileRecord = await prisma.file.create({
      data: {
        name: file.name,
        mimeType: file.type,
        size: file.size,
        url,
      },
    });

    return NextResponse.json(fileRecord);
  } catch (error) {
    console.error("업로드 오류:", error);
    return NextResponse.json({ error: "파일 업로드에 실패했습니다" }, { status: 500 });
  }
} 
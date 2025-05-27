import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { writeFile } from 'fs/promises';
import path from 'path';
import { mkdir } from 'fs/promises';

// 임시 저장 디렉토리
const TEMP_DIR = path.join(process.cwd(), 'public', 'temp');

export async function POST(request: NextRequest) {
  try {
    console.log('API 호출 시작');
    
    // 인증 확인
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('인증 실패:', session);
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    // 파일 데이터 받기
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: '파일이 제공되지 않았습니다.' }, { status: 400 });
    }

    console.log('파일 정보:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // 파일 확장자 확인
    const fileExt = path.extname(file.name).toLowerCase();
    if (fileExt !== '.hwp' && fileExt !== '.hwpx') {
      return NextResponse.json({ error: '지원하지 않는 파일 형식입니다.' }, { status: 400 });
    }

    try {
      // 임시 디렉토리 생성
      await mkdir(TEMP_DIR, { recursive: true });
      
      // 파일명 생성 (timestamp + 원본 파일명)
      const timestamp = Date.now();
      const filename = `${timestamp}-${file.name}`;
      const filepath = path.join(TEMP_DIR, filename);
      
      // 파일 저장
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);
      
      console.log('파일 저장 완료:', filepath);

      // 파일 URL 생성
      const fileUrl = `/temp/${filename}`;

      // 뷰어용 HTML 생성
      const viewerHtml = `
        <div class="hwp-viewer" data-file-url="${fileUrl}">
          <div class="hwp-metadata">
            <h1>${file.name}</h1>
            <p>파일 크기: ${(file.size / 1024).toFixed(2)} KB</p>
          </div>
          <div class="hwp-content">
            <iframe 
              src="https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_URL}${fileUrl}`)}" 
              width="100%" 
              height="100%" 
              frameborder="0">
            </iframe>
          </div>
        </div>
      `;

      return NextResponse.json({ 
        html: viewerHtml,
        url: fileUrl,
        filename: file.name,
        size: file.size
      });

    } catch (error) {
      console.error('HWP 파일 처리 오류:', error);
      
      const fallbackHtml = `
        <div class="hwp-content">
          <h1>${file.name}</h1>
          <p>파일 크기: ${(file.size / 1024).toFixed(2)} KB</p>
          <p class="error">HWP 파일을 변환할 수 없습니다.</p>
          <p>이 파일은 웹 브라우저에서 직접 볼 수 없습니다.</p>
          <p>한글 프로그램을 사용하여 열어주세요.</p>
        </div>
      `;

      return NextResponse.json({ html: fallbackHtml });
    }

  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { error: '파일 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
// HWP 파일 처리를 위한 유틸리티 라이브러리
// 서버사이드 변환 API를 활용하는 방식

export interface HWPDocument {
  content: string;
  pageCount: number;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    created?: Date;
    modified?: Date;
  };
  pages?: HWPPage[];
}

export interface HWPPage {
  pageNumber: number;
  content: string;
  width: number;
  height: number;
}

export interface HWPRenderOptions {
  width?: number;
  height?: number;
  scale?: number;
  page?: number;
  format?: 'html' | 'pdf' | 'image';
}

/**
 * HWP 파일을 서버에 업로드하고 변환된 결과를 받아옵니다.
 */
export async function convertHWPToHTML(file: File | ArrayBuffer): Promise<string> {
  try {
    let formData = new FormData();
    
    if (file instanceof File) {
      formData.append('file', file);
    } else {
      // ArrayBuffer를 Blob으로 변환
      const blob = new Blob([file], { type: 'application/haansofthwp' });
      formData.append('file', blob, 'document.hwp');
    }
    
    // 서버의 HWP 변환 API 호출
    const response = await fetch('/api/hwp/convert', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('HWP 변환에 실패했습니다.');
    }
    
    const data = await response.json();
    return data.html;
  } catch (error) {
    console.error('HWP 변환 오류:', error);
    throw new Error('HWP 파일을 변환할 수 없습니다.');
  }
}

/**
 * HWP 파일을 파싱하여 문서 정보를 추출합니다.
 */
export async function parseHWPFile(file: File | ArrayBuffer): Promise<HWPDocument> {
  try {
    let buffer: ArrayBuffer;
    
    if (file instanceof File) {
      buffer = await file.arrayBuffer();
    } else {
      buffer = file;
    }
    
    // 기본 메타데이터 생성
    const metadata = {
      title: file instanceof File ? file.name.replace('.hwp', '') : 'HWP 문서',
      author: undefined,
      subject: undefined,
      creator: 'Hunmin AI',
      created: new Date(),
      modified: new Date(),
    };
    
    // HWP 파일 구조 분석 (간단한 헤더 체크)
    const dataView = new DataView(buffer);
    const signature = new Uint8Array(buffer, 0, 8);
    const isHWP = signature[0] === 0xD0 && signature[1] === 0xCF && 
                  signature[2] === 0x11 && signature[3] === 0xE0;
    
    if (!isHWP) {
      throw new Error('유효한 HWP 파일이 아닙니다.');
    }
    
    // 페이지 수 추정 (파일 크기 기반)
    const pageCount = Math.max(1, Math.ceil(buffer.byteLength / 100000)); // 100KB per page estimate
    
    // HTML 변환 시도
    let content = '';
    try {
      content = await convertHWPToHTML(file);
    } catch (error) {
      content = `
        <div class="hwp-preview-placeholder">
          <h2>HWP 문서</h2>
          <p>파일명: ${metadata.title}</p>
          <p>크기: ${(buffer.byteLength / 1024).toFixed(2)} KB</p>
          <p>페이지 수: 약 ${pageCount}페이지</p>
          <p class="error">실시간 미리보기를 사용할 수 없습니다.</p>
          <p>파일을 다운로드하여 한글 프로그램에서 확인해주세요.</p>
        </div>
      `;
    }
    
    return {
      content,
      pageCount,
      metadata,
    };
  } catch (error) {
    console.error('HWP 파일 파싱 오류:', error);
    throw new Error('HWP 파일을 파싱할 수 없습니다.');
  }
}

/**
 * HWP 파일을 HTML로 렌더링합니다.
 */
export async function renderHWPToHTML(file: File | ArrayBuffer, options: HWPRenderOptions = {}): Promise<string> {
  try {
    const hwpDoc = await parseHWPFile(file);
    
    // 스타일 정의
    const styles = `
      <style>
        .hwp-document {
          font-family: '맑은 고딕', 'Malgun Gothic', sans-serif;
          line-height: 1.6;
          color: #333;
          background: white;
          padding: 40px;
          max-width: 210mm;
          margin: 0 auto;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          min-height: 297mm;
        }
        .hwp-header {
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e0e0e0;
        }
        .hwp-header h1 {
          font-size: 24px;
          margin: 0 0 10px 0;
          color: #1a1a1a;
        }
        .hwp-metadata {
          font-size: 14px;
          color: #666;
        }
        .hwp-metadata span {
          margin-right: 20px;
        }
        .hwp-content {
          margin-top: 30px;
          font-size: 16px;
        }
        .hwp-content p {
          margin: 10px 0;
          text-align: justify;
        }
        .hwp-footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          font-size: 12px;
          color: #999;
          text-align: center;
        }
        .hwp-preview-placeholder {
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }
        .hwp-preview-placeholder h2 {
          color: #333;
          margin-bottom: 20px;
        }
        .hwp-preview-placeholder p {
          margin: 10px 0;
        }
        .hwp-preview-placeholder .error {
          color: #e74c3c;
          font-weight: bold;
          margin: 20px 0;
        }
      </style>
    `;
    
    // HTML 구조 생성
    const html = `
      ${styles}
      <div class="hwp-document">
        ${hwpDoc.content}
        ${hwpDoc.pageCount > 1 ? `
          <div class="hwp-footer">
            <p>총 ${hwpDoc.pageCount} 페이지</p>
          </div>
        ` : ''}
      </div>
    `;
    
    return html;
  } catch (error) {
    console.error('HWP HTML 렌더링 오류:', error);
    throw new Error('HWP 파일을 HTML로 렌더링할 수 없습니다.');
  }
}

/**
 * HWP 파일에서 텍스트만 추출합니다.
 */
export async function extractTextFromHWP(file: File | ArrayBuffer): Promise<string> {
  try {
    const hwpDoc = await parseHWPFile(file);
    // HTML에서 텍스트만 추출
    const div = document.createElement('div');
    div.innerHTML = hwpDoc.content;
    return div.textContent || div.innerText || '';
  } catch (error) {
    console.error('HWP 텍스트 추출 오류:', error);
    throw new Error('HWP 파일에서 텍스트를 추출할 수 없습니다.');
  }
}

/**
 * HWP 파일이 유효한지 확인합니다.
 */
export function isValidHWPFile(file: File): boolean {
  const validExtensions = ['.hwp', '.hwpx'];
  const fileName = file.name.toLowerCase();
  
  return validExtensions.some(ext => fileName.endsWith(ext));
}

/**
 * HWP 파일 크기가 허용 범위 내인지 확인합니다.
 */
export function isValidHWPFileSize(file: File, maxSizeMB: number = 50): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
} 
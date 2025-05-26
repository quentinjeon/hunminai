// HWP 파일 처리를 위한 유틸리티 라이브러리
// 현재 hwp.js 라이브러리의 API가 불안정하므로 기본 구현을 제공

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
}

export interface HWPRenderOptions {
  width?: number;
  height?: number;
  scale?: number;
  page?: number;
}

/**
 * HWP 파일을 파싱하여 문서 정보를 추출합니다.
 * 현재는 기본 구현을 제공하며, 향후 hwp.js 라이브러리가 안정화되면 업데이트됩니다.
 */
export async function parseHWPFile(file: File | ArrayBuffer): Promise<HWPDocument> {
  try {
    let buffer: ArrayBuffer;
    
    if (file instanceof File) {
      buffer = await file.arrayBuffer();
    } else {
      buffer = file;
    }
    
    // 현재는 기본 구현 제공
    // TODO: hwp.js 라이브러리가 안정화되면 실제 파싱 로직 구현
    const content = `HWP 파일이 업로드되었습니다.\n파일 크기: ${buffer.byteLength} bytes\n\n실제 HWP 파싱 기능은 향후 구현될 예정입니다.`;
    
    const metadata = {
      title: file instanceof File ? file.name : 'Unknown',
      author: undefined,
      subject: undefined,
      creator: undefined,
      created: new Date(),
      modified: new Date(),
    };
    
    // 페이지 수 계산 (추정)
    const pageCount = Math.max(1, Math.ceil(buffer.byteLength / 50000)); // 50KB per page estimate
    
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
    
    // 기본 HTML 렌더링
    const html = `
      <div class="hwp-document">
        <div class="hwp-header">
          <h1>${hwpDoc.metadata.title || 'HWP 문서'}</h1>
          <p class="metadata">
            ${hwpDoc.metadata.author ? `작성자: ${hwpDoc.metadata.author}` : ''}
            ${hwpDoc.metadata.created ? `작성일: ${hwpDoc.metadata.created.toLocaleDateString()}` : ''}
          </p>
        </div>
        <div class="hwp-content">
          <pre style="white-space: pre-wrap; font-family: inherit;">${hwpDoc.content}</pre>
        </div>
        <div class="hwp-footer">
          <p>페이지 수: ${hwpDoc.pageCount}</p>
        </div>
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
    return hwpDoc.content;
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
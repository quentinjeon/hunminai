'use client';

import { useEffect, useState } from 'react';
import { renderHWPToHTML, parseHWPFile, HWPDocument } from '@/lib/hwp';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Loader2 } from 'lucide-react';

interface HwpPreviewProps {
  fileUrl?: string;
  file?: File;
  className?: string;
}

export default function HwpPreview({ fileUrl, file, className = '' }: HwpPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hwpDocument, setHwpDocument] = useState<HWPDocument | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    loadHwpFile();
  }, [fileUrl, file]);

  const loadHwpFile = async () => {
    if (!fileUrl && !file) return;

    try {
      setLoading(true);
      setError(null);

      let fileToProcess: File | ArrayBuffer;

      if (file) {
        fileToProcess = file;
      } else if (fileUrl) {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('파일을 불러올 수 없습니다.');
        fileToProcess = await response.arrayBuffer();
      } else {
        throw new Error('파일 또는 URL이 제공되지 않았습니다.');
      }

      // HWP 문서 파싱
      const parsedDoc = await parseHWPFile(fileToProcess);
      setHwpDocument(parsedDoc);

      // HTML 렌더링
      const html = await renderHWPToHTML(fileToProcess);
      setHtmlContent(html);

    } catch (err) {
      console.error('HWP 파일 로드 오류:', err);
      setError(err instanceof Error ? err.message : '파일을 로드할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const changePage = (newPage: number) => {
    if (hwpDocument && newPage >= 1 && newPage <= hwpDocument.pageCount) {
      setCurrentPage(newPage);
    }
  };

  const changeZoom = (delta: number) => {
    const newZoom = Math.max(50, Math.min(200, zoom + delta));
    setZoom(newZoom);
  };

  const downloadFile = () => {
    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = hwpDocument?.metadata.title || 'document.hwp';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 ${className}`}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">HWP 파일을 로드하는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 font-medium">오류 발생</p>
          <p className="text-gray-600 mt-2">{error}</p>
          <Button 
            onClick={loadHwpFile} 
            className="mt-4"
            variant="outline"
          >
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* 도구모음 */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <div className="flex items-center space-x-2">
          <h3 className="font-medium text-gray-900">
            {hwpDocument?.metadata.title || 'HWP 문서'}
          </h3>
          {hwpDocument?.metadata.author && (
            <span className="text-sm text-gray-500">
              - {hwpDocument.metadata.author}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 줌 컨트롤 */}
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => changeZoom(-10)}
              disabled={zoom <= 50}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-12 text-center">
              {zoom}%
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => changeZoom(10)}
              disabled={zoom >= 200}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* 다운로드 버튼 */}
          {fileUrl && (
            <Button
              size="sm"
              variant="outline"
              onClick={downloadFile}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 문서 내용 */}
      <div className="flex-1 overflow-auto p-4 bg-gray-100">
        <div 
          className="bg-white shadow-lg mx-auto"
          style={{ 
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            minHeight: '100%',
            width: '210mm', // A4 width
            maxWidth: '100%'
          }}
        >
          <div 
            className="p-8"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      </div>

      {/* 페이지 네비게이션 */}
      {hwpDocument && hwpDocument.pageCount > 1 && (
        <div className="flex items-center justify-center space-x-4 p-3 border-t bg-gray-50">
          <Button
            size="sm"
            variant="outline"
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            이전
          </Button>
          
          <span className="text-sm font-medium">
            {currentPage} / {hwpDocument.pageCount}
          </span>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage === hwpDocument.pageCount}
          >
            다음
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
} 
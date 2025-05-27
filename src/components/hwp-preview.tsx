'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HwpPreviewProps {
  fileUrl?: string;
  file?: File;
  className?: string;
}

interface FileInfo {
  name: string;
  size: number;
  url?: string;
}

export default function HwpPreview({ fileUrl, file, className = '' }: HwpPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);

  useEffect(() => {
    loadHwpFile();
  }, [fileUrl, file]);

  const loadHwpFile = async () => {
    if (!fileUrl && !file) return;

    try {
      setLoading(true);
      setError(null);

      if (file) {
        // 파일이 직접 제공된 경우 API를 통해 변환
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/hwp/convert', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('파일을 처리할 수 없습니다.');
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        const newFileInfo: FileInfo = {
          name: data.filename,
          size: data.size,
          url: data.url
        };
        setFileInfo(newFileInfo);

        // Microsoft Office Online Viewer URL 설정
        const viewUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(data.url)}`;
        setViewerUrl(viewUrl);
      } else if (fileUrl) {
        // URL이 직접 제공된 경우
        const newFileInfo: FileInfo = {
          name: fileUrl.split('/').pop() || 'document.hwp',
          size: 0,
          url: fileUrl
        };
        setFileInfo(newFileInfo);
        
        const viewUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
        setViewerUrl(viewUrl);
      }

    } catch (err) {
      console.error('HWP 파일 로드 오류:', err);
      setError(err instanceof Error ? err.message : '파일을 로드할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = () => {
    if (fileInfo?.url) {
      const link = document.createElement('a');
      link.href = fileInfo.url;
      link.download = fileInfo.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center h-full bg-gray-50', className)}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">HWP 파일을 로드하는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex items-center justify-center h-full bg-gray-50', className)}>
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
          >
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full bg-white', className)}>
      {/* 도구모음 */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <div className="flex items-center space-x-2">
          <h3 className="font-medium text-gray-900">
            {fileInfo?.name || 'HWP 문서'}
          </h3>
          {fileInfo && fileInfo.size > 0 && (
            <span className="text-sm text-gray-500">
              ({(fileInfo.size / 1024).toFixed(2)} KB)
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 다운로드 버튼 */}
          {fileInfo?.url && (
            <Button
              onClick={downloadFile}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              다운로드
            </Button>
          )}
        </div>
      </div>

      {/* 문서 내용 */}
      <div className="flex-1 overflow-hidden">
        {viewerUrl ? (
          <iframe
            src={viewerUrl}
            className="w-full h-full border-0"
            title="HWP 문서 뷰어"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100 p-4">
            <p className="text-gray-500">
              미리보기를 사용할 수 없습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 
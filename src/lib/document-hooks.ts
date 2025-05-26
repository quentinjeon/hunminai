'use client';

import { useState } from 'react';
import { useDocumentStore } from './store';
import type { DocumentData } from './document-service';

/**
 * 문서 저장 훅
 */
export function useSaveDocument() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentDocument, markAsSaved } = useDocumentStore();

  const saveDocument = async () => {
    try {
      setLoading(true);
      setError(null);

      // 저장에 필요한 문서 데이터 준비
      const documentData: DocumentData = {
        title: currentDocument.title,
        content: currentDocument.content,
        security: currentDocument.securityLevel,
        authorId: 'user-1', // TODO: 실제 사용자 ID로 변경
      };

      // 기존 문서인 경우 ID 추가
      if (currentDocument.id) {
        documentData.id = currentDocument.id;
      }

      // API 엔드포인트 결정
      const endpoint = currentDocument.id 
        ? `/api/documents/${currentDocument.id}`
        : '/api/documents';
      
      // HTTP 메서드 결정
      const method = currentDocument.id ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(documentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '문서를 저장하는 중 오류가 발생했습니다.');
      }

      const result = await response.json();
      
      // 상태 관리 스토어 업데이트
      if (!currentDocument.id) {
        useDocumentStore.setState((state) => ({
          currentDocument: {
            ...state.currentDocument,
            id: result.id,
          },
        }));
      }
      
      // 저장 상태 표시
      markAsSaved();
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    saveDocument,
    loading,
    error,
  };
}

/**
 * 문서 불러오기 훅
 */
export function useLoadDocument() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setDocument } = useDocumentStore();

  const loadDocument = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/documents/${id}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '문서를 불러오는 중 오류가 발생했습니다.');
      }

      const document = await response.json();
      
      // 상태 관리 스토어 업데이트
      setDocument({
        id: document.id,
        title: document.title,
        content: document.content,
        securityLevel: document.security,
      });
      
      return document;
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loadDocument,
    loading,
    error,
  };
}

/**
 * 최근 문서 목록 불러오기 훅
 */
export function useRecentDocuments() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentData[]>([]);

  const loadRecentDocuments = async (limit = 10) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/documents?limit=${limit}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '문서 목록을 불러오는 중 오류가 발생했습니다.');
      }

      const data = await response.json();
      setDocuments(data);
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    documents,
    loadRecentDocuments,
    loading,
    error,
  };
} 
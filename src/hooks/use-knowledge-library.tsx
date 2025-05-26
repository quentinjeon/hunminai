import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  getKnowledgeDocuments,
  getKnowledgeCategories,
  getKnowledgeTags,
  createKnowledgeDocument,
  KnowledgeDocument
} from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

export function useKnowledgeLibrary() {
  const [searchParams, setSearchParams] = useState<{
    query?: string;
    category?: string;
    tag?: string;
  }>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session, status } = useSession();
  
  // 인증 상태 확인
  const isAuthenticated = status === 'authenticated';
  const isAuthLoading = status === 'loading';

  // 검색 파라미터 업데이트 함수 (안정적인 키 생성을 위해 개선)
  const updateSearchParams = useCallback((newParams: Partial<typeof searchParams>) => {
    setSearchParams(prev => ({ ...prev, ...newParams }));
  }, []);

  // 검색 파라미터를 안정적인 키로 변환
  const stableSearchKey = useMemo(() => {
    return JSON.stringify(searchParams);
  }, [searchParams]);

  // 문서 목록 조회 - 인증된 경우에만 실행
  const {
    data: documentsData,
    isLoading: isLoadingDocuments,
    error: documentsError,
    refetch: refetchDocuments
  } = useQuery({
    queryKey: ['knowledgeDocuments', stableSearchKey],
    queryFn: () => getKnowledgeDocuments(searchParams),
    enabled: isAuthenticated, // 인증된 경우에만 요청
    staleTime: 5 * 60 * 1000, // 5분 동안 캐시
    retry: 1, // 401 에러 시 무한 재시도 방지
  });

  // 카테고리 목록 조회 - 인증된 경우에만 실행
  const {
    data: categoriesData,
    isLoading: isLoadingCategories,
  } = useQuery({
    queryKey: ['knowledgeCategories'],
    queryFn: () => getKnowledgeCategories(),
    enabled: isAuthenticated, // 인증된 경우에만 요청
    staleTime: 30 * 60 * 1000, // 30분 동안 캐시
    retry: 1, // 401 에러 시 무한 재시도 방지
  });

  // 태그 목록 조회 - 인증된 경우에만 실행
  const {
    data: tagsData,
    isLoading: isLoadingTags,
  } = useQuery({
    queryKey: ['knowledgeTags'],
    queryFn: () => getKnowledgeTags(),
    enabled: isAuthenticated, // 인증된 경우에만 요청
    staleTime: 30 * 60 * 1000, // 30분 동안 캐시
    retry: 1, // 401 에러 시 무한 재시도 방지
  });

  // 메모이제이션된 데이터
  const documents = useMemo(() => {
    return documentsData?.data?.documents || [];
  }, [documentsData?.data?.documents]);

  const categories = useMemo(() => {
    return categoriesData?.data?.categories || [];
  }, [categoriesData?.data?.categories]);

  const tags = useMemo(() => {
    return tagsData?.data?.tags || [];
  }, [tagsData?.data?.tags]);

  // 새 문서 생성
  const createMutation = useMutation({
    mutationFn: (document: Omit<KnowledgeDocument, 'id' | 'createdAt' | 'authorId'>) => 
      createKnowledgeDocument(document),
    onSuccess: () => {
      toast({
        title: '문서 생성 완료',
        description: '새 문서가 생성되었습니다.',
      });
      queryClient.invalidateQueries({ queryKey: ['knowledgeDocuments'] });
    },
    onError: (error: Error) => {
      toast({
        title: '문서 생성 실패',
        description: error.message || '문서를 생성하는 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });

  // 문서 드래그 이벤트 핸들러
  const handleDocumentDrag = useCallback((document: KnowledgeDocument, event: React.DragEvent) => {
    event.dataTransfer.setData('application/json', JSON.stringify(document));
    event.dataTransfer.effectAllowed = 'copy';
  }, []);

  // 보안 등급에 따른 표시 정보
  const getSecurityInfo = useCallback((securityLevel: string): { label: string; color: string } => {
    const securityMap: Record<string, { label: string; color: string }> = {
      'NORMAL': { label: '일반', color: 'bg-gray-100 text-gray-800' },
      'CONFIDENTIAL': { label: '대외비', color: 'bg-blue-100 text-blue-800' },
      'SECRET_II': { label: 'II급비밀', color: 'bg-amber-100 text-amber-800' },
      'SECRET_I': { label: 'I급비밀', color: 'bg-red-100 text-red-800' },
    };
    return securityMap[securityLevel] || securityMap.NORMAL;
  }, []);

  // 반환 데이터
  return {
    // 인증 관련
    isAuthenticated,
    isAuthLoading,
    session,
    
    // 검색 관련
    searchParams,
    updateSearchParams,
    clearSearch: () => setSearchParams({}),
    
    // 데이터 (메모이제이션됨)
    documents,
    categories,
    tags,
    
    // 로딩 상태 (인증되지 않은 경우 로딩으로 표시하지 않음)
    isLoading: isAuthenticated && (isLoadingDocuments || isLoadingCategories || isLoadingTags),
    isError: isAuthenticated && !!documentsError,
    
    // 작업
    createDocument: createMutation.mutate,
    isCreating: createMutation.isPending,
    refetchDocuments,
    
    // 유틸리티
    handleDocumentDrag,
    getSecurityInfo,
  };
} 
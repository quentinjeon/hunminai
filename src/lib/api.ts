// API 응답 데이터 기본 구조
interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// 지식 라이브러리 문서 타입
export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  security: string;
  tags: string[];
  createdAt?: string;
  authorId?: string;
}

// API 호출 기본 함수
async function fetchApi<T>(
  endpoint: string, 
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(endpoint, {
      ...options,
      credentials: 'include', // 쿠키 포함
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // 🛑 개발 환경에서 401 에러 스팸 억제
      if (response.status === 401 && process.env.NODE_ENV === 'development') {
        console.warn('401 Unauthorized - 로그인이 필요합니다.');
        return { error: '로그인이 필요합니다.' };
      }
      return { error: data.error || '알 수 없는 오류가 발생했습니다.' };
    }

    return { data: data as T };
  } catch (error) {
    console.error('API 호출 오류:', error);
    return { error: '서버 연결 중 오류가 발생했습니다.' };
  }
}

// 지식 라이브러리 문서 목록 조회
export async function getKnowledgeDocuments(params?: {
  category?: string;
  query?: string;
  tag?: string;
}): Promise<ApiResponse<{ documents: KnowledgeDocument[] }>> {
  const queryParams = new URLSearchParams();
  
  if (params?.category) queryParams.append('category', params.category);
  if (params?.query) queryParams.append('query', params.query);
  if (params?.tag) queryParams.append('tag', params.tag);
  
  const endpoint = `/api/knowledge?${queryParams.toString()}`;
  return fetchApi<{ documents: KnowledgeDocument[] }>(endpoint);
}

// 지식 라이브러리 카테고리 목록 조회
export async function getKnowledgeCategories(): Promise<ApiResponse<{ categories: string[] }>> {
  const endpoint = `/api/knowledge?type=categories`;
  return fetchApi<{ categories: string[] }>(endpoint);
}

// 지식 라이브러리 태그 목록 조회
export async function getKnowledgeTags(): Promise<ApiResponse<{ tags: string[] }>> {
  const endpoint = `/api/knowledge?type=tags`;
  return fetchApi<{ tags: string[] }>(endpoint);
}

// 새 지식 라이브러리 문서 생성
export async function createKnowledgeDocument(
  document: Omit<KnowledgeDocument, 'id' | 'createdAt' | 'authorId'>
): Promise<ApiResponse<KnowledgeDocument>> {
  const endpoint = `/api/knowledge`;
  return fetchApi<KnowledgeDocument>(endpoint, {
    method: 'POST',
    body: JSON.stringify(document),
  });
} 
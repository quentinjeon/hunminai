// 샘플 문서 인터페이스
export interface SampleDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  security: string;
  tags: string[];
  createdAt?: string;
  authorId?: string;
}

// 카테고리 목록 
export const CATEGORIES = [
  '작전계획',
  '훈련보고서',
  '일일결산',
  '부대현황',
  '지침서',
  '교범',
];

// 샘플 문서 데이터
export const SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    id: '1',
    title: '23-1 작전계획',
    content: '<h1>23-1 작전계획</h1><p>작전계획 내용</p>',
    category: '작전계획',
    security: 'CONFIDENTIAL',
    tags: ['작전', '계획']
  },
  {
    id: '2',
    title: '23-2 작전계획',
    content: '<h1>23-2 작전계획</h1><p>작전계획 내용</p>',
    category: '작전계획',
    security: 'SECRET_II',
    tags: ['작전', '계획', '기밀']
  },
  {
    id: '3',
    title: '기본 훈련보고서',
    content: '<h1>기본 훈련보고서</h1><p>훈련보고서 내용</p>',
    category: '훈련보고서',
    security: 'NORMAL',
    tags: ['훈련', '보고서']
  },
  {
    id: '4',
    title: '합동훈련 보고서',
    content: '<h1>합동훈련 보고서</h1><p>합동훈련 보고서 내용</p>',
    category: '훈련보고서',
    security: 'CONFIDENTIAL',
    tags: ['훈련', '보고서', '합동']
  },
  {
    id: '5',
    title: '일일결산보고',
    content: '<h1>일일결산보고</h1><p>일일결산보고 내용</p>',
    category: '일일결산',
    security: 'NORMAL',
    tags: ['결산', '일일', '보고']
  },
  {
    id: '6',
    title: '부대 현황',
    content: '<h1>부대 현황</h1><p>부대 현황 문서 내용</p>',
    category: '부대현황',
    security: 'SECRET_I',
    tags: ['부대', '현황', '기밀']
  },
  {
    id: '7',
    title: '장비 정비 지침서',
    content: '<h1>장비 정비 지침서</h1><p>장비 정비 관련 지침</p>',
    category: '지침서',
    security: 'NORMAL',
    tags: ['정비', '장비', '지침']
  },
  {
    id: '8',
    title: '통신 교범',
    content: '<h1>통신 교범</h1><p>통신 장비 운용 교범</p>',
    category: '교범',
    security: 'CONFIDENTIAL',
    tags: ['통신', '교범', '운용']
  },
]; 
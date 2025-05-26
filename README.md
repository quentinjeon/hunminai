# 🚀 훈민 AI - 군 문서 작성 지원 시스템

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC)
![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748)
![License](https://img.shields.io/badge/license-MIT-green)

## 📋 목차

- [프로젝트 소개](#-프로젝트-소개)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [시스템 아키텍처](#-시스템-아키텍처)
- [설치 및 실행](#-설치-및-실행)
- [환경 설정](#-환경-설정)
- [사용 방법](#-사용-방법)
- [API 문서](#-api-문서)
- [프로젝트 구조](#-프로젝트-구조)
- [개발 가이드](#-개발-가이드)
- [문제 해결](#-문제-해결)
- [기여 방법](#-기여-방법)
- [라이선스](#-라이선스)

## 🎯 프로젝트 소개

**훈민 AI**는 대한민국 군에서 사용하는 공식 문서 작성을 지원하는 AI 기반 웹 애플리케이션입니다. 군 문서 작성 규정을 준수하면서도 효율적인 문서 작성이 가능하도록 설계되었습니다.

### 핵심 가치
- **규정 준수**: 군 문서 작성 규정 자동 검증
- **효율성**: AI 기반 문서 작성 지원
- **보안성**: 문서 보안 등급 관리
- **협업**: 실시간 다중 사용자 편집

## ✨ 주요 기능

### 1. 📚 지식 라이브러리 (좌측 패널)
- **카테고리별 문서 관리**
  - 작전계획서
  - 상황보고서
  - 정보보고서
  - 행정문서
  - 기타문서
- **고급 검색 기능**
- **문서 미리보기**
- **HWP 파일 지원** (hwplib.js WASM)
- **보안 등급별 필터링**

### 2. 📝 문서 편집기 (중앙 패널)
- **리치 텍스트 에디터** (Tiptap 기반)
  - 다양한 글꼴 지원 (맑은 고딕, 바탕체, 돋움체, 굴림체)
  - 글자 크기 조절 (9pt ~ 72pt)
  - 텍스트 스타일링 (굵게, 기울임, 밑줄)
  - 문단 정렬 (왼쪽, 가운데, 오른쪽, 양쪽)
  - 목록 및 번호 매기기
  - 줄 간격 설정 (1.0 ~ 3.0)
- **보안 등급 설정**
  - 일반
  - III급 비밀 (대외비)
  - II급 비밀 (비밀)
  - I급 비밀 (극비)
- **자동 저장**
- **실시간 검증**

### 3. 🤖 AI 에이전트 (우측 패널)
- **자연어 대화 인터페이스**
- **문서 자동 수정**
  - 전체 교체
  - 부분 삽입
  - 내용 추가
  - 스타일 변경
- **실시간 문서 검증**
  - 규정 준수 검사
  - 오류/경고/제안 표시
  - 준수율 점수 (0-100)
- **WebSocket 실시간 연결**

### 4. 📁 파일 관리
- **드래그 앤 드롭 업로드**
- **진행률 표시**
- **MinIO 통합** (S3 호환)
- **대용량 파일 지원**

### 5. ⌨️ 키보드 단축키
- `Ctrl+S`: 문서 저장
- `Ctrl+Shift+V`: 문서 검증
- `F8`: 다음 오류로 이동
- `Shift+F8`: 이전 오류로 이동
- `Esc`: 검증 패널 닫기

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS + shadcn/ui
- **Editor**: Tiptap 2.0
- **State**: Zustand
- **API Client**: Fetch API + React Query

### Backend
- **Runtime**: Node.js 20
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js
- **File Storage**: MinIO (S3 Compatible)
- **Real-time**: WebSocket + Redis Pub/Sub

### AI Service
- **Framework**: FastAPI (Python)
- **WebSocket**: Python WebSockets
- **NLP**: Custom Military Document Analyzer

### DevOps
- **Container**: Docker
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions

## 🏗 시스템 아키텍처

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│   API Routes    │────▶│   PostgreSQL    │
│   (Frontend)    │     │   (Backend)     │     │   (Database)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                        
         │                       │                        
         ▼                       ▼                        
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   WebSocket     │────▶│  FastAPI (AI)   │     │     MinIO       │
│   Connection    │     │    Service      │     │  (File Storage) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 🚀 설치 및 실행

### 사전 요구사항
- Node.js 20.x 이상
- PostgreSQL 15.x 이상
- Python 3.11 이상 (AI 서비스)
- Docker & Docker Compose (선택사항)

### 1. 저장소 클론
```bash
git clone https://github.com/quentinjeon/hunminai.git
cd hunminai
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env.local` 파일 생성:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/hunmin"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false

# AI Service
NEXT_PUBLIC_AI_WEBSOCKET_URL=ws://localhost:8000/ws

# AI API Keys (택 1)
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_API_KEY=your-google-key
```

### 4. 데이터베이스 설정
```bash
# Prisma 마이그레이션
npx prisma migrate dev

# 시드 데이터 (선택사항)
npm run seed
```

### 5. AI 서비스 실행
```bash
cd ai-worker
pip install -r requirements.txt
python main.py
```

### 6. 개발 서버 실행
```bash
npm run dev
```

### 7. 프로덕션 빌드
```bash
npm run build
npm start
```

## ⚙️ 환경 설정

### MinIO 설정
1. MinIO 서버 실행
```bash
docker run -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"
```

2. 버킷 생성
- http://localhost:9001 접속
- `documents` 버킷 생성

### Redis 설정 (실시간 협업용)
```bash
docker run -p 6379:6379 redis:alpine
```

## 📖 사용 방법

### 1. 로그인
- 이메일/비밀번호로 로그인
- 보안 등급에 따른 접근 권한 부여

### 2. 문서 작성
1. **템플릿 선택**: 좌측 지식 라이브러리에서 참조 문서 선택
2. **내용 작성**: 중앙 편집기에서 문서 작성
3. **AI 지원**: 우측 패널에서 AI에게 도움 요청
4. **검증**: Ctrl+Shift+V로 규정 준수 검증
5. **저장**: Ctrl+S 또는 자동 저장

### 3. AI 활용 예시
- "작전계획서 제목 추천해줘"
- "문서 상단에 I급 비밀 표시 추가해줘"
- "이 문서를 군 규정에 맞게 수정해줘"
- "작전 개요 섹션 작성해줘"

## 📡 API 문서

### REST API

#### 문서 관리
```typescript
GET    /api/documents          // 문서 목록 조회
POST   /api/documents          // 새 문서 생성
GET    /api/documents/:id      // 문서 상세 조회
PUT    /api/documents/:id      // 문서 수정
DELETE /api/documents/:id      // 문서 삭제
```

#### 파일 관리
```typescript
POST   /api/files              // 파일 업로드
GET    /api/files/:id/download // 파일 다운로드
DELETE /api/files/:id          // 파일 삭제
```

#### AI 서비스
```typescript
POST   /api/ai/analyze         // 문서 분석
POST   /api/ai/validate        // 문서 검증
POST   /api/ai/chat           // AI 대화
```

### WebSocket API

#### 연결
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');
```

#### 메시지 타입
```typescript
// 문서 분석 요청
{
  type: 'analyze',
  content: string,
  security_level: string
}

// 채팅 메시지
{
  type: 'chat',
  message: string,
  document_content?: string,
  history?: Message[]
}

// 문서 업데이트 응답
{
  type: 'document_update',
  result: {
    action: 'replace' | 'insert' | 'append' | 'update_style',
    content?: string,
    position?: { start: number, end: number },
    style?: { securityLevel: string }
  }
}
```

## 📁 프로젝트 구조

```
hunminai/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   ├── login/             # 로그인 페이지
│   │   └── page.tsx           # 메인 페이지
│   ├── components/            # React 컴포넌트
│   │   ├── ui/               # UI 컴포넌트 (shadcn/ui)
│   │   ├── ai-agent.tsx      # AI 에이전트
│   │   ├── document-editor.tsx # 문서 편집기
│   │   └── knowledge-library.tsx # 지식 라이브러리
│   ├── lib/                   # 유틸리티 함수
│   │   ├── ai-websocket.ts   # WebSocket 연결
│   │   ├── store.ts          # Zustand 스토어
│   │   └── utils.ts          # 헬퍼 함수
│   └── types/                 # TypeScript 타입
├── prisma/
│   ├── schema.prisma          # 데이터베이스 스키마
│   └── migrations/            # 마이그레이션 파일
├── ai-worker/
│   ├── main.py               # FastAPI 서버
│   └── requirements.txt      # Python 의존성
├── public/                    # 정적 파일
├── .env.local                # 환경 변수
└── package.json              # 프로젝트 설정
```

## 🔧 개발 가이드

### 컴포넌트 개발
```typescript
// 새 컴포넌트 생성 예시
import { FC } from 'react'
import { cn } from '@/lib/utils'

interface MyComponentProps {
  className?: string
  // ... props
}

export const MyComponent: FC<MyComponentProps> = ({ className, ...props }) => {
  return (
    <div className={cn('default-classes', className)} {...props}>
      {/* 컴포넌트 내용 */}
    </div>
  )
}
```

### 상태 관리 (Zustand)
```typescript
// store 사용 예시
import { useDocumentStore } from '@/lib/store'

function MyComponent() {
  const { currentDocument, setContent } = useDocumentStore()
  
  const handleChange = (newContent: string) => {
    setContent(newContent)
  }
  
  return <div>{currentDocument.content}</div>
}
```

### AI 통신
```typescript
// WebSocket 사용 예시
import { useAIWebSocket } from '@/lib/ai-websocket'

function AIChat() {
  const { sendChatMessage, isConnected } = useAIWebSocket()
  
  const handleSend = (message: string) => {
    if (isConnected) {
      sendChatMessage(message, documentContent)
    }
  }
}
```

## 🐛 문제 해결

### 일반적인 문제

#### 1. 무한 루프 오류
- **증상**: Maximum update depth exceeded
- **해결**: 
  - React 18로 다운그레이드
  - useEffect 의존성 배열 확인
  - Zustand 액션 안정화

#### 2. Hydration 오류
- **증상**: Hydration failed
- **해결**:
  - 브라우저 확장 프로그램 비활성화
  - 클라이언트 전용 렌더링 사용
  - `suppressHydrationWarning` 추가

#### 3. WebSocket 연결 실패
- **증상**: AI 서비스 연결 안 됨
- **해결**:
  - AI 서버 실행 확인
  - 환경 변수 확인
  - 방화벽 설정 확인

### 디버깅 팁
```bash
# 로그 레벨 설정
export LOG_LEVEL=debug

# Prisma 쿼리 로깅
export DEBUG=prisma:query

# Next.js 디버깅
npm run dev -- --inspect
```

## 🤝 기여 방법

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 코딩 규칙
- ESLint 규칙 준수
- Prettier 포맷팅 적용
- TypeScript strict mode 사용
- 컴포넌트는 함수형으로 작성
- 커밋 메시지는 [Conventional Commits](https://www.conventionalcommits.org/) 따르기

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 👥 팀

- **개발자**: Quentin Jeon
- **이메일**: zerotoanother@gmail.com
- **GitHub**: [@quentinjeon](https://github.com/quentinjeon)

---

<p align="center">
  Made with ❤️ for the Korean Military
</p>

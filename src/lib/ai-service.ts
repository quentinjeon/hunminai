// AI 서비스를 위한 API 호출 함수들

// API 응답 타입 정의
interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// 문서 분석 응답 타입
export interface DocumentAnalysisResponse {
  analysis: string;
}

// 채팅 응답 타입
export interface ChatResponse {
  reply: string;
}

// 제안 응답 타입
export interface SuggestionsResponse {
  suggestions: string[];
}

// 유효성 검사 이슈 타입
export interface ValidationIssue {
  severity: "error" | "warning" | "info";
  message: string;
  position?: { line: number; column: number };
}

// 유효성 검사 응답 타입
export interface ValidationResponse {
  valid: boolean;
  issues: ValidationIssue[];
  suggestions: string[];
}

// 메시지 타입 정의
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// 문서 분석 API 호출
export async function analyzeDocument(content: string): Promise<ApiResponse<DocumentAnalysisResponse>> {
  try {
    const response = await fetch("/api/ai/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || "문서 분석 중 오류가 발생했습니다." };
    }

    return { data: data as DocumentAnalysisResponse };
  } catch (error) {
    console.error("문서 분석 API 오류:", error);
    return { error: "서버 연결 중 오류가 발생했습니다." };
  }
}

// 채팅 API 호출
export async function sendChatMessage(
  message: string,
  documentContent?: string,
  history?: Message[]
): Promise<ApiResponse<ChatResponse>> {
  try {
    // 히스토리 형식 변환
    const formattedHistory = history?.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        documentContent,
        history: formattedHistory,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || "메시지 전송 중 오류가 발생했습니다." };
    }

    return { data: data as ChatResponse };
  } catch (error) {
    console.error("채팅 API 오류:", error);
    return { error: "서버 연결 중 오류가 발생했습니다." };
  }
}

// 문서 유효성 검사 API 호출
export async function validateDocument(content: string): Promise<ApiResponse<ValidationResponse>> {
  try {
    const response = await fetch("/api/ai/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || "문서 유효성 검사 중 오류가 발생했습니다." };
    }

    return { data: data as ValidationResponse };
  } catch (error) {
    console.error("유효성 검사 API 오류:", error);
    return { error: "서버 연결 중 오류가 발생했습니다." };
  }
}

// 일반 AI 요청 API 호출
export async function sendAIRequest(
  content: string,
  action: "analyze" | "suggest" | "chat"
): Promise<ApiResponse<any>> {
  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content, action }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || "AI 요청 중 오류가 발생했습니다." };
    }

    return { data };
  } catch (error) {
    console.error("AI API 오류:", error);
    return { error: "서버 연결 중 오류가 발생했습니다." };
  }
}

// 문서 제안 API 호출
export async function getSuggestions(content: string): Promise<ApiResponse<SuggestionsResponse>> {
  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content, action: "suggest" }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || "제안 요청 중 오류가 발생했습니다." };
    }

    return { data: data as SuggestionsResponse };
  } catch (error) {
    console.error("제안 API 오류:", error);
    return { error: "서버 연결 중 오류가 발생했습니다." };
  }
} 
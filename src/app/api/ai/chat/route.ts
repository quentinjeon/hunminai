import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
    }
    
    const { message, documentContent, history } = await request.json();
    
    if (!message) {
      return NextResponse.json({ error: "메시지가 제공되지 않았습니다." }, { status: 400 });
    }
    
    // 채팅 응답 생성 (실제로는 FastAPI 서비스 호출)
    const reply = generateChatResponse(message, documentContent, history);
    
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("채팅 처리 오류:", error);
    return NextResponse.json(
      { error: "채팅 요청 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 채팅 응답 생성 함수 (모의 구현)
function generateChatResponse(
  message: string,
  documentContent?: string,
  history?: Array<{ role: string; content: string }>
): string {
  // 히스토리가 있으면 컨텍스트를 유지
  const hasHistory = history && history.length > 0;
  
  // 키워드 기반 응답 (실제로는 AI 모델 사용)
  // 문서 내용이 있는 경우
  if (documentContent) {
    // 작전계획 관련 키워드
    if (message.includes("작전계획") || message.includes("계획서")) {
      return "작전계획을 작성하는 데 도움이 필요하신가요? 작전계획에는 목적, 배경, 임무, 실행, 지원, 지휘 및 통신 등의 섹션이 포함되어야 합니다.";
    }
    
    // 제목 관련 키워드
    if (message.includes("제목") || message.includes("타이틀") || message.includes("이름")) {
      return "문서 제목으로 '23-2 분기 작전계획' 또는 '2023년도 2분기 전술 운용 계획'은 어떨까요? 두 제목 모두 명확하고 간결합니다.";
    }
    
    // 보안 관련 키워드
    if (message.includes("보안") || message.includes("비밀") || message.includes("기밀")) {
      return "문서의 보안 등급을 변경하거나 추가하시겠습니까? 일반적으로 군사 문서의 보안 등급은 '일반', '대외비', 'II급비밀', 'I급비밀' 중 하나를 사용합니다.";
    }
    
    // 추가 관련 키워드
    if (message.includes("추가") || message.includes("삽입") || message.includes("넣어")) {
      return "요청하신 내용을 문서에 추가하겠습니다. 문서의 어느 부분에 추가하시겠습니까? 상단, 중간, 또는 하단에 추가할 수 있습니다.";
    }
    
    // 삭제 관련 키워드
    if (message.includes("삭제") || message.includes("제거") || message.includes("없애")) {
      return "문서에서 특정 내용을 삭제하시겠습니까? 어떤 부분을 삭제하시겠습니까?";
    }
    
    // 날짜 관련 키워드
    if (message.includes("날짜") || message.includes("일자") || message.includes("기간")) {
      return "문서에 날짜를 추가하거나 수정하시겠습니까? 군사 문서에서는 'YYYY-MM-DD' 형식의 날짜 표기를 권장합니다.";
    }
  }
  
  // 일반적인 도움말 요청
  if (message.includes("도움") || message.includes("help") || message.includes("어떻게")) {
    return "안녕하세요! 훈민 AI 입니다. 문서 작성, 편집, 분석에 도움을 드릴 수 있습니다. 특정 작업이 필요하시면 알려주세요.";
  }
  
  // 인사말
  if (message.includes("안녕") || message.includes("반가") || message.includes("hello")) {
    return "안녕하세요! 훈민 AI 어시스턴트입니다. 어떻게 도와드릴까요?";
  }
  
  // 정보 요청
  if (message.includes("정보") || message.includes("알려줘") || message.includes("뭐야")) {
    return "훈민 AI는 군사 문서 작성과 편집을 돕는 인공지능 어시스턴트입니다. 보안 등급, 형식, 군사 용어 등에 대한 지원을 제공합니다.";
  }
  
  // 기본 응답
  return `요청하신 "${message}"에 대한 답변을 준비 중입니다. 더 구체적인 내용이 필요하시면 알려주세요.`;
} 
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

// 문서 분석 요청 처리
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
    }
    
    const { content, action } = await request.json();
    
    if (!content) {
      return NextResponse.json({ error: "문서 내용이 제공되지 않았습니다." }, { status: 400 });
    }
    
    // 작업 유형에 따라 다른 응답 생성
    if (action === "analyze") {
      // 문서 분석 모의 응답
      return NextResponse.json({
        analysis: "문서를 분석했습니다. 다음과 같은 개선점이 있습니다:\n1. 문서 제목이 명확하지 않습니다.\n2. 보안 등급 표시가 필요합니다.\n3. 날짜 형식이 표준화되지 않았습니다."
      });
    } else if (action === "suggest") {
      // 제안 모의 응답
      return NextResponse.json({
        suggestions: [
          "문서 제목을 '23-2 분기 작전계획'으로 변경하세요.",
          "문서 상단에 보안 등급을 추가하세요.",
          "모든 날짜를 'YYYY-MM-DD' 형식으로 통일하세요."
        ]
      });
    } else {
      // 기본 응답: 채팅 응답
      return NextResponse.json({
        reply: `AI 응답: "${content}" 관련 질문에 대한 답변입니다. 요청하신 내용을 문서에 적용하시겠습니까?`
      });
    }
  } catch (error) {
    console.error("AI 처리 오류:", error);
    return NextResponse.json(
      { error: "AI 요청 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 채팅 API 엔드포인트
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
    }
    
    const { message, documentContent, history } = await request.json();
    
    if (!message) {
      return NextResponse.json({ error: "메시지가 제공되지 않았습니다." }, { status: 400 });
    }
    
    // 채팅 응답 생성 (실제로는 AI 모델 호출)
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
  // 문서 내용이 있는 경우 관련 응답 생성
  if (documentContent) {
    if (message.includes("제목") || message.includes("타이틀")) {
      return "문서 제목으로 '23-2 분기 작전계획' 또는 '2023년도 2분기 전술 운용 계획'은 어떨까요?";
    }
    
    if (message.includes("보안") || message.includes("비밀")) {
      return "보안 등급을 변경하거나 추가할까요? 현재 II급비밀로 설정되어 있습니다.";
    }
    
    if (message.includes("추가") || message.includes("삽입")) {
      return "요청하신 내용을 문서에 추가하겠습니다. 적용하시겠습니까?";
    }
  }
  
  // 기본 응답
  return `요청하신 "${message}"에 대한 응답입니다. 추가 도움이 필요하시면 알려주세요.`;
} 
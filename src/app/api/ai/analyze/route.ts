import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
    }
    
    const { content } = await request.json();
    
    if (!content) {
      return NextResponse.json({ error: "문서 내용이 제공되지 않았습니다." }, { status: 400 });
    }
    
    // 문서 분석 모의 응답 (실제로는 FastAPI 서비스 호출)
    const analysis = analyzeDocument(content);
    
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("문서 분석 오류:", error);
    return NextResponse.json(
      { error: "문서 분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 문서 분석 함수 (모의 구현)
function analyzeDocument(content: string): string {
  // 내용 길이 체크
  const contentLength = content.length;
  let analysis = "";
  
  if (contentLength < 100) {
    analysis += "문서 내용이 너무 짧습니다. 더 자세한 내용을 추가하는 것이 좋습니다.\n";
  }
  
  // 문서 구조 분석
  if (!content.includes("제목") && !content.includes("title")) {
    analysis += "문서에 명확한 제목이 없습니다. 상단에 제목을 추가하세요.\n";
  }
  
  // 보안 등급 확인
  if (!content.includes("비밀") && 
      !content.includes("대외비") && 
      !content.includes("I급") && 
      !content.includes("II급")) {
    analysis += "보안 등급이 명시되어 있지 않습니다. 문서 상단에 보안 등급을 추가하세요.\n";
  }
  
  // 날짜 형식 확인
  const datePattern = /\d{4}[-/\.]\d{2}[-/\.]\d{2}/;
  if (!datePattern.test(content)) {
    analysis += "표준 날짜 형식(YYYY-MM-DD)이 사용되지 않았습니다.\n";
  }
  
  // 군사 용어 검사
  const militaryTerms = ["작전", "전술", "부대", "지휘", "전투"];
  let missingTerms = militaryTerms.filter(term => !content.includes(term));
  
  if (missingTerms.length > 0) {
    analysis += `다음 군사 용어가 누락되었습니다: ${missingTerms.join(", ")}\n`;
  }
  
  // 기본 분석 결과 제공
  if (analysis === "") {
    return "문서가 기본 요구사항을 충족합니다. 추가 개선을 위한 제안:\n1. 핵심 정보를 굵게 표시하세요.\n2. 필요한 경우 절 번호를 추가하세요.\n3. 출처와 참조를 명확히 기재하세요.";
  }
  
  return analysis + "\n개선을 위한 제안:\n1. 문서 템플릿을 사용하세요.\n2. 각 섹션에 제목을 추가하세요.\n3. 문서 마지막에 작성자 정보를 포함하세요.";
} 
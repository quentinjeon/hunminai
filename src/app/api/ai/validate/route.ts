import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

// 검사 결과 타입 정의
interface ValidationIssue {
  severity: "error" | "warning" | "info";
  message: string;
  position?: { line: number; column: number };
}

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
    
    // 문서 유효성 검사 수행 (모의 구현)
    const validationResult = validateDocument(content);
    
    return NextResponse.json(validationResult);
  } catch (error) {
    console.error("문서 검증 오류:", error);
    return NextResponse.json(
      { error: "문서 검증 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 문서 유효성 검사 함수 (모의 구현)
function validateDocument(content: string) {
  const lines = content.split("\n");
  const issues: ValidationIssue[] = [];
  const suggestions: string[] = [];
  
  // 1. 문서 길이 검사
  if (content.length < 100) {
    issues.push({
      severity: "warning",
      message: "문서 내용이 너무 짧습니다. 최소 100자 이상이 권장됩니다."
    });
  }
  
  // 2. 제목 검사
  if (!content.includes("제목:") && !content.includes("Title:")) {
    issues.push({
      severity: "error",
      message: "문서에 제목이 없습니다. '제목:' 또는 'Title:' 형식으로 제목을 추가하세요.",
      position: { line: 1, column: 1 }
    });
    
    suggestions.push("문서 첫 줄에 '제목: [문서 제목]' 형식으로 제목을 추가하세요.");
  }
  
  // 3. 날짜 형식 검사
  const datePattern = /\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])/;
  let hasValidDate = false;
  
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    if (datePattern.test(lines[i])) {
      hasValidDate = true;
      break;
    }
  }
  
  if (!hasValidDate) {
    issues.push({
      severity: "warning",
      message: "문서 상단에 표준 날짜 형식(YYYY-MM-DD)이 없습니다.",
      position: { line: 1, column: 1 }
    });
    
    suggestions.push("문서 상단에 '날짜: YYYY-MM-DD' 형식으로 날짜를 추가하세요.");
  }
  
  // 4. 보안 등급 검사
  const securityPattern = /(일반|대외비|II급비밀|I급비밀)/;
  let hasSecurityLevel = false;
  
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    if (securityPattern.test(lines[i])) {
      hasSecurityLevel = true;
      break;
    }
  }
  
  if (!hasSecurityLevel) {
    issues.push({
      severity: "error",
      message: "문서 상단에 보안 등급이 명시되어 있지 않습니다.",
      position: { line: 1, column: 1 }
    });
    
    suggestions.push("문서 상단에 '보안등급: [일반/대외비/II급비밀/I급비밀]' 형식으로 보안 등급을 명시하세요.");
  }
  
  // 5. 군사 용어 검사
  const militaryTerms = ["작전", "전술", "부대", "지휘", "전투"];
  const missingTerms = militaryTerms.filter(term => !content.includes(term));
  
  if (missingTerms.length > 0) {
    issues.push({
      severity: "info",
      message: `다음 군사 용어가 문서에 사용되지 않았습니다: ${missingTerms.join(", ")}`
    });
    
    suggestions.push("문서 내용에 표준 군사 용어를 적절히 사용하세요.");
  }
  
  // 6. 문단 구조 검사
  if (!content.includes("\n\n")) {
    issues.push({
      severity: "warning",
      message: "문서에 문단 구분이 없습니다. 가독성을 위해 문단을 나누세요."
    });
    
    suggestions.push("내용을 논리적 섹션으로 나누고 빈 줄로 문단을 구분하세요.");
  }
  
  // 7. 리스트 사용 확인
  if (!content.includes("1.") && !content.includes("•")) {
    issues.push({
      severity: "info",
      message: "문서에 번호 매기기나 글머리 기호가 사용되지 않았습니다. 구조화된 콘텐츠를 위해 리스트 형식 사용을 고려하세요."
    });
    
    suggestions.push("순차적인 내용은 번호 매기기(1, 2, 3)를, 관련 항목은 글머리 기호(•)를 사용하세요.");
  }
  
  // 8. 오타 및 문법 검사 (간단한 예시)
  if (content.includes("이다.") || content.includes("한다.")) {
    issues.push({
      severity: "info",
      message: "군사 문서에서는 '이다', '한다' 등의 종결어미보다 '임', '함' 등의 명사형 종결어미가 선호됩니다."
    });
    
    suggestions.push("문장 종결 시 '이다', '한다' 대신 '임', '함'과 같은 명사형 종결어미를 사용하세요.");
  }
  
  // 기본 제안 추가
  if (suggestions.length === 0) {
    suggestions.push("문서 구조를 명확히 하기 위해 제목, 날짜, 작성자, 수신자 정보를 문서 상단에 포함하세요.");
    suggestions.push("중요한 정보는 굵게 표시하거나 밑줄을 사용하여 강조하세요.");
    suggestions.push("문서의 목적과 배경을 서두에 명확히 서술하세요.");
  }
  
  // 유효성 검사 결과 반환
  return {
    valid: issues.filter(issue => issue.severity === "error").length === 0,
    issues,
    suggestions
  };
}
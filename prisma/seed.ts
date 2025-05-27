const { PrismaClient } = require('../src/generated/prisma');
const { hash } = require('bcrypt');

const prisma = new PrismaClient();

// SecurityClearance 타입 정의
type SecurityClearance = 'NORMAL' | 'CONFIDENTIAL' | 'SECRET_II' | 'SECRET_I';
type SecurityLevel = 'NORMAL' | 'CONFIDENTIAL' | 'SECRET_II' | 'SECRET_I';

async function main() {
  try {
    console.log('시드 데이터 생성 시작...');

    // 기존 사용자 확인
    const existingUser = await prisma.user.findUnique({
      where: { username: 'admin' }
    });
    
    console.log('기존 사용자 확인:', existingUser ? '있음' : '없음');

    // 관리자 계정 생성
    const rawPassword = 'admin1234';
    console.log('비밀번호 해싱 시작:', { rawLength: rawPassword.length });
    
    const hashedPassword = await hash(rawPassword, 10);
    console.log('비밀번호 해싱 완료:', { hashedLength: hashedPassword.length });

    const admin = existingUser || await prisma.user.create({
      data: {
        username: 'admin',
        name: '관리자',
        email: 'admin@example.com',
        password: hashedPassword,
        securityClearance: 'SECRET_I'
      }
    });
    
    console.log('관리자 계정 생성/확인 완료:', {
      id: admin.id,
      username: admin.username,
      name: admin.name,
      securityClearance: admin.securityClearance
    });

    // 테스트용 문서 생성
    const existingDoc = await prisma.document.findFirst();
    if (!existingDoc) {
      await prisma.document.create({
        data: {
          title: '2023년도 작전계획',
          content: '# 작전 계획\n\n이 문서는 2023년도 작전 계획을 포함합니다.\n\n## 주요 임무\n- 정찰\n- 지원\n- 방어',
          authorId: admin.id,
          security: 'SECRET_II'
        }
      });
      console.log('테스트 문서 생성 완료');
    }

    console.log('시드 데이터 생성 완료!');
  } catch (error) {
    console.error('시드 데이터 생성 중 오류 발생:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
main(); 

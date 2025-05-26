import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth-options';

// 다른 파일에서 authOptions를 가져올 수 있도록 명시적으로 export
export { authOptions };

// NextAuth 핸들러 생성 및 내보내기
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 
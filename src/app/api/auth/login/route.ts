import { NextRequest, NextResponse } from 'next/server';
import { AUTH_USERNAME, AUTH_PASSWORD, createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน' },
        { status: 400 }
      );
    }

    const trimmedUser = String(username).trim();
    const trimmedPass = String(password).trim();

    if (trimmedUser !== AUTH_USERNAME || trimmedPass !== AUTH_PASSWORD) {
      return NextResponse.json(
        { success: false, error: 'รหัสผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง (เฉพาะบัญชีที่ได้รับอนุญาตเท่านั้น)' },
        { status: 401 }
      );
    }

    // Credentials valid -> create session token
    const token = await createSessionToken(trimmedUser);

    const response = NextResponse.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      user: {
        username: trimmedUser,
        name: `ผู้ดูแลระบบ (${trimmedUser})`,
        role: 'admin',
      },
    });

    // Set HTTP-Only Cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' },
      { status: 500 }
    );
  }
}

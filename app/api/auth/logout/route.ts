import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Create a response with the JSON data
    const response = NextResponse.json(
      { success: true, message: 'Logout berhasil' },
      { status: 200 }
    );

    // Clear the token cookie
    response.cookies.set({
      name: 'token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(0) // Set to past date to delete the cookie
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Gagal logout. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

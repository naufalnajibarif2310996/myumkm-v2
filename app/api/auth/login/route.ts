// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import * as bcrypt from 'bcryptjs';
import * as jose from "jose";
import prisma from "@/lib/prisma";

// Helper untuk response error
const errorResponse = (message: string, status = 400) =>
  NextResponse.json({ success: false, message }, { status });

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return errorResponse("Email dan password harus diisi");
    }

    // Cari user di database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, name: true, email: true, password: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return errorResponse("Email atau password salah", 401);
    }

    // Generate JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const token = await new jose.SignJWT({
      userId: user.id,
      email: user.email,
      name: user.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer('my-umkm')
      .setAudience('user')
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(secret);

    // Buat response JSON + set cookie
    const response = NextResponse.json({
      success: true,
      token, // Include token in response
      user: { id: user.id, name: user.name, email: user.email },
    });

    // Set HTTP-only cookie with extended options
    const isProduction = process.env.NODE_ENV === "production";
    const expires = new Date();
    expires.setDate(expires.getDate() + 30); // 30 days

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "lax" : "lax",
      path: "/",
      expires: expires,
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    });

    // Set additional cookie attributes for better compatibility
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('Pragma', 'no-cache');

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse(
      "Terjadi kesalahan. Silakan coba lagi nanti.",
      500
    );
  }
}

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { customAlphabet } from 'nanoid';
import { z } from 'zod';
import prisma from "@/lib/prisma";

// Simple error response helper
const errorResponse = (message: string, status = 400) => 
  NextResponse.json({ error: message }, { status });

// Initialize nanoid for user ID generation
const nanoid = customAlphabet('1234567890abcdef', 12);

// Validation schema
const registerSchema = z.object({
  name: z.string()
    .min(3, 'Nama minimal 3 karakter')
    .max(100, 'Nama maksimal 100 karakter'),
  email: z.string()
    .email('Format email tidak valid')
    .transform(email => email.toLowerCase().trim()),
  password: z.string()
    .min(6, 'Password minimal 6 karakter')
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(
        validation.error.errors[0]?.message || 'Data tidak valid',
        400
      );
    }

    const { name, email, password } = validation.data;

    // Check if user exists (double-check in case of race condition)
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existingUser) {
      return errorResponse(
        'Email sudah terdaftar. Silakan gunakan email lain.',
        409
      );
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = `user_${nanoid()}`;

    const newUser = await prisma.user.create({
      data: {
        id: userId,
        name: name.trim(),
        email,
        password: hashedPassword,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Registrasi berhasil. Silakan login untuk melanjutkan.',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name
      }
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Registration error:', error);
    
    // Handle Prisma unique constraint violation
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return errorResponse(
        'Email sudah terdaftar. Silakan gunakan email lain.',
        409
      );
    }
    
    return errorResponse(
      'Terjadi kesalahan. Silakan coba lagi nanti.',
      500
    );
  } finally {
    await prisma.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET /api/profiles - Get all public profiles
export async function GET() {
  try {
    const profiles = await prisma.businessprofile.findMany({
      select: {
        id: true,
        businessName: true,
        description: true,
        category: true,
        location: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const response = NextResponse.json(profiles);
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return response;
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profiles' },
      { status: 500 }
    );
  }
}

// POST /api/profiles - Create a new business profile
export async function POST(request: Request) {
  try {
    // Get the token from the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyToken(token);
    
    if (!decoded?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const data = await request.json();
    
    // Check if user already has a business profile
    const existingProfile = await prisma.businessprofile.findUnique({
      where: { userId: decoded.userId },
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Business profile already exists' },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ['businessName', 'category'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Create new business profile with all required fields
    const profile = await prisma.businessprofile.create({
      data: {
        id: crypto.randomUUID(),
        businessName: data.businessName,
        description: data.description || null,
        category: data.category,
        location: data.location || null,
        userId: decoded.userId,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    console.error('Error creating profile:', error);
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    );
  }
}

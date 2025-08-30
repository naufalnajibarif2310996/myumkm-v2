import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Helper function to verify the token and get the user ID
async function getUserIdFromToken(request: Request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return { error: 'Unauthorized - No token provided', status: 401 };
  }

  // Verify the JWT token
  const decoded = await verifyToken(token);
  
  if (!decoded || !decoded.userId) {
    return { error: 'Unauthorized - Invalid token', status: 401 };
  }

  return { userId: decoded.userId };
}

// GET /api/profile - Get current user's profile
export async function GET(request: Request) {
  try {
    const { userId, error, status } = await getUserIdFromToken(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    // Get the current user with their business profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        businessprofile: {
          include: {
            marketplacelisting: {
              select: {
                id: true,
                title: true,
                description: true,
                price: true,
                category: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!user?.businessprofile) {
      return NextResponse.json(
        { 
          error: 'Business profile not found',
          
        },
        { status: 404 }
      );
    }

    // Transform the data to match the expected interface
    const profile = {
      id: user.businessprofile.id,
      businessName: user.businessprofile.businessName,
      description: user.businessprofile.description || '',
      category: user.businessprofile.category,
      location: user.businessprofile.location || 'Lokasi belum diisi',
      marketplacelisting: user.businessprofile.marketplacelisting.map(item => ({
        ...item,
        price: typeof item.price === 'bigint' ? Number(item.price) : item.price,
        createdAt: new Date(item.createdAt).toISOString(),
      })),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
    };

    const response = NextResponse.json(profile);
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=300');
    return response;

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// POST /api/profile - Create or update user's business profile
export async function POST(request: Request) {
  try {
    // Verify authentication and get user ID
    const { userId, error, status } = await getUserIdFromToken(request);
    if (error) {
      console.error('Authentication error:', error);
      return NextResponse.json({ error }, { status });
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('Invalid JSON in request body');
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { businessName, description, category, location } = body;
    
    // Validate required fields
    const missingFields = [];
    if (!businessName) missingFields.push('businessName');
    if (!category) missingFields.push('category');
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          missingFields,
          message: 'Nama bisnis dan kategori harus diisi'
        },
        { status: 400 }
      );
    }

    // Check if user already has a profile
    const existingProfile = await prisma.businessprofile.findUnique({
      where: { userId }
    });

    let result;
    
    if (existingProfile) {
      // Update existing profile
      result = await prisma.businessprofile.update({
        where: { id: existingProfile.id },
        data: {
          businessName: businessName.trim(),
          description: description ? description.trim() : null,
          category: category.trim(),
          location: location ? location.trim() : null,
          updatedAt: new Date()
        },
        include: {
          marketplacelisting: true
        }
      });
    } else {
      // Create new profile with proper type assertion
      result = await prisma.businessprofile.create({
        data: {
          id: crypto.randomUUID(),
          businessName: businessName.trim(),
          description: description ? description.trim() : null,
          category: category.trim(),
          location: location ? location.trim() : null,
          userId: userId as string, // Assert userId as string since we've already validated it
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          marketplacelisting: true
        }
      });
    }

    // Return the created/updated profile
    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        businessName: result.businessName,
        description: result.description,
        category: result.category,
        location: result.location,
        userId: result.userId,
        marketplacelisting: result.marketplacelisting || []
      }
    });

  } catch (error: unknown) {
    console.error('Error in profile API:', error);
    
    // Define error message variable
    let errorMessage = 'An unknown error occurred';
    
    // Check if it's a Prisma error
    if (error && typeof error === 'object' && 'code' in error) {
      // Handle specific Prisma errors
      if (error.code === 'P2002') { // Unique constraint violation
        return NextResponse.json(
          { 
            error: 'Validation error',
            message: 'A profile with these details already exists',
            code: 'DUPLICATE_PROFILE'
          },
          { status: 409 }
        );
      }
      
      // Get error message if it exists
      if ('message' in error && typeof error.message === 'string') {
        errorMessage = error.message;
      }
    }
    
    // Handle other errors
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Gagal menyimpan profil. Silakan coba lagi nanti.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

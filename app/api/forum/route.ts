import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import * as jose from 'jose';

const prisma = new PrismaClient();

// GET all forum posts
export async function GET() {
  try {
    const posts = await prisma.forumpost.findMany({
      include: {
        businessprofile: {
          select: {
            businessName: true,
            category: true,
            location: true,
            user: {
              select: {
                name: true
              }
            }
          },
        },
        forumcomment: {
          select: {
            id: true
          }
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    // Transform data to match frontend expectations
    const transformedPosts = posts.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
      author: {
        businessName: post.businessprofile.businessName,
        category: post.businessprofile.category,
        location: post.businessprofile.location,
        userName: post.businessprofile.user.name
      },
      _count: {
        comments: post.forumcomment.length
      }
    }));
    
    return NextResponse.json(transformedPosts);
  } catch (error) {
    console.error("Failed to fetch forum posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch forum posts" },
      { status: 500 }
    );
  }
}

// POST a new forum post
export async function POST(request: NextRequest) {
  try {
    // Debug: Log all cookies
    console.log('Request cookies:', request.cookies.getAll());
    
    const token = request.cookies.get('token')?.value;
    console.log('Extracted token:', token ? 'Token exists' : 'No token found');
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated - No token found' }, { status: 401 });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set in environment variables');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Verify JWT token
    let currentUserId: string;
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jose.jwtVerify(token, secret);
      
      if (!payload.userId) {
        console.error('Token payload is missing userId');
        return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
      }
      
      currentUserId = payload.userId as string;
      console.log('Authenticated user ID:', currentUserId);
    } catch (error: any) {
      console.error('JWT verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid or expired token. Please log in again.' },
        { status: 401 }
      );
    }

    // Parse request body
    let title: string, content: string;
    try {
      const body = await request.json();
      title = body.title;
      content = body.content;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Get user's business profile
    const businessProfile = await prisma.businessprofile.findUnique({
      where: { userId: currentUserId }
    });

    if (!businessProfile) {
      return NextResponse.json({ 
        error: 'Business profile not found. Please create a business profile first.' 
      }, { status: 400 });
    }

    // Generate a unique ID for the new post
    const postId = `fp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create the forum post
    try {
      const newPost = await prisma.forumpost.create({
        data: {
          id: postId,
          title: title.trim(),
          content: content.trim(),
          authorId: businessProfile.id,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          businessprofile: {
            select: {
              businessName: true,
              category: true,
              location: true
            }
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Post created successfully',
        data: newPost
      }, { status: 201 });

    } catch (error: any) {
      console.error('Failed to create forum post:', error);
      
      // Handle database errors
      if (error.code === 'P2002') { // Unique constraint violation
        return NextResponse.json(
          { error: 'A post with this title already exists' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to create post',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in forum post handler:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

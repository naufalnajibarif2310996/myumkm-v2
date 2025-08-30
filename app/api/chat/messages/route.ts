import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { protectApiRoute } from '@/lib/auth';

export async function POST(request: NextRequest) {
  console.log('=== NEW MESSAGE REQUEST ===');
  console.log('Request URL:', request.url);
  
  try {
    console.log('Authenticating request...');
    const auth = await protectApiRoute(request);
    if (auth instanceof Response) {
      console.log('Authentication failed:', auth.status, auth.statusText);
      return auth; // Return the error response
    }
    const { user } = auth;
    console.log('Authenticated user:', { userId: user.userId });

    const requestBody = await request.json();
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const { content, conversationId, recipientId } = requestBody;

    if (!content) {
      console.error('Validation error: Content is required');
      return new NextResponse(JSON.stringify({ error: 'Content is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!conversationId && !recipientId) {
      console.error('Validation error: Either conversationId or recipientId is required');
      return new NextResponse(
        JSON.stringify({ error: 'Either conversationId or recipientId is required' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    let conversation;
    
    try {
      // If we have a conversationId, try to find the conversation
      if (conversationId) {
        conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { users: true }
        });
        
        if (!conversation) {
          return new NextResponse(
            JSON.stringify({ error: 'Conversation not found' }), 
            { 
              status: 404,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      } 
      // If no conversationId, we need to create a new conversation
      else if (recipientId) {
        // Check if recipient exists
        const recipient = await prisma.user.findUnique({
          where: { id: recipientId }
        });

        if (!recipient) {
          return new NextResponse(
            JSON.stringify({ error: 'Recipient not found' }), 
            { 
              status: 404,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }

        // Check if a conversation already exists between these users
        const existingConversation = await prisma.conversation.findFirst({
          where: {
            AND: [
              {
                users: {
                  every: {
                    id: {
                      in: [user.userId, recipientId]
                    }
                  }
                }
              },
              {
                users: {
                  some: {
                    id: user.userId
                  }
                }
              },
              {
                users: {
                  some: {
                    id: recipientId
                  }
                }
              }
            ]
          },
          include: {
            users: true
          }
        });

        if (existingConversation) {
          conversation = existingConversation;
        } else {
          // Create new conversation
          conversation = await prisma.conversation.create({
            data: {
              users: {
                connect: [
                  { id: user.userId },
                  { id: recipientId }
                ]
              }
            },
            include: { users: true }
          });
        }
      } else {
        return new NextResponse(
          JSON.stringify({ error: 'Either conversationId or recipientId is required' }), 
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    } catch (error) {
      console.error('Error in conversation handling:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Error processing conversation' }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!conversation) {
      return new NextResponse(
        JSON.stringify({ error: 'Conversation not found' }), 
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        content,
        conversationId: conversation.id,
        authorId: user.userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(message);
    
  } catch (error) {
    console.error('Error in POST /api/chat/messages:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'UnknownError',
      timestamp: new Date().toISOString()
    });
    
    // Return detailed error in development, generic in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorResponse = {
      error: 'Failed to send message',
      ...(isDevelopment ? {
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      } : {})
    };
    
    return new NextResponse(JSON.stringify(errorResponse), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await protectApiRoute(request);
    if (auth instanceof Response) {
      return auth; // Return the error response
    }
    const { user } = auth;

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    
    if (!conversationId) {
      return new NextResponse('Conversation ID is required', { status: 400 });
    }

    // Verify the user is part of the conversation
    const conversation = await prisma.conversation.findFirst({
      where: { 
        id: conversationId,
        users: {
          some: {
            id: user.userId
          }
        }
      },
      include: {
        messages: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!conversation) {
      return new NextResponse('Conversation not found', { status: 404 });
    }

    return NextResponse.json(conversation.messages);
    
  } catch (error) {
    console.error('Error fetching messages:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

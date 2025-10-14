/**
 * Chat Session Messages API Route
 *
 * Add and manage messages in a chat session
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import ChatSessionModel, { IMessage } from '@/lib/db/models/chat-session';

/**
 * POST /api/chat/sessions/[sessionId]/messages
 *
 * Add a message to a chat session
 *
 * Body:
 * {
 *   "id": "msg_123",
 *   "role": "user" | "assistant" | "system",
 *   "content": "Hello, world!",
 *   "toolCalls": [...] // Optional
 * }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    await connectToDatabase();

    const { sessionId } = params;
    const body = await req.json();
    const { id, role, content, toolCalls } = body;

    // Validate required fields
    if (!id || !role || !content) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          message: 'id, role, and content are required'
        },
        { status: 400 }
      );
    }

    // Validate role
    if (!['user', 'assistant', 'system'].includes(role)) {
      return NextResponse.json(
        {
          error: 'Invalid role',
          message: 'role must be user, assistant, or system'
        },
        { status: 400 }
      );
    }

    const session = await ChatSessionModel.findBySessionId(sessionId);

    if (!session) {
      return NextResponse.json(
        {
          error: 'Session not found',
          message: `No session found with ID: ${sessionId}`
        },
        { status: 404 }
      );
    }

    // Add message
    session.addMessage({
      id,
      role,
      content,
      toolCalls
    });

    // Auto-generate title from first user message if still default
    if (session.title === 'New Chat' && role === 'user') {
      session.title = session.generateTitle();
    }

    await session.save();

    return NextResponse.json({
      success: true,
      message: 'Message added successfully',
      metadata: session.metadata
    });
  } catch (error) {
    console.error('Add message error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

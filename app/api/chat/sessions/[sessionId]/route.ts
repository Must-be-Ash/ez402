/**
 * Individual Chat Session API Route
 *
 * Get and update specific chat sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import ChatSessionModel from '@/lib/db/models/chat-session';

/**
 * GET /api/chat/sessions/[sessionId]
 *
 * Get a specific chat session with all messages
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    await connectToDatabase();

    const { sessionId } = params;

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

    return NextResponse.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        title: session.title,
        messages: session.messages,
        metadata: session.metadata,
        isActive: session.isActive,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      }
    });
  } catch (error) {
    console.error('Get session error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/chat/sessions/[sessionId]
 *
 * Update session metadata (title, etc.)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    await connectToDatabase();

    const { sessionId } = params;
    const body = await req.json();
    const { title } = body;

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

    // Update title if provided
    if (title) {
      session.title = title;
    }

    await session.save();

    return NextResponse.json({
      success: true,
      message: 'Session updated successfully',
      session: {
        sessionId: session.sessionId,
        title: session.title,
        metadata: session.metadata,
        updatedAt: session.updatedAt
      }
    });
  } catch (error) {
    console.error('Update session error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

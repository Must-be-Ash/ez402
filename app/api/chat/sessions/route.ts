/**
 * Chat Sessions API Route
 *
 * Manage chat sessions and history
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import ChatSessionModel from '@/lib/db/models/chat-session';

/**
 * GET /api/chat/sessions
 *
 * Get all chat sessions
 *
 * Query params:
 * - userId: Filter by user ID (optional)
 * - limit: Maximum number of sessions (default: 20)
 */
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');

    let sessions;

    if (userId) {
      sessions = await ChatSessionModel.findActiveByUserId(userId, limit);
    } else {
      sessions = await ChatSessionModel.findRecent(limit);
    }

    return NextResponse.json({
      success: true,
      count: sessions.length,
      sessions: sessions.map(s => ({
        sessionId: s.sessionId,
        title: s.title,
        metadata: s.metadata,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt
      }))
    });
  } catch (error) {
    console.error('Get sessions error:', error);

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
 * POST /api/chat/sessions
 *
 * Create a new chat session
 *
 * Body:
 * {
 *   "sessionId": "optional-custom-id",
 *   "userId": "optional-user-id",
 *   "title": "New Chat"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const { sessionId, userId, title } = body;

    // Generate session ID if not provided
    const finalSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check if session already exists
    const existing = await ChatSessionModel.findBySessionId(finalSessionId);
    if (existing) {
      return NextResponse.json(
        {
          error: 'Session already exists',
          message: `A session with ID ${finalSessionId} already exists`
        },
        { status: 409 }
      );
    }

    // Create new session
    const session = await ChatSessionModel.create({
      sessionId: finalSessionId,
      userId: userId || undefined,
      title: title || 'New Chat',
      messages: [],
      metadata: {
        totalMessages: 0,
        totalCost: 0,
        lastMessageAt: new Date()
      },
      isActive: true
    });

    return NextResponse.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        title: session.title,
        metadata: session.metadata,
        createdAt: session.createdAt
      }
    });
  } catch (error) {
    console.error('Create session error:', error);

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
 * DELETE /api/chat/sessions
 *
 * Archive a chat session
 *
 * Query params:
 * - sessionId: Session ID to archive
 */
export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        {
          error: 'Missing sessionId',
          message: 'sessionId query parameter is required'
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

    session.archive();
    await session.save();

    return NextResponse.json({
      success: true,
      message: `Session ${sessionId} archived successfully`
    });
  } catch (error) {
    console.error('Archive session error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

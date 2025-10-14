/**
 * MCP Hot Reload API Route
 *
 * Triggers reload of MCP server tool definitions without full redeployment
 * POST /api/mcp/reload - Reload tools for a specific server
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { MCPGeneratorService } from '@/lib/services/mcp-generator';
import MCPConfigModel from '@/lib/db/models/mcp-config';

/**
 * In-memory cache for tool definitions
 * TTL: 5 minutes (300 seconds)
 */
interface ToolCache {
  tools: any[];
  timestamp: number;
  ttl: number;
}

const toolCache: Map<string, ToolCache> = new Map();
const DEFAULT_TTL = 300000; // 5 minutes in milliseconds

/**
 * POST /api/mcp/reload
 *
 * Reload tool definitions for MCP server
 *
 * Body:
 * {
 *   "serverId": "ez402-mcp-main",
 *   "clearCache": true  // Optional: force cache clear
 * }
 */
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const { serverId, clearCache } = body;

    // Validate serverId
    if (!serverId) {
      return NextResponse.json(
        {
          error: 'Missing serverId',
          message: 'serverId is required'
        },
        { status: 400 }
      );
    }

    // Check if server exists
    const config = await MCPConfigModel.findOne({ serverId });
    if (!config) {
      return NextResponse.json(
        {
          error: 'Server not found',
          message: `No MCP server found with serverId: ${serverId}`
        },
        { status: 404 }
      );
    }

    // Clear cache if requested
    if (clearCache) {
      toolCache.delete(serverId);
      console.log(`🗑️ Cache cleared for server: ${serverId}`);
    }

    // Generate fresh tool definitions
    const generator = new MCPGeneratorService();
    const tools = await generator.generateToolDefinitions();
    const toolIds = tools.map(t => t.name);

    // Update cache
    toolCache.set(serverId, {
      tools,
      timestamp: Date.now(),
      ttl: DEFAULT_TTL
    });

    // Update MCP config in MongoDB
    await MCPConfigModel.updateOne(
      { serverId },
      {
        registeredTools: toolIds,
        updatedAt: new Date()
      }
    );

    console.log(`🔄 Tools reloaded for server: ${serverId}`);
    console.log(`📋 Total tools: ${toolIds.length}`);

    return NextResponse.json({
      success: true,
      message: 'Tools reloaded successfully',
      serverId,
      toolCount: toolIds.length,
      tools: toolIds,
      cachedUntil: new Date(Date.now() + DEFAULT_TTL).toISOString()
    });
  } catch (error) {
    console.error('Reload error:', error);

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
 * GET /api/mcp/reload
 *
 * Get cached tool definitions
 *
 * Query params:
 * - serverId: Server ID (required)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const serverId = searchParams.get('serverId');

    if (!serverId) {
      return NextResponse.json(
        {
          error: 'Missing serverId',
          message: 'serverId query parameter is required'
        },
        { status: 400 }
      );
    }

    // Check cache
    const cached = toolCache.get(serverId);

    if (cached) {
      const age = Date.now() - cached.timestamp;
      const isExpired = age > cached.ttl;

      return NextResponse.json({
        success: true,
        cached: true,
        expired: isExpired,
        toolCount: cached.tools.length,
        tools: cached.tools.map(t => ({
          name: t.name,
          description: t.description
        })),
        cacheAge: Math.floor(age / 1000), // seconds
        cachedUntil: new Date(cached.timestamp + cached.ttl).toISOString()
      });
    }

    // No cache - generate fresh
    await connectToDatabase();

    const generator = new MCPGeneratorService();
    const tools = await generator.generateToolDefinitions();

    // Cache the result
    toolCache.set(serverId, {
      tools,
      timestamp: Date.now(),
      ttl: DEFAULT_TTL
    });

    return NextResponse.json({
      success: true,
      cached: false,
      toolCount: tools.length,
      tools: tools.map(t => ({
        name: t.name,
        description: t.description
      })),
      cachedUntil: new Date(Date.now() + DEFAULT_TTL).toISOString()
    });
  } catch (error) {
    console.error('Get cache error:', error);

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
 * DELETE /api/mcp/reload
 *
 * Clear cache for a server
 *
 * Query params:
 * - serverId: Server ID (required)
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const serverId = searchParams.get('serverId');

    if (!serverId) {
      return NextResponse.json(
        {
          error: 'Missing serverId',
          message: 'serverId query parameter is required'
        },
        { status: 400 }
      );
    }

    const hadCache = toolCache.has(serverId);
    toolCache.delete(serverId);

    return NextResponse.json({
      success: true,
      message: hadCache
        ? `Cache cleared for server: ${serverId}`
        : `No cache found for server: ${serverId}`,
      hadCache
    });
  } catch (error) {
    console.error('Clear cache error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

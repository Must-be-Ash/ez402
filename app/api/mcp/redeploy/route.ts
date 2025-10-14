/**
 * MCP Redeploy API Route
 *
 * Handles redeployment of existing MCP servers
 * POST /api/mcp/redeploy - Redeploy existing server
 */

import { NextRequest, NextResponse } from 'next/server';
import { MCPDeployerService } from '@/lib/services/mcp-deployer';
import { connectToDatabase } from '@/lib/db/connection';

/**
 * POST /api/mcp/redeploy
 *
 * Redeploy an existing MCP server
 *
 * Body:
 * {
 *   "serverId": "ez402-mcp-main"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const { serverId } = body;

    // Validate required fields
    if (!serverId) {
      return NextResponse.json(
        {
          error: 'Missing serverId',
          message: 'serverId is required'
        },
        { status: 400 }
      );
    }

    // Redeploy
    const deployer = new MCPDeployerService();
    const result = await deployer.redeploy(serverId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Redeployment successful',
        deploymentUrl: result.deploymentUrl,
        logs: result.logs
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          logs: result.logs
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Redeployment error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

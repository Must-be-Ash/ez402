/**
 * MCP Deployment API Route
 *
 * Handles deployment of MCP servers to cloud platforms
 * POST /api/mcp/deploy - Deploy or redeploy MCP server
 * GET /api/mcp/deploy - Get deployment status
 */

import { NextRequest, NextResponse } from 'next/server';
import { MCPDeployerService } from '@/lib/services/mcp-deployer';
import { connectToDatabase } from '@/lib/db/connection';

/**
 * POST /api/mcp/deploy
 *
 * Deploy MCP server to Cloudflare Workers or Google Cloud Run
 *
 * Body:
 * {
 *   "platform": "cloudflare" | "cloudrun",
 *   "serverId": "ez402-mcp-main",
 *   "serverName": "EZ402 MCP Server",
 *   "environment": "production" | "staging" | "development"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const { platform, serverId, serverName, environment } = body;

    // Validate required fields
    if (!platform || !serverId || !serverName) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          message: 'platform, serverId, and serverName are required'
        },
        { status: 400 }
      );
    }

    // Validate platform
    if (platform !== 'cloudflare' && platform !== 'cloudrun') {
      return NextResponse.json(
        {
          error: 'Invalid platform',
          message: 'platform must be either "cloudflare" or "cloudrun"'
        },
        { status: 400 }
      );
    }

    // Deploy
    const deployer = new MCPDeployerService();
    const result = await deployer.deploy({
      platform,
      serverId,
      serverName,
      environment: environment || 'production'
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Deployment successful',
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
    console.error('Deployment error:', error);

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
 * GET /api/mcp/deploy
 *
 * Get deployment status for a server
 *
 * Query params:
 * - serverId: Server ID to query (optional - returns all if not provided)
 */
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const serverId = searchParams.get('serverId');

    const deployer = new MCPDeployerService();

    if (serverId) {
      // Get specific deployment
      const config = await deployer.getDeploymentStatus(serverId);

      if (!config) {
        return NextResponse.json(
          {
            error: 'Not found',
            message: `No deployment found for serverId: ${serverId}`
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        deployment: {
          serverId: config.serverId,
          serverName: config.serverName,
          deploymentUrl: config.deploymentUrl,
          deploymentStatus: config.deploymentStatus,
          transportType: config.transportType,
          registeredTools: config.registeredTools,
          lastDeployedAt: config.lastDeployedAt,
          errorMessage: config.errorMessage,
          createdAt: config.createdAt,
          updatedAt: config.updatedAt
        }
      });
    } else {
      // Get all deployments
      const deployments = await deployer.getAllDeployments();

      return NextResponse.json({
        success: true,
        count: deployments.length,
        deployments: deployments.map(d => ({
          serverId: d.serverId,
          serverName: d.serverName,
          deploymentUrl: d.deploymentUrl,
          deploymentStatus: d.deploymentStatus,
          transportType: d.transportType,
          registeredTools: d.registeredTools,
          lastDeployedAt: d.lastDeployedAt,
          errorMessage: d.errorMessage,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt
        }))
      });
    }
  } catch (error) {
    console.error('Get deployment error:', error);

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
 * DELETE /api/mcp/deploy
 *
 * Delete a deployment
 *
 * Query params:
 * - serverId: Server ID to delete (required)
 */
export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();

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

    const deployer = new MCPDeployerService();
    const deleted = await deployer.deleteDeployment(serverId);

    if (deleted) {
      return NextResponse.json({
        success: true,
        message: `Deployment ${serverId} deleted successfully`
      });
    } else {
      return NextResponse.json(
        {
          error: 'Not found',
          message: `No deployment found for serverId: ${serverId}`
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Delete deployment error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

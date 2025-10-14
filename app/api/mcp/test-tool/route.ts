/**
 * MCP Tool Testing API Route
 *
 * Tests a tool configuration before registration
 * POST /api/mcp/test-tool - Test tool with provided parameters
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { MCPGeneratorService } from '@/lib/services/mcp-generator';
import { executeMCPTool } from '@/lib/mcp/tools';

/**
 * POST /api/mcp/test-tool
 *
 * Test a tool configuration before saving
 *
 * Body:
 * {
 *   "providerId": "weather-api",
 *   "parameters": {
 *     "city": "San Francisco"
 *   }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const { providerId, parameters = {} } = body;

    // Validate required fields
    if (!providerId) {
      return NextResponse.json(
        {
          error: 'Missing providerId',
          message: 'providerId is required'
        },
        { status: 400 }
      );
    }

    // Check if tool exists
    const generator = new MCPGeneratorService();
    const tool = await generator.generateToolForProvider(providerId);

    if (!tool) {
      return NextResponse.json(
        {
          error: 'Tool not found',
          message: `No tool found with providerId: ${providerId}`
        },
        { status: 404 }
      );
    }

    // Execute tool with test parameters
    const startTime = Date.now();
    const result = await executeMCPTool(providerId, parameters);
    const executionTime = Date.now() - startTime;

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Tool test successful',
        tool: {
          name: tool.name,
          description: tool.description,
          price: tool.metadata.price,
          httpMethod: tool.metadata.httpMethod
        },
        testResult: {
          success: true,
          data: result.data,
          metadata: result.metadata,
          executionTime: `${executionTime}ms`
        },
        recommendation: 'Tool is working correctly and ready to be used'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Tool test failed',
        tool: {
          name: tool.name,
          description: tool.description,
          price: tool.metadata.price,
          httpMethod: tool.metadata.httpMethod
        },
        testResult: {
          success: false,
          error: result.error,
          executionTime: `${executionTime}ms`
        },
        recommendation: 'Please check the endpoint configuration and try again'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Tool test error:', error);

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
 * GET /api/mcp/test-tool
 *
 * Get tool definition preview
 *
 * Query params:
 * - providerId: Provider ID (required)
 */
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json(
        {
          error: 'Missing providerId',
          message: 'providerId query parameter is required'
        },
        { status: 400 }
      );
    }

    // Get tool definition
    const generator = new MCPGeneratorService();
    const tool = await generator.generateToolForProvider(providerId);

    if (!tool) {
      return NextResponse.json(
        {
          error: 'Tool not found',
          message: `No tool found with providerId: ${providerId}`
        },
        { status: 404 }
      );
    }

    // Return tool preview
    return NextResponse.json({
      success: true,
      tool: {
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        metadata: {
          price: tool.metadata.price,
          httpMethod: tool.metadata.httpMethod,
          originalEndpoint: tool.metadata.originalEndpoint
        }
      },
      preview: {
        mcpDefinition: {
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        },
        usage: {
          description: 'This tool can be invoked by Claude in chat or via API',
          example: `const result = await executeMCPTool('${tool.name}', { /* parameters */ });`
        }
      }
    });
  } catch (error) {
    console.error('Get tool preview error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

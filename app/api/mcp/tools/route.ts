/**
 * MCP Tools Discovery API Route
 *
 * Returns list of all available MCP tools with schemas and metadata
 * GET /api/mcp/tools - List all tools
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { MCPGeneratorService, MCPToolDefinition } from '@/lib/services/mcp-generator';

/**
 * GET /api/mcp/tools
 *
 * Get all available MCP tools
 *
 * Query params:
 * - provider: Filter by provider ID (optional)
 * - category: Filter by category (optional)
 * - minPrice: Filter by minimum price (optional)
 * - maxPrice: Filter by maximum price (optional)
 * - includeSchema: Include full JSON schema (default: false)
 */
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const provider = searchParams.get('provider');
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const includeSchema = searchParams.get('includeSchema') === 'true';

    // Generate tool definitions
    const generator = new MCPGeneratorService();
    const tools = await generator.generateToolDefinitions();

    // Apply filters
    let filteredTools = tools;

    if (provider) {
      filteredTools = filteredTools.filter(t => t.name === provider);
    }

    if (minPrice) {
      const min = parseFloat(minPrice);
      filteredTools = filteredTools.filter(t => t.metadata.price >= min);
    }

    if (maxPrice) {
      const max = parseFloat(maxPrice);
      filteredTools = filteredTools.filter(t => t.metadata.price <= max);
    }

    // Format response
    const toolsResponse = filteredTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      price: tool.metadata.price,
      httpMethod: tool.metadata.httpMethod,
      endpoint: tool.metadata.originalEndpoint,
      ...(includeSchema && { inputSchema: tool.inputSchema }),
      metadata: {
        providerId: tool.name,
        price: tool.metadata.price,
        httpMethod: tool.metadata.httpMethod,
        originalEndpoint: tool.metadata.originalEndpoint
      }
    }));

    // Get statistics
    const stats = {
      totalTools: filteredTools.length,
      averagePrice: filteredTools.reduce((sum, t) => sum + t.metadata.price, 0) / filteredTools.length || 0,
      priceRange: {
        min: Math.min(...filteredTools.map(t => t.metadata.price)),
        max: Math.max(...filteredTools.map(t => t.metadata.price))
      },
      methodDistribution: filteredTools.reduce((acc, t) => {
        const method = t.metadata.httpMethod;
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return NextResponse.json({
      success: true,
      count: filteredTools.length,
      tools: toolsResponse,
      stats,
      filters: {
        provider: provider || null,
        category: category || null,
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null
      }
    });
  } catch (error) {
    console.error('Tools discovery error:', error);

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
 * POST /api/mcp/tools/search
 *
 * Advanced tool search with full-text search
 *
 * Body:
 * {
 *   "query": "weather API",
 *   "filters": {
 *     "maxPrice": 0.1,
 *     "httpMethod": "GET"
 *   },
 *   "limit": 10
 * }
 */
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const { query, filters = {}, limit = 50 } = body;

    // Get all tools
    const generator = new MCPGeneratorService();
    const allTools = await generator.generateToolDefinitions();

    let results = allTools;

    // Apply text search if query provided
    if (query && query.trim()) {
      const searchTerm = query.toLowerCase();
      results = results.filter(tool =>
        tool.name.toLowerCase().includes(searchTerm) ||
        tool.description.toLowerCase().includes(searchTerm) ||
        tool.metadata.originalEndpoint.toLowerCase().includes(searchTerm)
      );
    }

    // Apply filters
    if (filters.maxPrice !== undefined) {
      results = results.filter(t => t.metadata.price <= filters.maxPrice);
    }

    if (filters.minPrice !== undefined) {
      results = results.filter(t => t.metadata.price >= filters.minPrice);
    }

    if (filters.httpMethod) {
      results = results.filter(t => t.metadata.httpMethod === filters.httpMethod);
    }

    // Limit results
    results = results.slice(0, limit);

    // Format response with relevance scoring
    const toolsWithScores = results.map(tool => ({
      name: tool.name,
      description: tool.description,
      price: tool.metadata.price,
      httpMethod: tool.metadata.httpMethod,
      endpoint: tool.metadata.originalEndpoint,
      score: calculateRelevanceScore(tool, query) // Basic relevance scoring
    }));

    // Sort by relevance score
    toolsWithScores.sort((a, b) => b.score - a.score);

    // Remove score from final response
    const toolsResponse = toolsWithScores.map(({ score: _score, ...tool }) => tool);

    return NextResponse.json({
      success: true,
      query,
      count: results.length,
      tools: toolsResponse,
      filters
    });
  } catch (error) {
    console.error('Tools search error:', error);

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
 * Calculate basic relevance score for search results
 */
function calculateRelevanceScore(tool: MCPToolDefinition, query?: string): number {
  if (!query) return 1;

  const searchTerm = query.toLowerCase();
  let score = 0;

  // Exact name match: 10 points
  if (tool.name.toLowerCase() === searchTerm) score += 10;

  // Name contains query: 5 points
  if (tool.name.toLowerCase().includes(searchTerm)) score += 5;

  // Description contains query: 3 points
  if (tool.description.toLowerCase().includes(searchTerm)) score += 3;

  // Endpoint contains query: 1 point
  if (tool.metadata.originalEndpoint.toLowerCase().includes(searchTerm)) score += 1;

  return score;
}

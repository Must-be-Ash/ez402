/**
 * Cloudflare Worker - MCP Server Entry Point
 *
 * Deploys the dynamic MCP server to Cloudflare Workers
 * Handles HTTP requests and SSE streaming for MCP protocol
 */

import { DynamicMCPServer } from '../lib/mcp/server';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

/**
 * Cloudflare Worker Environment
 */
interface Env {
  MONGODB_URI: string;
  CDP_API_KEY: string;
  CDP_API_SECRET: string;
  ENCRYPTION_KEY: string;
  MCP_WALLET_PRIVATE_KEY: string;
  NEXT_PUBLIC_BASE_URL: string;
}

/**
 * Initialize MCP Server
 *
 * Creates a new server instance with MongoDB connection
 */
async function initializeMCPServer(env: Env): Promise<DynamicMCPServer> {
  // Set environment variables for the server
  process.env.MONGODB_URI = env.MONGODB_URI;
  process.env.CDP_API_KEY = env.CDP_API_KEY;
  process.env.CDP_API_SECRET = env.CDP_API_SECRET;
  process.env.ENCRYPTION_KEY = env.ENCRYPTION_KEY;
  process.env.MCP_WALLET_PRIVATE_KEY = env.MCP_WALLET_PRIVATE_KEY;
  process.env.NEXT_PUBLIC_BASE_URL = env.NEXT_PUBLIC_BASE_URL;

  const server = new DynamicMCPServer();
  await server.start();

  return server;
}

/**
 * Handle MCP HTTP Request
 *
 * Processes incoming MCP protocol requests over HTTP/SSE
 */
async function handleMCPRequest(
  request: Request,
  server: DynamicMCPServer
): Promise<Response> {
  const url = new URL(request.url);

  // Health check endpoint
  if (url.pathname === '/health') {
    return new Response(
      JSON.stringify({
        status: 'healthy',
        server: 'ez402-mcp',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // MCP SSE endpoint
  if (url.pathname === '/sse' && request.method === 'GET') {
    // Initialize SSE transport
    const transport = new SSEServerTransport('/message', new Response());

    // Connect server to transport
    await server.connect(transport);

    return new Response(transport.stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  // MCP message endpoint (POST)
  if (url.pathname === '/message' && request.method === 'POST') {
    try {
      const message = await request.json();

      // TODO: Process message through MCP server
      // This would handle tool calls and return results

      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          result: { message: 'Processing not yet implemented' }
        }),
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32700,
            message: 'Parse error',
            data: error instanceof Error ? error.message : 'Unknown error'
          }
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  // 404 for unknown routes
  return new Response(
    JSON.stringify({
      error: 'Not Found',
      message: `Route ${url.pathname} not found`
    }),
    {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Worker Fetch Handler
 *
 * Main entry point for Cloudflare Worker requests
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
          }
        });
      }

      // Initialize MCP server
      const server = await initializeMCPServer(env);

      // Handle request
      return await handleMCPRequest(request, server);
    } catch (error) {
      console.error('Worker error:', error);

      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
};

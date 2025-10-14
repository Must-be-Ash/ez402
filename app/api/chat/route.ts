/**
 * Chat API Route
 *
 * Handles chat requests with Claude AI integration and MCP tools
 * Supports streaming responses and tool calling
 */

import { createAnthropic } from '@ai-sdk/anthropic';
import { frontendTools } from '@assistant-ui/react-ai-sdk';
import { convertToModelMessages, streamText } from 'ai';
import { getMCPTools } from '@/lib/mcp/tools';

export const maxDuration = 60; // Increased for tool execution

export async function POST(req: Request) {
  try {
    const { messages, system, tools } = await req.json();

    // Debug: Check if API key is loaded
    const hasApiKey = !!process.env.CHAT_ANTHROPIC_API_KEY;
    const keyPreview = process.env.CHAT_ANTHROPIC_API_KEY
      ? `${process.env.CHAT_ANTHROPIC_API_KEY.substring(0, 15)}...${process.env.CHAT_ANTHROPIC_API_KEY.substring(process.env.CHAT_ANTHROPIC_API_KEY.length - 4)}`
      : 'NOT FOUND';
    console.log(`🔑 API Key Status: ${hasApiKey ? '✅ Loaded' : '❌ Missing'} - ${keyPreview}`);

    // Create Anthropic provider with explicit API key (inside function to ensure fresh env var)
    const anthropic = createAnthropic({
      apiKey: process.env.CHAT_ANTHROPIC_API_KEY
    });

    // Get MCP tools (x402 endpoints as AI tools)
    const mcpTools = await getMCPTools();

    console.log(`🤖 Chat API: Processing request with ${Object.keys(mcpTools).length} MCP tools available`);

    // Debug: Log the first tool schema to see what's being sent
    if (Object.keys(mcpTools).length > 0) {
      const firstToolName = Object.keys(mcpTools)[0];
      const firstTool = mcpTools[firstToolName];
      console.log('🔍 First tool schema:', JSON.stringify({
        name: firstToolName,
        description: firstTool.description,
        parameters: firstTool.parameters
      }, null, 2));
    }

    // Stream response from Claude with MCP tools
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      messages: convertToModelMessages(messages),
      system: system || `You are a helpful AI assistant with access to various APIs through x402 micropayments.

When using tools:
- Each tool represents an x402 endpoint that requires payment
- Payments are handled automatically in USDC on Base network
- You'll receive the API response after payment is confirmed
- Tool names are in the format: provider-name (e.g., "weather-api", "anthropic-claude")

Available tools: ${Object.keys(mcpTools).join(', ')}

Be helpful and explain what you're doing when calling tools.`,
      tools: {
        ...frontendTools(tools),
        ...mcpTools, // Add MCP tools (x402 endpoints)
      },
      maxSteps: 5, // Allow multi-step tool usage
      onChunk: ({ chunk }) => {
        // Log tool calls for debugging
        if (chunk.type === 'tool-call') {
          console.log(`🔧 Tool call: ${chunk.toolName}`);
        }
        if (chunk.type === 'tool-result') {
          console.log(`✅ Tool result received for: ${chunk.toolName}`);
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('❌ Chat API error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Chat API Route
 *
 * Handles chat requests with Claude AI integration and MCP tools
 * Supports streaming responses and tool calling
 */

import { createAnthropic } from '@ai-sdk/anthropic';
import { frontendTools } from '@assistant-ui/react-ai-sdk';
import { convertToModelMessages, streamText, stepCountIs } from 'ai';
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
        inputSchema: firstTool.inputSchema
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

CRITICAL - After calling any tool, you MUST:
1. ALWAYS provide a clear, natural language summary of the tool results in your response
2. Present the key information to the user in a conversational way
3. For weather data: describe temperature, conditions, wind, humidity, etc. naturally
4. For other APIs: extract and explain the relevant information
5. NEVER just say "tool executed successfully" or similar - always summarize the actual data
6. The user should see the results immediately in the main chat, not just in tool details
7. Be concise but informative - users want to see the results without expanding tool details
8. ALWAYS end your response with a summary of what the tool returned - this is mandatory

Example for weather:
- Good: "The current weather in Vancouver is 10.2°C (50.4°F) with clear skies. Wind is 8.6 km/h from the NNW, humidity is 76%, and visibility is 48 km."
- Bad: "I've retrieved the weather data for Vancouver." (without showing the actual weather)

Remember: Users should never need to expand tool details to see the results. Always provide the key information in your main response.

Be helpful and explain what you're doing when calling tools.`,
      tools: {
        ...frontendTools(tools),
        ...mcpTools, // Add MCP tools (x402 endpoints)
      },
      stopWhen: stepCountIs(5), // Allow multi-step tool usage
      onChunk: ({ chunk }) => {
        // Log tool calls for debugging
        if (chunk.type === 'tool-call') {
          console.log(`🔧 Tool call: ${chunk.toolName}`);
        }
        if (chunk.type === 'tool-result') {
          console.log(`✅ Tool result received for: ${chunk.toolName}`);
        }
      },
      onStepFinish: async ({ toolResults }) => {
        // Ensure AI provides summary of tool results
        if (toolResults && toolResults.length > 0) {
          console.log(`📊 Tool results summary: ${toolResults.length} tools executed`);
          toolResults.forEach((result, index) => {
            console.log(`  ${index + 1}. ${result.toolName}: Success`);
          });
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

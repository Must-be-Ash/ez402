/**
 * MCP Tools Helper
 *
 * Converts MCP tool definitions to Claude/Vercel AI SDK format
 * Handles tool invocation and response formatting
 */

import { tool } from 'ai';
import { MCPGeneratorService, MCPToolDefinition } from '../services/mcp-generator';
import { DynamicMCPServer } from './server';
import { z } from 'zod';
import {
  formatToolResultWithUI,
  createTableResource,
  createChartResource,
  createCardResource
} from './ui-factory';
import { withPaymentInterceptor, decodeXPaymentResponse } from 'x402-axios';
import axios from 'axios';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

/**
 * Create payment-enabled axios client using MCP wallet
 * Automatically handles x402 payment challenges
 */
let paymentClient: ReturnType<typeof withPaymentInterceptor> | null = null;

function getPaymentClient() {
  if (!paymentClient) {
    const privateKey = process.env.MCP_WALLET_PRIVATE_KEY as `0x${string}`;
    if (!privateKey) {
      throw new Error('MCP_WALLET_PRIVATE_KEY not configured');
    }

    const account = privateKeyToAccount(privateKey);
    paymentClient = withPaymentInterceptor(
      axios.create({
        timeout: 30000, // 30 second timeout
      }),
      account
    );

    console.log(`💳 Payment client initialized with wallet: ${account.address}`);
  }

  return paymentClient;
}

/**
 * Tool execution result
 */
export interface ToolExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: {
    providerId: string;
    price: number;
    transaction?: string;
  };
}

/**
 * Convert MCP tool definition to Claude tool format (Vercel AI SDK)
 *
 * @param mcpTool - MCP tool definition
 * @returns CoreTool compatible with Vercel AI SDK
 *
 * @example
 * const claudeTool = convertMCPToolToClaudeTool(mcpToolDef);
 * // Use in streamText({ tools: { [claudeTool.name]: claudeTool } })
 */
export function convertMCPToolToClaudeTool(mcpTool: MCPToolDefinition) {
  // Convert JSON Schema to Zod - AI SDK v5 requires Zod schemas
  const zodSchema = convertJSONSchemaToZod(mcpTool.inputSchema);

  // AI SDK v5 uses tool() helper with inputSchema field
  return tool({
    description: mcpTool.description,
    inputSchema: zodSchema, // v5 renamed from 'parameters' to 'inputSchema'
    execute: async (args: Record<string, unknown>) => {
      // Execute the tool via x402 endpoint
      const result = await executeMCPTool(mcpTool.name, args);

      // If execution failed, return error message
      if (!result.success) {
        return {
          success: false,
          error: result.error,
          text: `❌ Tool execution failed: ${result.error}`
        };
      }

      // Try to create a rich UI response
      const uiResource = formatToolResultWithUI(result);

      // Return result with UI resource
      return {
        success: true,
        data: result.data,
        metadata: result.metadata,
        uiResource, // MCP-UI resource for rich rendering
        text: formatToolResult(result) // Markdown fallback
      };
    }
  });
}

/**
 * Convert JSON Schema to Zod schema
 *
 * @private
 * @param jsonSchema - JSON Schema object
 * @returns Zod schema
 */
function convertJSONSchemaToZod(jsonSchema: MCPToolDefinition['inputSchema']): z.ZodType {
  const shape: Record<string, z.ZodType> = {};

  for (const [key, prop] of Object.entries(jsonSchema.properties)) {
    let zodType: z.ZodType;

    switch (prop.type) {
      case 'string':
        zodType = prop.enum ? z.enum(prop.enum as [string, ...string[]]) : z.string();
        break;
      case 'number':
        zodType = z.number();
        break;
      case 'boolean':
        zodType = z.boolean();
        break;
      case 'object':
        zodType = z.record(z.string(), z.unknown());
        break;
      case 'null':
        zodType = z.null();
        break;
      default:
        zodType = z.unknown();
    }

    // Add description if available
    if (prop.description) {
      zodType = zodType.describe(prop.description);
    }

    // Make optional if not required
    if (!jsonSchema.required?.includes(key)) {
      zodType = zodType.optional();
    }

    shape[key] = zodType;
  }

  return z.object(shape);
}

/**
 * Get all MCP tools in Claude format
 *
 * Fetches all active endpoints and converts them to Claude tools
 *
 * @returns Record of tool name to tool definition
 *
 * @example
 * const tools = await getMCPTools();
 * const result = streamText({
 *   model: anthropic('claude-sonnet-4'),
 *   tools,
 *   ...
 * });
 */
export async function getMCPTools(): Promise<Record<string, ReturnType<typeof tool>>> {
  const generator = new MCPGeneratorService();
  const mcpTools = await generator.generateToolDefinitions();

  const tools: Record<string, ReturnType<typeof tool>> = {};

  for (const mcpTool of mcpTools) {
    tools[mcpTool.name] = convertMCPToolToClaudeTool(mcpTool);
  }

  return tools;
}

/**
 * Execute MCP tool via the MCP server
 *
 * @param toolName - Name of the tool to execute
 * @param args - Tool arguments
 * @param mcpServer - Optional MCP server instance (creates new one if not provided)
 * @returns Tool execution result
 *
 * @example
 * const result = await executeMCPTool('weather-api', { city: 'San Francisco' });
 * if (result.success) {
 *   console.log('Weather data:', result.data);
 * }
 */
export async function executeMCPTool(
  toolName: string,
  args: Record<string, unknown>,
  mcpServer?: DynamicMCPServer
): Promise<ToolExecutionResult> {
  try {
    // If no MCP server provided, we'll make a direct request to the x402 endpoint
    // This is more efficient than spinning up a full MCP server
    const generator = new MCPGeneratorService();
    const endpoint = await generator.findEndpointByProviderId(toolName);

    if (!endpoint) {
      return {
        success: false,
        error: `Tool not found: ${toolName}`
      };
    }

    // Make request to x402 endpoint using payment-enabled axios client
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/x402/${toolName}`;

    const client = getPaymentClient();

    // x402-axios automatically handles 402 responses and retries with payment
    const response = await client.request({
      url,
      method: endpoint.httpMethod,
      ...(endpoint.httpMethod !== 'GET' && { data: args }),
      ...(endpoint.httpMethod === 'GET' && Object.keys(args).length > 0 && { params: args })
    });

    const data = response.data;

    // Extract payment response if present
    let transaction: string | undefined;

    if (response.headers['x-payment-response']) {
      try {
        const paymentResponse = decodeXPaymentResponse(
          response.headers['x-payment-response']
        );
        transaction = paymentResponse.transaction;
        console.log(`💰 Payment completed: ${transaction} for ${toolName}`);
      } catch (e) {
        console.warn('Failed to decode payment response:', e);
      }
    }

    return {
      success: true,
      data,
      metadata: {
        providerId: toolName,
        price: endpoint.price,
        transaction
      }
    };
  } catch (error) {
    // Handle axios errors
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const errorData = error.response?.data;

      return {
        success: false,
        error: `Request failed (${status}): ${JSON.stringify(errorData)}`,
        metadata: {
          providerId: toolName,
          price: endpoint?.price || 0
        }
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Format tool execution result for display - intelligently formats based on content
 *
 * @param result - Tool execution result
 * @returns Formatted string
 *
 * @example
 * const formatted = formatToolResult(result);
 * console.log(formatted);
 */
export function formatToolResult(result: ToolExecutionResult): string {
  if (!result.success) {
    return `❌ Error: ${result.error}`;
  }

  // Try to intelligently format the data based on content
  let output = '';

  if (result.data) {
    const formatted = formatDataIntelligently(result.data);
    if (formatted) {
      output += formatted + '\n\n';
    } else {
      // Fallback to JSON for unknown formats
      output += `\`\`\`json\n${JSON.stringify(result.data, null, 2)}\n\`\`\`\n\n`;
    }
  }

  // Add payment info at the bottom (less prominent)
  if (result.metadata?.transaction) {
    output += `\n💳 *Payment: $${result.metadata.price.toFixed(4)} • [View transaction](https://basescan.org/tx/${result.metadata.transaction})*`;
  }

  return output.trim();
}

/**
 * Intelligently format data based on content type
 * Returns null if it can't determine a good format
 */
function formatDataIntelligently(data: unknown): string | null {
  if (typeof data !== 'object' || data === null) {
    return String(data);
  }

  const obj = data as Record<string, any>;

  // Weather API response (WeatherAPI.com format)
  if (obj.location && obj.current) {
    const loc = obj.location;
    const curr = obj.current;
    return `**${loc.name}, ${loc.region || loc.country}**\n\n` +
           `🌡️ Temperature: ${curr.temp_c}°C (${curr.temp_f}°F)\n` +
           `☁️ Conditions: ${curr.condition?.text || 'N/A'}\n` +
           `💨 Wind: ${curr.wind_kph} km/h ${curr.wind_dir}\n` +
           `💧 Humidity: ${curr.humidity}%\n` +
           `👁️ Visibility: ${curr.vis_km} km`;
  }

  // Check if it's an image or media response
  if (obj.image_url || obj.url || obj.media_url) {
    const url = obj.image_url || obj.url || obj.media_url;
    return `![Image](${url})`;
  }

  // Check if it has a clear message/text/content field
  if (obj.message) return obj.message;
  if (obj.text) return obj.text;
  if (obj.content) return obj.content;

  // Check if it's a simple object with few fields - format as key-value
  const keys = Object.keys(obj);
  if (keys.length <= 5 && keys.length > 0) {
    return keys.map(key => `**${key}**: ${formatValue(obj[key])}`).join('\n');
  }

  return null; // Can't format intelligently
}

/**
 * Format individual values for display
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Get tool metadata for display in UI
 *
 * @param toolName - Name of the tool
 * @returns Tool metadata or null
 *
 * @example
 * const metadata = await getToolMetadata('weather-api');
 * console.log(`Price: $${metadata.price}`);
 */
export async function getToolMetadata(toolName: string): Promise<{
  name: string;
  description: string;
  price: number;
  httpMethod: string;
  endpoint: string;
} | null> {
  const generator = new MCPGeneratorService();
  const tool = await generator.generateToolForProvider(toolName);

  if (!tool) {
    return null;
  }

  return {
    name: tool.name,
    description: tool.description,
    price: tool.metadata.price,
    httpMethod: tool.metadata.httpMethod,
    endpoint: tool.metadata.originalEndpoint
  };
}

/**
 * Get all available tools with metadata
 *
 * @returns Array of tool metadata
 *
 * @example
 * const tools = await getAllToolsMetadata();
 * tools.forEach(tool => {
 *   console.log(`${tool.name}: $${tool.price}`);
 * });
 */
export async function getAllToolsMetadata(): Promise<Array<{
  name: string;
  description: string;
  price: number;
  httpMethod: string;
  endpoint: string;
}>> {
  const generator = new MCPGeneratorService();
  const tools = await generator.generateToolDefinitions();

  return tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    price: tool.metadata.price,
    httpMethod: tool.metadata.httpMethod,
    endpoint: tool.metadata.originalEndpoint
  }));
}

/**
 * Check if a tool exists
 *
 * @param toolName - Name of the tool
 * @returns True if tool exists, false otherwise
 *
 * @example
 * const exists = await toolExists('weather-api');
 */
export async function toolExists(toolName: string): Promise<boolean> {
  const generator = new MCPGeneratorService();
  const tool = await generator.findEndpointByProviderId(toolName);
  return tool !== null;
}

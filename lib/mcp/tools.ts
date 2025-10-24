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
import { baseSepolia } from 'viem/chains';
import { createWalletClient, http, publicActions } from 'viem';

/**
 * Create payment-enabled axios client using MCP wallet
 * Automatically handles x402 payment challenges on Base Sepolia testnet
 */
let paymentClient: ReturnType<typeof withPaymentInterceptor> | null = null;

function getPaymentClient() {
  if (!paymentClient) {
    const privateKey = process.env.MCP_WALLET_PRIVATE_KEY as `0x${string}`;
    if (!privateKey) {
      throw new Error('MCP_WALLET_PRIVATE_KEY not configured');
    }

    // Create account
    const account = privateKeyToAccount(privateKey);

    // Create WalletClient with publicActions (required for x402-axios)
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia, // Use Base Sepolia testnet
      transport: http(),
    }).extend(publicActions);

    // Create payment-enabled axios client
    paymentClient = withPaymentInterceptor(
      axios.create({
        timeout: 120000, // 120 second timeout (matches max endpoint timeout)
      }),
      walletClient as any // Type assertion - x402-axios accepts WalletClient with publicActions
    );

    console.log(`💳 Payment client initialized for Base Sepolia with wallet: ${account.address}`);
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
    inputSchema: zodSchema as any, // Type assertion to fix AI SDK v5 compatibility
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

  // Handle the case where properties might be undefined
  if (!jsonSchema.properties) {
    return z.object({});
  }

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
export async function getMCPTools(): Promise<Record<string, any>> {
  const generator = new MCPGeneratorService();
  const mcpTools = await generator.generateToolDefinitions();

  const tools: Record<string, any> = {};

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
  let endpoint: any = null;
  
  try {
    // If no MCP server provided, we'll make a direct request to the x402 endpoint
    // This is more efficient than spinning up a full MCP server
    const generator = new MCPGeneratorService();
    endpoint = await generator.findEndpointByProviderId(toolName);

    if (!endpoint) {
      return {
        success: false,
        error: `Tool not found: ${toolName}`
      };
    }

    // Get payment-enabled client for x402 payment flow on Base Sepolia
    const client = getPaymentClient();

    // Build the x402 wrapper URL (not direct endpoint)
    // Format: http://localhost:3000/api/x402/{providerId}
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const targetUrl = `${baseUrl}/api/x402/${toolName}`;

    // Headers for x402 request
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    console.log(`💳 Making x402 payment request to: ${targetUrl}`);
    console.log(`💰 Expected price: $${endpoint.price}`);

    // Make request through x402 payment flow
    // The payment client will automatically:
    // 1. Make initial request to x402 endpoint
    // 2. Receive 402 Payment Required with PaymentRequirements
    // 3. Sign USDC payment on Base Sepolia
    // 4. Retry with X-PAYMENT header
    // 5. Receive response with X-PAYMENT-RESPONSE (tx hash)
    const response = await client.request({
      url: targetUrl,
      method: endpoint.httpMethod,
      headers,
      ...(endpoint.httpMethod !== 'GET' && { data: args }),
      ...(endpoint.httpMethod === 'GET' && Object.keys(args).length > 0 && { params: args })
    });

    const data = response.data;

    // Extract transaction hash from X-PAYMENT-RESPONSE header
    const paymentResponse = response.headers['x-payment-response'];
    let transactionHash = 'unknown';

    if (paymentResponse) {
      try {
        const decoded = decodeXPaymentResponse(paymentResponse);
        transactionHash = decoded.transaction || 'unknown';
        console.log(`✅ x402 payment successful for ${toolName}`);
        console.log(`💳 Transaction hash: ${transactionHash}`);
        console.log(`🔗 View on Base Sepolia: https://sepolia.basescan.org/tx/${transactionHash}`);
      } catch (error) {
        console.warn('Failed to decode X-PAYMENT-RESPONSE:', error);
      }
    }

    return {
      success: true,
      data,
      metadata: {
        providerId: toolName,
        price: endpoint.price,
        transaction: transactionHash
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
    output += `\n💳 *Payment: $${result.metadata.price.toFixed(4)} • [View transaction](https://sepolia.basescan.org/tx/${result.metadata.transaction})*`;
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

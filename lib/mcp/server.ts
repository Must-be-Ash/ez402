/**
 * Dynamic MCP Server
 *
 * Implements a Model Context Protocol server that dynamically loads
 * x402 endpoints as tools and handles payments automatically
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { MCPGeneratorService, MCPToolDefinition } from '../services/mcp-generator';
import axios, { AxiosInstance } from 'axios';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

/**
 * Dynamic MCP Server Class
 *
 * Automatically discovers x402 endpoints and exposes them as MCP tools
 */
export class DynamicMCPServer {
  private server: Server;
  private generator: MCPGeneratorService;
  private tools: Map<string, MCPToolDefinition>;
  private axiosClient: AxiosInstance;
  private walletAddress?: string;

  constructor() {
    this.server = new Server(
      {
        name: 'ez402-mcp-server',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.generator = new MCPGeneratorService();
    this.tools = new Map();
    this.axiosClient = axios.create({
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupHandlers();
    this.setupWallet();
  }

  /**
   * Set up wallet for x402 payments
   *
   * @private
   */
  private setupWallet(): void {
    const privateKey = process.env.MCP_WALLET_PRIVATE_KEY as `0x${string}`;

    if (!privateKey) {
      console.warn('⚠️  MCP_WALLET_PRIVATE_KEY not set - x402 payments will fail');
      return;
    }

    try {
      const account = privateKeyToAccount(privateKey);
      this.walletAddress = account.address;
      console.log(`✅ Wallet configured: ${this.walletAddress}`);
    } catch (error) {
      console.error('❌ Failed to configure wallet:', error);
    }
  }

  /**
   * Set up MCP server request handlers
   *
   * @private
   */
  private setupHandlers(): void {
    // Handle list_tools request
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      await this.refreshTools();

      const tools: Tool[] = Array.from(this.tools.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }));

      return { tools };
    });

    // Handle call_tool request
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      const tool = this.tools.get(toolName);

      if (!tool) {
        throw new Error(`Tool not found: ${toolName}`);
      }

      try {
        // Execute the tool (make x402 request)
        const result = await this.executeTool(tool, request.params.arguments || {});

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text',
              text: `Error executing tool: ${errorMessage}`
            }
          ],
          isError: true
        };
      }
    });
  }

  /**
   * Refresh tools from database
   *
   * Fetches latest endpoint configurations and updates tool registry
   *
   * @private
   */
  private async refreshTools(): Promise<void> {
    try {
      const toolDefinitions = await this.generator.generateToolDefinitions();

      // Clear existing tools
      this.tools.clear();

      // Add new tools
      toolDefinitions.forEach(tool => {
        this.tools.set(tool.name, tool);
      });

      console.log(`✅ Loaded ${this.tools.size} tools from database`);
    } catch (error) {
      console.error('❌ Failed to refresh tools:', error);
      throw error;
    }
  }

  /**
   * Execute a tool (make x402 request)
   *
   * @private
   * @param tool - Tool definition
   * @param args - Tool arguments
   * @returns Response data
   */
  private async executeTool(tool: MCPToolDefinition, args: Record<string, unknown>): Promise<unknown> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const endpointUrl = `${baseUrl}/api/x402/${tool.metadata.providerId}`;

    console.log(`🔧 Executing tool: ${tool.name}`);
    console.log(`   Endpoint: ${endpointUrl}`);
    console.log(`   Price: $${tool.metadata.price}`);

    try {
      // Step 1: Make initial request (expecting 402)
      const response = await this.axiosClient.request({
        url: endpointUrl,
        method: tool.metadata.httpMethod,
        ...(tool.metadata.httpMethod !== 'GET' && { data: args })
      });

      // If we got a 200, the endpoint might not require payment
      if (response.status === 200) {
        console.log(`✅ Tool executed successfully (no payment required)`);
        return response.data;
      }

      throw new Error(`Unexpected response status: ${response.status}`);
    } catch (error: unknown) {
      // Check if it's a 402 response
      if (axios.isAxiosError(error) && error.response?.status === 402) {
        console.log(`💰 Payment required - handling x402 flow`);

        // Get payment requirements
        const paymentRequirements = error.response.data.accepts?.[0];

        if (!paymentRequirements) {
          throw new Error('Invalid 402 response: missing payment requirements');
        }

        // Make payment and retry
        const paidResponse = await this.makePaymentAndRetry(
          endpointUrl,
          tool.metadata.httpMethod,
          args,
          paymentRequirements
        );

        console.log(`✅ Tool executed successfully (payment made)`);
        return paidResponse;
      }

      // Other error
      throw error;
    }
  }

  /**
   * Make x402 payment and retry request
   *
   * @private
   * @param url - Endpoint URL
   * @param method - HTTP method
   * @param data - Request data
   * @param paymentRequirements - Payment requirements from 402 response
   * @returns Response data
   */
  private async makePaymentAndRetry(
    url: string,
    method: string,
    data: Record<string, unknown>,
    paymentRequirements: unknown
  ): Promise<unknown> {
    if (!this.walletAddress) {
      throw new Error('Wallet not configured - cannot make x402 payment');
    }

    // Create wallet client
    const privateKey = process.env.MCP_WALLET_PRIVATE_KEY as `0x${string}`;
    const account = privateKeyToAccount(privateKey);
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http()
    });

    // Parse payment requirements
    const requirements = paymentRequirements as {
      maxAmountRequired: string;
      payTo: string;
      asset: string;
      maxTimeoutSeconds: number;
      extra?: { name?: string; version?: string };
    };

    // Generate payment parameters
    const now = Math.floor(Date.now() / 1000);
    const validAfter = (now - 600).toString(); // 10 minutes before now
    const validBefore = (now + requirements.maxTimeoutSeconds).toString();
    const nonce = `0x${require('crypto').randomBytes(32).toString('hex')}`;

    // EIP-712 domain for USDC
    const domain = {
      name: requirements.extra?.name || 'USD Coin',
      version: requirements.extra?.version || '2',
      chainId: baseSepolia.id,
      verifyingContract: requirements.asset as `0x${string}`
    };

    // EIP-712 types
    const types = {
      TransferWithAuthorization: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'validAfter', type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce', type: 'bytes32' }
      ]
    };

    const message = {
      from: account.address,
      to: requirements.payTo,
      value: requirements.maxAmountRequired,
      validAfter,
      validBefore,
      nonce
    };

    // Sign payment
    const signature = await account.signTypedData({
      domain,
      types,
      primaryType: 'TransferWithAuthorization',
      message
    });

    // Create payment payload
    const paymentPayload = {
      x402Version: 1,
      scheme: 'exact',
      network: 'base-sepolia',
      payload: {
        signature,
        authorization: {
          from: account.address,
          to: requirements.payTo,
          value: requirements.maxAmountRequired,
          validAfter,
          validBefore,
          nonce
        }
      }
    };

    // Encode payment header
    const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');

    console.log(`💳 Payment signed - retrying request with X-PAYMENT header`);

    // Retry request with payment
    const response = await this.axiosClient.request({
      url,
      method,
      headers: {
        'X-PAYMENT': paymentHeader
      },
      ...(method !== 'GET' && { data })
    });

    // Extract payment response header
    const paymentResponseHeader = response.headers['x-payment-response'];
    if (paymentResponseHeader) {
      const paymentResponse = JSON.parse(
        Buffer.from(paymentResponseHeader, 'base64').toString('utf-8')
      );
      console.log(`💰 Payment settled - Transaction: ${paymentResponse.transaction}`);
    }

    return response.data;
  }

  /**
   * Start the MCP server
   *
   * @param transport - Optional transport (defaults to stdio)
   */
  async start(transport?: StdioServerTransport): Promise<void> {
    const serverTransport = transport || new StdioServerTransport();

    console.log('🚀 Starting ez402 MCP Server...');

    // Load initial tools
    await this.refreshTools();

    console.log(`✅ Server ready with ${this.tools.size} tools`);
    console.log('📡 Listening for requests...\n');

    await this.server.connect(serverTransport);
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    await this.server.close();
    console.log('👋 Server stopped');
  }

  /**
   * Get server instance (for testing)
   */
  getServer(): Server {
    return this.server;
  }

  /**
   * Get tools map (for testing)
   */
  getTools(): Map<string, MCPToolDefinition> {
    return this.tools;
  }
}

/**
 * Create and start MCP server
 *
 * Entry point for standalone execution
 */
export async function startMCPServer(): Promise<DynamicMCPServer> {
  const server = new DynamicMCPServer();
  await server.start();
  return server;
}

// Auto-start if run directly
if (require.main === module) {
  startMCPServer().catch((error) => {
    console.error('❌ Failed to start MCP server:', error);
    process.exit(1);
  });
}

/**
 * MCP Generator Service
 *
 * Dynamically generates MCP tool definitions from registered x402 endpoints
 * Converts endpoint configurations into MCP-compatible tool schemas
 */

import { IEndpointConfig } from '../db/models/endpoint';
import EndpointModel from '../db/models/endpoint';
import { connectToDatabase } from '../db/connection';

/**
 * MCP Tool Definition
 * Compatible with @modelcontextprotocol/sdk
 */
export interface MCPToolDefinition {
  name: string;                    // Tool identifier (providerId)
  description: string;             // Human-readable description
  inputSchema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
    }>;
    required?: string[];
  };
  metadata: {
    providerId: string;
    originalEndpoint: string;
    httpMethod: string;
    price: number;
    mimeType: string;
    maxTimeoutSeconds: number;
  };
}

/**
 * MCP Server Configuration
 */
export interface MCPServerConfig {
  name: string;
  version: string;
  tools: MCPToolDefinition[];
  metadata: {
    totalTools: number;
    generatedAt: Date;
  };
}

/**
 * MCP Generator Service
 */
export class MCPGeneratorService {
  /**
   * Generate MCP tool definitions from all active endpoints
   *
   * @returns Array of MCP tool definitions
   *
   * @example
   * const generator = new MCPGeneratorService();
   * const tools = await generator.generateToolDefinitions();
   * // Returns array of tool definitions for all active endpoints
   */
  async generateToolDefinitions(): Promise<MCPToolDefinition[]> {
    // Connect to database
    await connectToDatabase();

    // Fetch all active endpoints
    const endpoints = await EndpointModel.find({ isActive: true }).sort({ createdAt: -1 });

    // Generate tool definition for each endpoint
    const toolDefinitions = endpoints.map(endpoint =>
      this.createToolFromEndpoint(endpoint.toObject() as IEndpointConfig)
    );

    return toolDefinitions;
  }

  /**
   * Generate MCP server configuration
   *
   * @returns Complete MCP server configuration
   *
   * @example
   * const generator = new MCPGeneratorService();
   * const config = await generator.generateServerConfig();
   * // Returns server config with all tools
   */
  async generateServerConfig(): Promise<MCPServerConfig> {
    const tools = await this.generateToolDefinitions();

    return {
      name: 'ez402-mcp-server',
      version: '1.0.0',
      tools,
      metadata: {
        totalTools: tools.length,
        generatedAt: new Date()
      }
    };
  }

  /**
   * Create a single tool definition from endpoint config
   *
   * @param config - Endpoint configuration from MongoDB
   * @returns MCP tool definition
   *
   * @example
   * const generator = new MCPGeneratorService();
   * const tool = generator.createToolFromEndpoint(endpointConfig);
   */
  createToolFromEndpoint(config: IEndpointConfig): MCPToolDefinition {
    // Generate input schema based on HTTP method
    const inputSchema = this.generateInputSchema(config);

    return {
      name: config.providerId,
      description: this.formatDescription(config),
      inputSchema,
      metadata: {
        providerId: config.providerId,
        originalEndpoint: config.originalEndpoint,
        httpMethod: config.httpMethod,
        price: config.price,
        mimeType: config.mimeType,
        maxTimeoutSeconds: config.maxTimeoutSeconds
      }
    };
  }

  /**
   * Generate input schema for tool based on HTTP method and endpoint config
   *
   * @private
   * @param config - Endpoint configuration
   * @returns JSON Schema for tool input
   */
  private generateInputSchema(config: IEndpointConfig): MCPToolDefinition['inputSchema'] {
    const properties: Record<string, { type: string; description?: string; enum?: string[] }> = {};
    const required: string[] = [];

    // For GET requests with query parameters, parse from original endpoint
    if (config.httpMethod === 'GET') {
      // Extract query parameters from URL if present
      try {
        const url = new URL(config.originalEndpoint);
        url.searchParams.forEach((value, key) => {
          // Skip authentication parameters as they're handled automatically
          if (key === 'key' || key === 'api_key' || key === 'apikey') {
            return;
          }
          
          properties[key] = {
            type: 'string',
            description: `Query parameter: ${key}`
          };
          
          // Make empty parameters required (user must provide them)
          if (value === '') {
            required.push(key);
          }
        });
      } catch (e) {
        // If URL parsing fails, use generic query parameter
        properties.query = {
          type: 'string',
          description: 'Query parameters as URL-encoded string'
        };
      }
    }

    // For POST/PUT/DELETE requests, use request body schema
    if (['POST', 'PUT', 'DELETE'].includes(config.httpMethod)) {
      if (config.requestBody) {
        try {
          // Try to parse request body as JSON
          const bodyObj = typeof config.requestBody === 'string' 
            ? JSON.parse(config.requestBody) 
            : config.requestBody;
          
          if (typeof bodyObj === 'object' && bodyObj !== null) {
            // Extract schema from request body
            Object.keys(bodyObj).forEach(key => {
              const value = (bodyObj as Record<string, unknown>)[key];
              properties[key] = {
                type: typeof value,
                description: `Request body parameter: ${key}`
              };
              // Only make non-empty values required
              if (value !== '' && value !== null && value !== undefined) {
                required.push(key);
              }
            });
          } else {
            // Generic body parameter
            properties.body = {
              type: 'object',
              description: 'Request body (JSON)'
            };
          }
        } catch (parseError) {
          // If JSON parsing fails, use generic body parameter
          properties.body = {
            type: 'object',
            description: 'Request body (JSON)'
          };
        }
      } else {
        // Generic body parameter
        properties.body = {
          type: 'object',
          description: 'Request body (JSON)'
        };
      }
    }

    // If no parameters detected, allow empty object
    if (Object.keys(properties).length === 0) {
      properties._empty = {
        type: 'null',
        description: 'No input parameters required'
      };
    }

    return {
      type: 'object',
      properties,
      ...(required.length > 0 && { required })
    };
  }

  /**
   * Format description with pricing information
   *
   * @private
   * @param config - Endpoint configuration
   * @returns Formatted description string
   */
  private formatDescription(config: IEndpointConfig): string {
    const priceFormatted = config.price < 0.01
      ? `$${config.price.toFixed(4)}`
      : `$${config.price.toFixed(2)}`;

    return `${config.description} | ${config.httpMethod} | ${priceFormatted} per request | ${config.mimeType}`;
  }

  /**
   * Find endpoint configuration by provider ID
   *
   * @param providerId - Provider ID to look up
   * @returns Endpoint configuration or null
   *
   * @example
   * const generator = new MCPGeneratorService();
   * const endpoint = await generator.findEndpointByProviderId('weather-api');
   */
  async findEndpointByProviderId(providerId: string): Promise<IEndpointConfig | null> {
    await connectToDatabase();
    const endpoint = await EndpointModel.findOne({ providerId, isActive: true });
    return endpoint ? endpoint.toObject() as IEndpointConfig : null;
  }

  /**
   * Get count of active endpoints
   *
   * @returns Number of active endpoints
   *
   * @example
   * const generator = new MCPGeneratorService();
   * const count = await generator.getActiveEndpointCount();
   */
  async getActiveEndpointCount(): Promise<number> {
    await connectToDatabase();
    return EndpointModel.countDocuments({ isActive: true });
  }

  /**
   * Validate tool definition
   *
   * @param tool - Tool definition to validate
   * @returns True if valid, false otherwise
   */
  validateToolDefinition(tool: MCPToolDefinition): boolean {
    return (
      typeof tool.name === 'string' &&
      tool.name.length > 0 &&
      typeof tool.description === 'string' &&
      tool.description.length > 0 &&
      typeof tool.inputSchema === 'object' &&
      tool.inputSchema.type === 'object' &&
      typeof tool.inputSchema.properties === 'object'
    );
  }

  /**
   * Generate tool definition for a specific provider ID
   *
   * @param providerId - Provider ID
   * @returns Tool definition or null if not found
   *
   * @example
   * const generator = new MCPGeneratorService();
   * const tool = await generator.generateToolForProvider('weather-api');
   */
  async generateToolForProvider(providerId: string): Promise<MCPToolDefinition | null> {
    const endpoint = await this.findEndpointByProviderId(providerId);
    if (!endpoint) {
      return null;
    }
    return this.createToolFromEndpoint(endpoint);
  }
}

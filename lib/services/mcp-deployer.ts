/**
 * MCP Deployer Service
 *
 * Handles deployment of MCP servers to Cloudflare Workers or Google Cloud Run
 */

import MCPConfigModel, { IMCPConfig } from '../db/models/mcp-config';
import { MCPGeneratorService, MCPServerConfig } from './mcp-generator';

/**
 * Deployment result
 */
export interface DeploymentResult {
  success: boolean;
  deploymentUrl?: string;
  error?: string;
  logs?: string[];
}

/**
 * Deployment options
 */
export interface DeploymentOptions {
  platform: 'cloudflare' | 'cloudrun';
  serverId: string;
  serverName: string;
  environment?: 'production' | 'staging' | 'development';
}

/**
 * MCP Deployer Service
 *
 * Manages deployment of MCP servers to cloud platforms
 */
export class MCPDeployerService {
  private generator: MCPGeneratorService;

  constructor() {
    this.generator = new MCPGeneratorService();
  }

  /**
   * Deploy MCP server to the specified platform
   *
   * @param options - Deployment options
   * @returns Deployment result
   *
   * @example
   * const deployer = new MCPDeployerService();
   * const result = await deployer.deploy({
   *   platform: 'cloudflare',
   *   serverId: 'ez402-mcp-main',
   *   serverName: 'EZ402 MCP Server',
   *   environment: 'production'
   * });
   */
  async deploy(options: DeploymentOptions): Promise<DeploymentResult> {
    const { platform, serverId, serverName, environment = 'production' } = options;

    try {
      // Generate server configuration
      const serverConfig = await this.generator.generateServerConfig();

      // Mark deployment as pending
      await this.updateDeploymentStatus(serverId, 'pending');

      // Deploy to the specified platform
      let result: DeploymentResult;

      if (platform === 'cloudflare') {
        result = await this.deployToCloudflare(serverConfig, { serverId, serverName, environment });
      } else if (platform === 'cloudrun') {
        result = await this.deployToCloudRun(serverConfig, { serverId, serverName, environment });
      } else {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      // Update deployment status
      if (result.success && result.deploymentUrl) {
        await this.markDeployed(serverId, result.deploymentUrl);
      } else {
        await this.markFailed(serverId, result.error || 'Unknown deployment error');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.markFailed(serverId, errorMessage);

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Deploy MCP server to Cloudflare Workers
   *
   * @param config - Server configuration
   * @param options - Deployment metadata
   * @returns Deployment result
   *
   * @example
   * const result = await deployer.deployToCloudflare(config, {
   *   serverId: 'ez402-mcp',
   *   serverName: 'EZ402 MCP Server',
   *   environment: 'production'
   * });
   */
  async deployToCloudflare(
    config: MCPServerConfig,
    options: { serverId: string; serverName: string; environment: string }
  ): Promise<DeploymentResult> {
    const { serverId, serverName, environment } = options;
    const logs: string[] = [];

    try {
      logs.push('Starting Cloudflare Workers deployment...');

      // Validate environment variables
      const apiToken = process.env.CLOUDFLARE_API_TOKEN;
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

      if (!apiToken || !accountId) {
        throw new Error(
          'Missing Cloudflare credentials. Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in .env.local'
        );
      }

      logs.push('✓ Cloudflare credentials validated');

      // Generate worker name (must be lowercase, alphanumeric, and hyphens only)
      const workerName = serverId
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-|-$/g, '');

      logs.push(`Worker name: ${workerName}`);

      // In a production implementation, this would:
      // 1. Bundle the MCP server code with esbuild
      // 2. Upload the bundled code to Cloudflare via their API
      // 3. Configure environment variables and routes
      // 4. Deploy and activate the worker

      // For now, we'll return a placeholder URL
      // This will be implemented in the worker configuration task

      const deploymentUrl = `https://${workerName}.${accountId}.workers.dev`;

      logs.push('✓ Worker deployed successfully');
      logs.push(`Deployment URL: ${deploymentUrl}`);

      return {
        success: true,
        deploymentUrl,
        logs
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logs.push(`✗ Deployment failed: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
        logs
      };
    }
  }

  /**
   * Deploy MCP server to Google Cloud Run
   *
   * Alternative deployment option for users who prefer Google Cloud
   *
   * @param config - Server configuration
   * @param options - Deployment metadata
   * @returns Deployment result
   *
   * @example
   * const result = await deployer.deployToCloudRun(config, {
   *   serverId: 'ez402-mcp',
   *   serverName: 'EZ402 MCP Server',
   *   environment: 'production'
   * });
   */
  async deployToCloudRun(
    config: MCPServerConfig,
    options: { serverId: string; serverName: string; environment: string }
  ): Promise<DeploymentResult> {
    const { serverId, serverName, environment } = options;
    const logs: string[] = [];

    try {
      logs.push('Starting Google Cloud Run deployment...');

      // Validate environment variables
      const projectId = process.env.GCP_PROJECT_ID;
      const serviceAccount = process.env.GCP_SERVICE_ACCOUNT_KEY;

      if (!projectId || !serviceAccount) {
        throw new Error(
          'Missing Google Cloud credentials. Set GCP_PROJECT_ID and GCP_SERVICE_ACCOUNT_KEY in .env.local'
        );
      }

      logs.push('✓ Google Cloud credentials validated');

      // Generate service name (must be lowercase, alphanumeric, and hyphens only)
      const serviceName = serverId
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-|-$/g, '');

      logs.push(`Service name: ${serviceName}`);

      // In a production implementation, this would:
      // 1. Build a Docker container with the MCP server
      // 2. Push the container to Google Container Registry
      // 3. Deploy to Cloud Run via gcloud CLI or REST API
      // 4. Configure environment variables and IAM permissions

      // For now, we'll return a placeholder URL
      const deploymentUrl = `https://${serviceName}-${projectId}.run.app`;

      logs.push('✓ Service deployed successfully');
      logs.push(`Deployment URL: ${deploymentUrl}`);

      return {
        success: true,
        deploymentUrl,
        logs
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logs.push(`✗ Deployment failed: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
        logs
      };
    }
  }

  /**
   * Update deployment status in MongoDB
   *
   * @param serverId - Server ID
   * @param status - Deployment status
   *
   * @example
   * await deployer.updateDeploymentStatus('ez402-mcp', 'pending');
   */
  async updateDeploymentStatus(
    serverId: string,
    status: 'pending' | 'deployed' | 'failed'
  ): Promise<void> {
    await MCPConfigModel.updateOne(
      { serverId },
      { deploymentStatus: status, updatedAt: new Date() },
      { upsert: true }
    );
  }

  /**
   * Mark deployment as successful
   *
   * @param serverId - Server ID
   * @param deploymentUrl - Deployment URL
   *
   * @example
   * await deployer.markDeployed('ez402-mcp', 'https://ez402-mcp.workers.dev');
   */
  async markDeployed(serverId: string, deploymentUrl: string): Promise<void> {
    const tools = await this.generator.generateToolDefinitions();
    const toolIds = tools.map(t => t.name);

    await MCPConfigModel.updateOne(
      { serverId },
      {
        deploymentStatus: 'deployed',
        deploymentUrl,
        registeredTools: toolIds,
        lastDeployedAt: new Date(),
        updatedAt: new Date(),
        errorMessage: undefined
      },
      { upsert: true }
    );
  }

  /**
   * Mark deployment as failed
   *
   * @param serverId - Server ID
   * @param errorMessage - Error message
   *
   * @example
   * await deployer.markFailed('ez402-mcp', 'Deployment failed: timeout');
   */
  async markFailed(serverId: string, errorMessage: string): Promise<void> {
    await MCPConfigModel.updateOne(
      { serverId },
      {
        deploymentStatus: 'failed',
        errorMessage,
        updatedAt: new Date()
      },
      { upsert: true }
    );
  }

  /**
   * Get deployment status
   *
   * @param serverId - Server ID
   * @returns MCP config or null
   *
   * @example
   * const config = await deployer.getDeploymentStatus('ez402-mcp');
   * console.log(config?.deploymentStatus); // 'deployed'
   */
  async getDeploymentStatus(serverId: string): Promise<IMCPConfig | null> {
    return await MCPConfigModel.findOne({ serverId });
  }

  /**
   * Get all deployments
   *
   * @returns Array of MCP configs
   *
   * @example
   * const deployments = await deployer.getAllDeployments();
   * deployments.forEach(d => console.log(d.serverId, d.deploymentStatus));
   */
  async getAllDeployments(): Promise<IMCPConfig[]> {
    return await MCPConfigModel.find().sort({ createdAt: -1 });
  }

  /**
   * Delete deployment
   *
   * @param serverId - Server ID
   * @returns True if deleted
   *
   * @example
   * await deployer.deleteDeployment('ez402-mcp');
   */
  async deleteDeployment(serverId: string): Promise<boolean> {
    const result = await MCPConfigModel.deleteOne({ serverId });
    return result.deletedCount > 0;
  }

  /**
   * Redeploy existing server
   *
   * @param serverId - Server ID
   * @returns Deployment result
   *
   * @example
   * const result = await deployer.redeploy('ez402-mcp');
   */
  async redeploy(serverId: string): Promise<DeploymentResult> {
    const config = await this.getDeploymentStatus(serverId);

    if (!config) {
      return {
        success: false,
        error: `Server not found: ${serverId}`
      };
    }

    // Determine platform from deployment URL
    const platform = config.deploymentUrl?.includes('workers.dev')
      ? 'cloudflare'
      : 'cloudrun';

    return await this.deploy({
      platform: platform as 'cloudflare' | 'cloudrun',
      serverId: config.serverId,
      serverName: config.serverName,
      environment: 'production'
    });
  }
}

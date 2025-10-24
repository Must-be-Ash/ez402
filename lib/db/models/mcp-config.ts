/**
 * MCP Configuration Model
 *
 * MongoDB schema for MCP server deployment configurations
 * Tracks deployment status, URLs, and registered tools
 */

import mongoose, { Schema, Model, Document } from 'mongoose';

/**
 * MCP Configuration Interface
 */
export interface IMCPConfig {
  serverId: string;              // Unique server ID
  serverName: string;            // Display name
  deploymentUrl?: string;        // Cloudflare/Cloud Run URL
  deploymentStatus: 'pending' | 'deployed' | 'failed';
  transportType: 'stdio' | 'http';
  registeredTools: string[];     // Array of providerIds
  lastDeployedAt?: Date;
  errorMessage?: string;         // Deployment error details
  createdAt?: Date;              // Mongoose timestamp
  updatedAt?: Date;              // Mongoose timestamp
}

/**
 * MCP Document Interface (includes Mongoose document methods)
 */
export interface IMCPDocument extends IMCPConfig, Document {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * MCP Schema Definition
 */
const MCPConfigSchema = new Schema<IMCPDocument>(
  {
    serverId: {
      type: String,
      required: [true, 'Server ID is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9_-]+$/, 'Server ID must contain only lowercase letters, numbers, hyphens, and underscores'],
      maxlength: [100, 'Server ID must be less than 100 characters'],
      index: true
    },

    serverName: {
      type: String,
      required: [true, 'Server name is required'],
      trim: true,
      minlength: [3, 'Server name must be at least 3 characters'],
      maxlength: [200, 'Server name must be less than 200 characters']
    },

    deploymentUrl: {
      type: String,
      required: false,
      trim: true,
      validate: {
        validator: function(v: string) {
          // Allow empty or valid URL
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Must be a valid HTTP(S) URL'
      }
    },

    deploymentStatus: {
      type: String,
      enum: {
        values: ['pending', 'deployed', 'failed'],
        message: 'Deployment status must be pending, deployed, or failed'
      },
      default: 'pending',
      index: true
    },

    transportType: {
      type: String,
      enum: {
        values: ['stdio', 'http'],
        message: 'Transport type must be stdio or http'
      },
      default: 'http',
      required: [true, 'Transport type is required']
    },

    registeredTools: {
      type: [String],
      default: [],
      validate: {
        validator: function(tools: string[]) {
          // Ensure all tool IDs are valid
          return tools.every(tool => /^[a-z0-9_-]+$/.test(tool));
        },
        message: 'All tool IDs must contain only lowercase letters, numbers, hyphens, and underscores'
      }
    },

    lastDeployedAt: {
      type: Date,
      required: false
    },

    errorMessage: {
      type: String,
      required: false,
      trim: true,
      maxlength: [1000, 'Error message must be less than 1000 characters']
    }
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: 'mcp_configs'
  }
);

/**
 * Indexes for query performance
 */
MCPConfigSchema.index({ createdAt: -1 });
MCPConfigSchema.index({ serverId: 1, deploymentStatus: 1 });
MCPConfigSchema.index({ deploymentStatus: 1, updatedAt: -1 });

/**
 * Pre-save hook to ensure data consistency
 */
MCPConfigSchema.pre('save', function(next) {
  // Normalize serverId to lowercase
  if (this.serverId) {
    this.serverId = this.serverId.toLowerCase().trim();
  }

  // Update lastDeployedAt when status changes to deployed
  if (this.isModified('deploymentStatus') && this.deploymentStatus === 'deployed') {
    this.lastDeployedAt = new Date();
  }

  // Clear errorMessage when status is not failed
  if (this.deploymentStatus !== 'failed') {
    this.errorMessage = undefined;
  }

  next();
});

/**
 * Instance Methods
 */
MCPConfigSchema.methods = {
  /**
   * Mark deployment as successful
   */
  markDeployed(url: string): void {
    this.deploymentStatus = 'deployed';
    this.deploymentUrl = url;
    this.lastDeployedAt = new Date();
    this.errorMessage = undefined;
  },

  /**
   * Mark deployment as failed
   */
  markFailed(error: string): void {
    this.deploymentStatus = 'failed';
    this.errorMessage = error;
  },

  /**
   * Add a tool to registered tools
   */
  addTool(providerId: string): void {
    if (!this.registeredTools.includes(providerId)) {
      this.registeredTools.push(providerId);
    }
  },

  /**
   * Remove a tool from registered tools
   */
  removeTool(providerId: string): void {
    this.registeredTools = this.registeredTools.filter((id: string) => id !== providerId);
  }
};

/**
 * Static Methods
 */
MCPConfigSchema.statics = {
  /**
   * Find MCP config by server ID
   */
  findByServerId(serverId: string): Promise<IMCPDocument | null> {
    return this.findOne({ serverId: serverId.toLowerCase() });
  },

  /**
   * Find all deployed MCP servers
   */
  findDeployed(): Promise<IMCPDocument[]> {
    return this.find({ deploymentStatus: 'deployed' }).sort({ updatedAt: -1 });
  },

  /**
   * Find all pending deployments
   */
  findPending(): Promise<IMCPDocument[]> {
    return this.find({ deploymentStatus: 'pending' }).sort({ createdAt: 1 });
  }
};

/**
 * Export the model
 *
 * Use singleton pattern to avoid "Cannot overwrite model" error in Next.js
 */
const MCPConfigModel: Model<IMCPDocument> =
  mongoose.models.MCPConfig || mongoose.model<IMCPDocument>('MCPConfig', MCPConfigSchema);

export default MCPConfigModel;

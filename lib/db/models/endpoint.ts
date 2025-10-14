/**
 * Endpoint Model
 *
 * MongoDB schema for x402-wrapped endpoint configurations
 * Based on PRD Section 4.1.1
 */

import mongoose, { Schema, Model, Document } from 'mongoose';

/**
 * Endpoint Configuration Interface
 */
export interface IEndpointConfig {
  providerId: string;

  // Provider Info
  originalEndpoint: string;
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  requestBody?: Record<string, unknown>;
  price: number;
  walletAddress: string;

  // Authentication
  authMethod: 'header' | 'query' | 'none';
  authHeaderName?: string;
  queryParamName?: string;
  apiKey?: string;

  // Request/Response Specs
  curlExample: string;
  expectedResponse: Record<string, unknown>;
  customHeaders?: Record<string, string>;

  // x402 Metadata
  description: string;
  mimeType: string;
  outputSchema?: Record<string, unknown>;
  maxTimeoutSeconds: number;

  // System Fields
  isActive: boolean;

  // Stats (for future)
  totalRequests?: number;
  totalRevenue?: number;
}

/**
 * Endpoint Document Interface (includes Mongoose document methods)
 */
export interface IEndpointDocument extends IEndpointConfig, Document {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Endpoint Schema Definition
 */
const EndpointSchema = new Schema<IEndpointDocument>(
  {
    providerId: {
      type: String,
      required: [true, 'Provider ID is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9_-]+$/, 'Provider ID must contain only lowercase letters, numbers, hyphens, and underscores'],
      maxlength: [100, 'Provider ID must be less than 100 characters'],
      index: true
    },

    originalEndpoint: {
      type: String,
      required: [true, 'Original endpoint URL is required'],
      validate: {
        validator: (v: string) => /^https?:\/\/.+/.test(v),
        message: 'Must be a valid HTTP(S) URL'
      }
    },

    httpMethod: {
      type: String,
      enum: {
        values: ['GET', 'POST', 'PUT', 'DELETE'],
        message: 'HTTP method must be GET, POST, PUT, or DELETE'
      },
      default: 'GET',
      required: [true, 'HTTP method is required']
    },

    requestBody: {
      type: Schema.Types.Mixed,
      required: false
    },

    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0.0001, 'Price must be at least $0.0001'],
      max: [1000, 'Price must be less than $1000'],
      validate: {
        validator: (v: number) => Number.isFinite(v) && v > 0,
        message: 'Price must be a positive number'
      }
    },

    walletAddress: {
      type: String,
      required: [true, 'Wallet address is required'],
      validate: {
        validator: (v: string) => /^0x[a-fA-F0-9]{40}$/.test(v),
        message: 'Must be a valid Ethereum address'
      },
      index: true
    },

    authMethod: {
      type: String,
      enum: {
        values: ['header', 'query', 'none'],
        message: 'Auth method must be header, query, or none'
      },
      default: 'header'
    },

    authHeaderName: {
      type: String,
      required: function(this: IEndpointDocument) {
        return this.authMethod === 'header';
      },
      trim: true
    },

    queryParamName: {
      type: String,
      required: function(this: IEndpointDocument) {
        return this.authMethod === 'query';
      },
      trim: true,
      default: 'key' // Common default for API key query parameters
    },

    apiKey: {
      type: String,
      required: function(this: IEndpointDocument) {
        return this.authMethod !== 'none';
      }
    },

    curlExample: {
      type: String,
      required: [true, 'cURL example is required'],
      trim: true,
      minlength: [10, 'cURL example must be at least 10 characters']
    },

    expectedResponse: {
      type: Schema.Types.Mixed,
      required: [true, 'Expected response is required']
    },

    customHeaders: {
      type: Schema.Types.Mixed,
      required: false
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [500, 'Description must be less than 500 characters']
    },

    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
      enum: {
        values: ['application/json', 'text/html', 'text/plain', 'application/xml'],
        message: 'MIME type must be one of: application/json, text/html, text/plain, application/xml'
      },
      default: 'application/json'
    },

    outputSchema: {
      type: Schema.Types.Mixed,
      required: false
    },

    maxTimeoutSeconds: {
      type: Number,
      required: [true, 'Max timeout is required'],
      default: 60,
      min: [10, 'Timeout must be at least 10 seconds'],
      max: [300, 'Timeout must be less than 5 minutes']
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    totalRequests: {
      type: Number,
      default: 0,
      min: 0
    },

    totalRevenue: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: 'endpoints'
  }
);

/**
 * Indexes for query performance
 */
EndpointSchema.index({ createdAt: -1 });
EndpointSchema.index({ providerId: 1, isActive: 1 });

/**
 * Pre-save hook to ensure data consistency
 */
EndpointSchema.pre('save', function(next) {
  // Normalize wallet address to lowercase
  if (this.walletAddress) {
    this.walletAddress = this.walletAddress.toLowerCase();
  }

  // Ensure providerId is lowercase and trimmed
  if (this.providerId) {
    this.providerId = this.providerId.toLowerCase().trim();
  }

  next();
});

/**
 * Export the model
 *
 * Use singleton pattern to avoid "Cannot overwrite model" error in Next.js
 */
const EndpointModel: Model<IEndpointDocument> =
  mongoose.models.Endpoint || mongoose.model<IEndpointDocument>('Endpoint', EndpointSchema);

export default EndpointModel;

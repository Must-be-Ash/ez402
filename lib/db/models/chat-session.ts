/**
 * Chat Session Model
 *
 * MongoDB schema for storing chat sessions and message history
 */

import mongoose, { Schema, Model, Document } from 'mongoose';

/**
 * Tool Call Interface
 */
export interface IToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  metadata?: {
    price?: number;
    transaction?: string;
    executionTime?: string;
  };
}

/**
 * Message Interface
 */
export interface IMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: IToolCall[];
  timestamp: Date;
}

/**
 * Chat Session Interface
 */
export interface IChatSession {
  sessionId: string;
  userId?: string; // Optional: for user authentication
  title: string;
  messages: IMessage[];
  metadata: {
    totalMessages: number;
    totalTokens?: number;
    totalCost?: number;
    lastMessageAt: Date;
  };
  isActive: boolean;
}

/**
 * Chat Session Document Interface
 */
export interface IChatSessionDocument extends IChatSession, Document {
  createdAt: Date;
  updatedAt: Date;
  // Instance methods
  addMessage(message: Partial<IMessage>): void;
  updateToolCallResult(messageId: string, toolCallId: string, result: unknown, metadata?: Record<string, unknown>): void;
  archive(): void;
  generateTitle(): string;
}

/**
 * Chat Session Model Interface (includes static methods)
 */
export interface IChatSessionModel extends Model<IChatSessionDocument> {
  findBySessionId(sessionId: string): Promise<IChatSessionDocument | null>;
  findActiveByUserId(userId: string, limit?: number): Promise<IChatSessionDocument[]>;
  findRecent(limit?: number): Promise<IChatSessionDocument[]>;
}

/**
 * Message Schema
 */
const MessageSchema = new Schema<IMessage>(
  {
    id: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    toolCalls: [
      {
        id: String,
        name: String,
        arguments: Schema.Types.Mixed,
        result: Schema.Types.Mixed,
        metadata: {
          price: Number,
          transaction: String,
          executionTime: String
        }
      }
    ],
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

/**
 * Chat Session Schema
 */
const ChatSessionSchema = new Schema<IChatSessionDocument>(
  {
    sessionId: {
      type: String,
      required: [true, 'Session ID is required'],
      unique: true,
      index: true
    },
    userId: {
      type: String,
      required: false,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      default: 'New Chat',
      maxlength: [200, 'Title must be less than 200 characters']
    },
    messages: {
      type: [MessageSchema],
      default: []
    },
    metadata: {
      totalMessages: {
        type: Number,
        default: 0
      },
      totalTokens: {
        type: Number,
        required: false
      },
      totalCost: {
        type: Number,
        required: false,
        default: 0
      },
      lastMessageAt: {
        type: Date,
        default: Date.now
      }
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'chat_sessions'
  }
);

/**
 * Indexes
 */
ChatSessionSchema.index({ createdAt: -1 });
ChatSessionSchema.index({ userId: 1, isActive: 1 });
ChatSessionSchema.index({ 'metadata.lastMessageAt': -1 });

/**
 * Pre-save hook
 */
ChatSessionSchema.pre('save', function (next) {
  // Update totalMessages count
  this.metadata.totalMessages = this.messages.length;

  // Update lastMessageAt if messages exist
  if (this.messages.length > 0) {
    const lastMessage = this.messages[this.messages.length - 1];
    this.metadata.lastMessageAt = lastMessage.timestamp;
  }

  // Calculate total cost from tool calls
  let totalCost = 0;
  for (const message of this.messages) {
    if (message.toolCalls) {
      for (const toolCall of message.toolCalls) {
        if (toolCall.metadata?.price) {
          totalCost += toolCall.metadata.price;
        }
      }
    }
  }
  this.metadata.totalCost = totalCost;

  next();
});

/**
 * Instance Methods
 */
ChatSessionSchema.methods = {
  /**
   * Add a message to the session
   */
  addMessage(message: Omit<IMessage, 'timestamp'>): void {
    this.messages.push({
      ...message,
      timestamp: new Date()
    });
    this.metadata.lastMessageAt = new Date();
    this.metadata.totalMessages = this.messages.length;
  },

  /**
   * Update message with tool call result
   */
  updateToolCallResult(messageId: string, toolCallId: string, result: unknown, metadata?: Record<string, unknown>): void {
    const message = this.messages.find((m: IMessage) => m.id === messageId);
    if (message && message.toolCalls) {
      const toolCall = message.toolCalls.find((tc: IToolCall) => tc.id === toolCallId);
      if (toolCall) {
        toolCall.result = result;
        if (metadata) {
          toolCall.metadata = { ...toolCall.metadata, ...metadata };
        }
      }
    }
  },

  /**
   * Archive the session
   */
  archive(): void {
    this.isActive = false;
  },

  /**
   * Generate title from first user message
   */
  generateTitle(): string {
    const firstUserMessage = this.messages.find((m: IMessage) => m.role === 'user');
    if (firstUserMessage) {
      // Take first 50 characters of the message
      const title = firstUserMessage.content.slice(0, 50);
      return title.length < firstUserMessage.content.length ? `${title}...` : title;
    }
    return 'New Chat';
  }
};

/**
 * Static Methods
 */
ChatSessionSchema.statics = {
  /**
   * Find session by ID
   */
  findBySessionId(sessionId: string): Promise<IChatSessionDocument | null> {
    return this.findOne({ sessionId });
  },

  /**
   * Find active sessions for user
   */
  findActiveByUserId(userId: string, limit = 20): Promise<IChatSessionDocument[]> {
    return this.find({ userId, isActive: true })
      .sort({ 'metadata.lastMessageAt': -1 })
      .limit(limit);
  },

  /**
   * Find recent sessions
   */
  findRecent(limit = 20): Promise<IChatSessionDocument[]> {
    return this.find({ isActive: true })
      .sort({ 'metadata.lastMessageAt': -1 })
      .limit(limit);
  }
};

/**
 * Export the model
 */
const ChatSessionModel: IChatSessionModel =
  (mongoose.models.ChatSession as IChatSessionModel) || mongoose.model<IChatSessionDocument, IChatSessionModel>('ChatSession', ChatSessionSchema);

export default ChatSessionModel;

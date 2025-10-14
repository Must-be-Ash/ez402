/**
 * MongoDB Connection Utility
 *
 * Manages MongoDB connection with caching for serverless environments
 * Based on Next.js best practices for MongoDB integration
 */

import mongoose from 'mongoose';

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || {
  conn: null,
  promise: null
};

if (!global.mongoose) {
  global.mongoose = cached;
}

/**
 * Connect to MongoDB
 *
 * Uses cached connection in serverless environments to avoid
 * creating multiple connections
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  // Check for MONGODB_URI
  if (!process.env.MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  const MONGODB_URI = process.env.MONGODB_URI;

  // Return cached connection if available
  if (cached.conn) {
    return cached.conn;
  }

  // Create connection promise if not exists
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ MongoDB connected successfully');
      return mongoose;
    }).catch((error) => {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

/**
 * Disconnect from MongoDB
 *
 * Useful for cleanup in tests or when shutting down gracefully
 */
export async function disconnectFromDatabase(): Promise<void> {
  if (cached.conn) {
    await cached.conn.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log('✅ MongoDB disconnected successfully');
  }
}

/**
 * Check if MongoDB is connected
 */
export function isConnected(): boolean {
  return cached.conn !== null && mongoose.connection.readyState === 1;
}

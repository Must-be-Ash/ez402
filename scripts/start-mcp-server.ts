#!/usr/bin/env tsx

/**
 * Start MCP Server with Inspector
 * 
 * Starts the dynamic MCP server and optionally launches the MCP inspector
 * for debugging and testing tool interactions
 */

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { DynamicMCPServer } from '../lib/mcp/server';
import { connectToDatabase } from '../lib/db/connection';

/**
 * Start MCP server with stdio transport
 */
async function startMCPServer(): Promise<void> {
  console.log('🚀 Starting ez402 MCP Server...\n');

  try {
    // Connect to database
    console.log('📊 Connecting to database...');
    await connectToDatabase();
    console.log('✅ Database connected\n');

    // Create and start MCP server
    console.log('🔧 Initializing MCP server...');
    const server = new DynamicMCPServer();
    
    console.log('📡 Starting server with stdio transport...');
    console.log('💡 Use @modelcontextprotocol/inspector to connect and test tools\n');
    
    await server.start();
    
  } catch (error) {
    console.error('❌ Failed to start MCP server:', error);
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  // Check environment variables
  const requiredEnvVars = [
    'MONGODB_URI',
    'NEXT_PUBLIC_BASE_URL'
  ];

  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingEnvVars.forEach(envVar => console.error(`   • ${envVar}`));
    console.error('\nPlease set these environment variables and try again.');
    console.error('Copy .env.example to .env.local and fill in the values.');
    process.exit(1);
  }

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n👋 Shutting down MCP server...');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n👋 Shutting down MCP server...');
    process.exit(0);
  });

  await startMCPServer();
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Failed to start MCP server:', error);
    process.exit(1);
  });
}

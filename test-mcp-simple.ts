#!/usr/bin/env tsx

/**
 * Simple MCP Server Test
 * 
 * Tests MCP server functionality without complex database imports
 */

// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('🧪 Simple MCP Server Test');
console.log('=' .repeat(50));

// Check environment variables
console.log('📊 Environment Check:');
console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? '✅ SET' : '❌ NOT SET'}`);
console.log(`   NEXT_PUBLIC_BASE_URL: ${process.env.NEXT_PUBLIC_BASE_URL ? '✅ SET' : '❌ NOT SET'}`);
console.log(`   MCP_WALLET_PRIVATE_KEY: ${process.env.MCP_WALLET_PRIVATE_KEY ? '✅ SET' : '❌ NOT SET'}`);
console.log(`   CLOUDFLARE_API_TOKEN: ${process.env.CLOUDFLARE_API_TOKEN ? '✅ SET' : '❌ NOT SET'}`);
console.log(`   CLOUDFLARE_ACCOUNT_ID: ${process.env.CLOUDFLARE_ACCOUNT_ID ? '✅ SET' : '❌ NOT SET'}`);

async function runTests() {
  // Test MCP Generator Service (without database connection)
  console.log('\n🔧 Testing MCP Generator Service...');
  try {
    const { MCPGeneratorService } = await import('./lib/services/mcp-generator');
    const generator = new MCPGeneratorService();
    console.log('   ✅ MCP Generator Service created successfully');
    
    // Test tool creation from sample endpoint
    const sampleEndpoint = {
      providerId: 'test-api',
      originalEndpoint: 'https://api.example.com/test',
      httpMethod: 'GET' as const,
      price: 0.01,
      walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      authMethod: 'none' as const,
      curlExample: 'curl "https://api.example.com/test"',
      expectedResponse: { result: 'success' },
      description: 'Test API endpoint',
      mimeType: 'application/json',
      maxTimeoutSeconds: 30,
      isActive: true
    };
    
    const tool = generator.createToolFromEndpoint(sampleEndpoint);
    console.log(`   ✅ Tool created: ${tool.name}`);
    console.log(`   ✅ Description: ${tool.description}`);
    console.log(`   ✅ Price: $${tool.metadata.price}`);
    
    const isValid = generator.validateToolDefinition(tool);
    console.log(`   ✅ Tool validation: ${isValid ? 'PASS' : 'FAIL'}`);
    
  } catch (error) {
    console.log(`   ❌ MCP Generator Service failed: ${error}`);
  }

  // Test MCP Tools Helper
  console.log('\n🛠️  Testing MCP Tools Helper...');
  try {
    const { convertMCPToolToClaudeTool } = await import('./lib/mcp/tools');
    console.log('   ✅ MCP Tools Helper imported successfully');
  } catch (error) {
    console.log(`   ❌ MCP Tools Helper failed: ${error}`);
  }

  // Test Dynamic MCP Server (without starting it)
  console.log('\n🚀 Testing Dynamic MCP Server...');
  try {
    const { DynamicMCPServer } = await import('./lib/mcp/server');
    const server = new DynamicMCPServer();
    console.log('   ✅ Dynamic MCP Server created successfully');
    
    const tools = server.getTools();
    console.log(`   ✅ Tools map initialized: ${tools.size} tools`);
    
  } catch (error) {
    console.log(`   ❌ Dynamic MCP Server failed: ${error}`);
  }
}

// Run the tests
runTests().catch(console.error);

console.log('\n' + '=' .repeat(50));
console.log('🎉 Basic MCP Server components test complete!');
console.log('=' .repeat(50));

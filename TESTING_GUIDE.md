# MCP Server Testing Guide

This guide provides comprehensive instructions for testing the ez402 MCP server implementation according to **Task 2.4: Test MCP Server Locally**.

## 🎯 Testing Objectives

According to the technical spec, we need to verify:
- ✅ Tool registration and invocation
- ✅ x402 payment flow works through MCP
- ✅ Test with @modelcontextprotocol/inspector
- ✅ MCP server can be deployed to Cloudflare Workers

## 📋 Prerequisites

### 1. Environment Setup

Create a `.env.local` file with the following variables:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/ez402

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# MCP Server Wallet (for making x402 payments)
# Generate a test private key: npx viem generatePrivateKey
MCP_WALLET_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# CDP Facilitator (for x402 payments)
CDP_FACILITATOR_URL=https://facilitator.cdp.coinbase.com
CDP_FACILITATOR_API_KEY=your-api-key-here
```

### 2. Install Dependencies

```bash
# Install MCP Inspector globally
npm install -g @modelcontextprotocol/inspector

# Ensure all project dependencies are installed
pnpm install
```

### 3. Database Setup

Ensure MongoDB is running and accessible:

```bash
# Check MongoDB connection
mongosh "mongodb://localhost:27017/ez402"
```

## 🧪 Testing Methods

### Method 1: Automated Test Suite

Run the comprehensive test suite:

```bash
# Run all MCP server tests
pnpm test:mcp
```

This will test:
- Database connection
- MCP Generator Service
- Tool registration
- MCP server creation
- Tool invocation
- x402 payment flow

### Method 2: Manual Testing with MCP Inspector

#### Step 1: Start the MCP Server

```bash
# Start MCP server with stdio transport
pnpm mcp:server
```

Expected output:
```
🚀 Starting ez402 MCP Server...

📊 Connecting to database...
✅ Database connected

🔧 Initializing MCP server...
📡 Starting server with stdio transport...
💡 Use @modelcontextprotocol/inspector to connect and test tools

✅ Loaded 2 tools from database
✅ Server ready with 2 tools
📡 Listening for requests...
```

#### Step 2: Connect with MCP Inspector

In a new terminal:

```bash
# Connect to the MCP server
pnpm mcp:inspector
```

#### Step 3: Test Tool Interactions

In the inspector:
1. **List Tools**: Verify all registered endpoints appear as tools
2. **View Schemas**: Check tool input/output schemas
3. **Execute Tools**: Test tool invocations with sample parameters
4. **Monitor Responses**: Verify responses include payment information

### Method 3: Direct Tool Testing

Test individual tools programmatically:

```bash
# Test specific tool execution
npx tsx -e "
import { executeMCPTool, formatToolResult } from './lib/mcp/tools';

async function testTool() {
  const result = await executeMCPTool('your-tool-name', { param: 'value' });
  console.log(formatToolResult(result));
}

testTool().catch(console.error);
"
```

## 🔍 What to Test

### 1. Tool Registration ✅

**Test**: Verify tools are loaded from database
**Expected**: All active endpoints appear as MCP tools
**Check**:
```bash
# Should show registered tools
npx tsx -e "
import { getAllToolsMetadata } from './lib/mcp/tools';
getAllToolsMetadata().then(tools => {
  console.log('Available tools:', tools.map(t => t.name));
});
"
```

### 2. Tool Schemas ✅

**Test**: Verify tool input schemas are properly generated
**Expected**: Schemas match endpoint configurations
**Check**: In MCP inspector, verify:
- Required parameters are marked correctly
- Parameter types match expected values
- Descriptions are informative

### 3. Tool Invocation ✅

**Test**: Execute tools with valid parameters
**Expected**: Tools return expected responses
**Check**:
- Successful tool execution
- Proper error handling for invalid parameters
- Response format matches expected schema

### 4. x402 Payment Flow ✅

**Test**: Verify payment handling for paid endpoints
**Expected**: Automatic payment processing
**Check**:
- 402 responses are handled correctly
- Payment signatures are generated
- Retry with X-PAYMENT header succeeds
- Transaction information is returned

### 5. Error Handling ✅

**Test**: Verify graceful error handling
**Expected**: Clear error messages and proper fallbacks
**Check**:
- Invalid tool names
- Network failures
- Payment failures
- Database connection issues

## 📊 Expected Test Results

### ✅ Success Indicators

```
🧪 Starting MCP Server Test Suite

============================================================
📊 Testing database connection...
   Found 2 existing endpoints
   ✅ Database Connection (45ms)

🔧 Testing MCP Generator Service...
   Generated 2 tool definitions
   Server config: ez402-mcp-server v1.0.0
   Test tool: test-weather-api - Get current weather data for any city worldwide | GET | $0.01 per request | application/json
   Tool validation: PASS
   ✅ MCP Generator Service (123ms)

📝 Testing tool registration...
   Test endpoint already exists: test-weather-api
   Found test tool: test-weather-api - $0.01
   ✅ Tool Registration (67ms)

🚀 Testing MCP server creation...
   MCP server instance created
   Server instance accessible
   Tools map initialized (0 tools)
   Tools refreshed: 2 tools loaded
   ✅ MCP Server Creation (89ms)

🔧 Testing tool invocation...
   Tool execution result: SUCCESS
   Data received: {"weather":[{"main":"Clear","description":"clear sky"}],"main":{"temp":20.5,"humidity":65},"name":"London"}...
   Price: $0.01
   ✅ Tool Invocation (234ms)

💰 Testing x402 payment flow...
   Wallet configured - testing payment flow...
   Test tool found: test-weather-api
   Price: $0.01
   Endpoint: https://api.openweathermap.org/data/2.5/weather
   ✅ x402 Payment Flow (12ms)

🧹 Cleaning up test data...
   Test endpoint removed
   MCP server stopped
   ✅ Cleanup complete

============================================================
📊 TEST RESULTS SUMMARY
============================================================

Total Tests: 6
✅ Passed: 6
❌ Failed: 0
Success Rate: 100.0%

🎉 ALL TESTS PASSED! MCP Server is ready for Phase 3.
============================================================
```

### ❌ Common Issues and Solutions

#### Issue: Database Connection Failed
```
❌ Database Connection (45ms)
```
**Solution**: Check `MONGODB_URI` in `.env.local` and ensure MongoDB is running

#### Issue: No Tools Loaded
```
Tools refreshed: 0 tools loaded
```
**Solution**: Register some endpoints first via the registration form

#### Issue: Tool Invocation Fails
```
Tool execution result: FAILED
Error: Request failed: 404 Not Found
```
**Solution**: Ensure Next.js app is running on `NEXT_PUBLIC_BASE_URL`

#### Issue: Payment Flow Fails
```
Error: Wallet not configured - cannot make x402 payment
```
**Solution**: Set `MCP_WALLET_PRIVATE_KEY` in `.env.local`

## 🚀 Next Steps

Once all tests pass:

1. **✅ Task 2.4 Complete**: MCP Server testing is complete
2. **🔄 Move to Phase 3**: Begin Chat Interface Development
3. **📝 Document Results**: Update technical spec with test results
4. **🚀 Deploy**: Consider deploying MCP server to Cloudflare Workers

## 🔧 Troubleshooting

### MCP Inspector Not Connecting

```bash
# Check if MCP server is running
ps aux | grep tsx

# Restart MCP server
pkill -f "tsx scripts/start-mcp-server.ts"
pnpm mcp:server
```

### Tools Not Loading

```bash
# Check database connection and endpoints
npx tsx -e "
import { connectToDatabase } from './lib/db/connection';
import EndpointModel from './lib/db/models/endpoint';
connectToDatabase().then(async () => {
  const count = await EndpointModel.countDocuments({ isActive: true });
  console.log('Active endpoints:', count);
  const endpoints = await EndpointModel.find({ isActive: true });
  endpoints.forEach(e => console.log('-', e.providerId));
});
"
```

### Payment Issues

```bash
# Check wallet configuration
npx tsx -e "
import { privateKeyToAccount } from 'viem/accounts';
const privateKey = process.env.MCP_WALLET_PRIVATE_KEY;
if (privateKey) {
  const account = privateKeyToAccount(privateKey as \`0x\${string}\`);
  console.log('Wallet address:', account.address);
} else {
  console.log('No wallet configured');
}
"
```

## 📚 Additional Resources

- [MCP TypeScript SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Inspector Usage](https://github.com/modelcontextprotocol/inspector)
- [x402 Payment Protocol](https://www.x402.org/x402-whitepaper.pdf)
- [Viem Documentation](https://viem.sh/)

---

**Ready to proceed to Phase 3: Chat Interface Development! 🎉**

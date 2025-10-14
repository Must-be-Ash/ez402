# Testing MCP Server with Inspector

This guide shows how to test the ez402 MCP server using the official MCP inspector tool.

## Prerequisites

1. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Edit .env.local with your values
   # At minimum, you need:
   # - MONGODB_URI
   # - NEXT_PUBLIC_BASE_URL
   ```

2. **Install MCP Inspector**
   ```bash
   npm install -g @modelcontextprotocol/inspector
   ```

## Testing Steps

### Step 1: Start the MCP Server

```bash
# Start the MCP server with stdio transport
npx tsx scripts/start-mcp-server.ts
```

You should see output like:
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

### Step 2: Connect with MCP Inspector

In a new terminal:

```bash
# Connect to the MCP server
mcp-inspector
```

The inspector will:
1. Connect to your MCP server via stdio
2. List all available tools
3. Allow you to test tool invocations
4. Show tool schemas and responses

### Step 3: Test Tool Registration

In the inspector, you should see:
- **List of Tools**: All registered x402 endpoints as MCP tools
- **Tool Schemas**: Input/output schemas for each tool
- **Tool Descriptions**: Including pricing information

### Step 4: Test Tool Invocation

1. **Select a Tool**: Choose any tool from the list
2. **Fill Parameters**: Enter required parameters (e.g., city name for weather API)
3. **Execute**: Click "Execute" to test the tool
4. **View Response**: See the tool response and any payment information

### Step 5: Test x402 Payment Flow

For tools that require payment:
1. **Execute Tool**: Try to call a paid endpoint
2. **402 Response**: You should see a 402 "Payment Required" response
3. **Payment Handling**: The MCP server should automatically handle the payment
4. **Final Response**: After payment, you should get the actual API response

## Expected Behavior

### ✅ Success Indicators

- MCP server starts without errors
- Tools are loaded from database
- Inspector connects successfully
- Tool schemas are properly formatted
- Tool invocations work (with or without payment)
- x402 payment flow completes successfully

### ❌ Common Issues

1. **Database Connection Failed**
   - Check `MONGODB_URI` in `.env.local`
   - Ensure MongoDB is running

2. **No Tools Loaded**
   - Check if you have registered endpoints
   - Verify endpoints are marked as `isActive: true`

3. **Tool Invocation Fails**
   - Check `NEXT_PUBLIC_BASE_URL` in `.env.local`
   - Ensure the Next.js app is running on that URL

4. **Payment Flow Fails**
   - Check `MCP_WALLET_PRIVATE_KEY` in `.env.local`
   - Ensure wallet has sufficient funds
   - Verify CDP facilitator configuration

## Debugging Tips

### Check Server Logs

The MCP server logs detailed information:
```
🔧 Executing tool: weather-api
   Endpoint: http://localhost:3000/api/x402/weather-api
   Price: $0.01
💰 Payment required - handling x402 flow
💳 Payment signed - retrying request with X-PAYMENT header
✅ Tool executed successfully (payment made)
```

### Test Individual Components

```bash
# Test the MCP server components
npx tsx test-mcp-server.ts

# Test specific tool execution
npx tsx -e "
import { executeMCPTool } from './lib/mcp/tools';
executeMCPTool('your-tool-name', { param: 'value' })
  .then(result => console.log(result))
  .catch(error => console.error(error));
"
```

### Verify Database

```bash
# Connect to MongoDB and check endpoints
mongosh "your-mongodb-uri"
> use ez402
> db.endpoints.find({ isActive: true })
```

## Next Steps

Once testing is complete:

1. **Fix any issues** found during testing
2. **Document results** in the technical spec
3. **Proceed to Phase 3** - Chat Interface Development
4. **Deploy MCP server** to Cloudflare Workers (Phase 5)

## Troubleshooting

### MCP Inspector Not Connecting

```bash
# Check if MCP server is running
ps aux | grep tsx

# Restart MCP server
pkill -f "tsx scripts/start-mcp-server.ts"
npx tsx scripts/start-mcp-server.ts
```

### Tools Not Loading

```bash
# Check database connection
npx tsx -e "
import { connectToDatabase } from './lib/db/connection';
import EndpointModel from './lib/db/models/endpoint';
connectToDatabase().then(async () => {
  const count = await EndpointModel.countDocuments({ isActive: true });
  console.log('Active endpoints:', count);
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

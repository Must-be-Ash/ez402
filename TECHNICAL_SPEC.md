# Technical Specification: ez402 with Auto-Generated MCP Servers & AI Chat Interface

## Executive Summary

This specification outlines the extension of ez402 to automatically generate Model Context Protocol (MCP) servers for registered x402 endpoints and provide an interactive AI chat interface powered by Claude. Users will be able to register their API endpoints, and the system will automatically create MCP tools that can be invoked by Claude in a chat interface, with payments handled transparently via the x402 protocol.

**Key Value Propositions:**
- 🤖 **Auto-generate MCP servers** for any registered x402 endpoint
- 💬 **Built-in AI chat interface** with Claude integration
- 💰 **Transparent x402 payments** handled automatically for AI tool calls
- 🎨 **Interactive UI components** via MCP-UI for rich responses
- 🚀 **Deploy MCP servers** on-demand to Cloudflare Workers or Google Cloud Run

---

## Technical Stack

### Core Libraries (New Dependencies)

| Library | Version | Purpose |
|---------|---------|---------|
| `@modelcontextprotocol/sdk` | latest | MCP server and client creation |
| `@ai-sdk/anthropic` | latest | Claude AI integration via Vercel AI SDK |
| `ai` | latest | Vercel AI SDK for streaming responses |
| `assistant-ui` | latest | React chat UI components (shadcn-style) |
| `mcp-ui` | latest | Interactive UI components for MCP |
| `x402-axios` | latest | x402 payment handling for MCP tools |
| `viem` | ^2.38.0 | ✅ Already installed - wallet client for payments |

### Existing Stack (Reuse)
- Next.js 15.5.4 ✅
- React 19.1.0 ✅
- MongoDB with Mongoose ✅
- shadcn/ui components ✅
- Tailwind CSS ✅
- TypeScript ✅

### Deployment Options
- **MCP Server Hosting**: Cloudflare Workers (recommended) or Google Cloud Run
- **Web App**: Vercel (current deployment platform)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         ez402 Platform                           │
│                                                                   │
│  ┌────────────────┐         ┌──────────────────┐                │
│  │   Registration │────────▶│  MCP Generator   │                │
│  │   Flow (UI)    │         │   (New Service)  │                │
│  └────────────────┘         └────────┬─────────┘                │
│                                      │                            │
│                                      ▼                            │
│                          ┌───────────────────────┐               │
│                          │   MongoDB             │               │
│                          │   - endpoints         │               │
│                          │   - mcp_configs (NEW) │               │
│                          └───────────────────────┘               │
│                                      │                            │
│                                      ▼                            │
│  ┌────────────────────────────────────────────────────────┐     │
│  │              Dynamic MCP Server                         │     │
│  │  - Reads all active endpoints from MongoDB              │     │
│  │  - Generates MCP tools dynamically                      │     │
│  │  - Handles x402 payment flow via x402-axios             │     │
│  │  - Returns results with MCP-UI components               │     │
│  └────────────────────────────────────────────────────────┘     │
│                           │                                       │
│                           ▼                                       │
│  ┌────────────────────────────────────────────────────────┐     │
│  │              AI Chat Interface                          │     │
│  │  - assistant-ui React components                        │     │
│  │  - Vercel AI SDK for Claude streaming                   │     │
│  │  - MCP-UI renderer for interactive responses            │     │
│  │  - Chat history & context management                    │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   External Services   │
                    │                       │
                    │  - Anthropic Claude   │
                    │  - CDP Facilitator    │
                    │  - Provider APIs      │
                    └───────────────────────┘
```

---

## Key Components

### 1. MCP Server Generator Service

**Location**: `lib/services/mcp-generator.ts`

**Responsibilities:**
- Dynamically discover all active x402 endpoints from MongoDB
- Generate MCP tool definitions with proper schemas
- Create tool descriptions and metadata from endpoint configs
- Export server configuration for deployment

**Key Methods:**
```typescript
class MCPGeneratorService {
  // Generate MCP tool definitions from all active endpoints
  async generateToolDefinitions(): Promise<MCPToolDefinition[]>

  // Generate MCP server configuration
  async generateServerConfig(): Promise<MCPServerConfig>

  // Create a single tool definition from endpoint config
  createToolFromEndpoint(config: IEndpointConfig): MCPToolDefinition
}
```

### 2. Dynamic MCP Server

**Location**: `lib/mcp/server.ts` (or deployable to Cloudflare Workers)

**Responsibilities:**
- Initialize MCP server with @modelcontextprotocol/sdk
- Register tools dynamically on startup from MongoDB
- Handle tool invocations via x402-axios interceptor
- Return responses with MCP-UI components when applicable
- Support both stdio (local) and HTTP/SSE (remote) transports

**Implementation Pattern:**
```typescript
import { McpServer } from '@modelcontextprotocol/sdk';
import { createX402AxiosClient } from 'x402-axios';
import { createUIResource } from 'mcp-ui';

const server = new McpServer({
  name: 'ez402-dynamic-server',
  version: '1.0.0'
});

// Load all endpoints and register as tools
const endpoints = await EndpointModel.find({ isActive: true });

for (const endpoint of endpoints) {
  server.registerTool(
    endpoint.providerId,
    {
      title: endpoint.description,
      inputSchema: generateInputSchema(endpoint),
      outputSchema: endpoint.outputSchema
    },
    async (params) => {
      // Use x402-axios to make paid request
      const client = createX402AxiosClient(walletClient);
      const response = await client.request({
        url: `${baseUrl}/api/x402/${endpoint.providerId}`,
        method: endpoint.httpMethod,
        data: params
      });

      // Return with MCP-UI component if rich response needed
      return createToolResponse(response);
    }
  );
}
```

### 3. AI Chat Interface

**Location**: `app/chat/page.tsx`

**Responsibilities:**
- Render chat UI using assistant-ui components
- Stream Claude responses via Vercel AI SDK
- Connect to MCP server for tool availability
- Display interactive MCP-UI components in messages
- Manage chat history and context

**Component Structure:**
```typescript
import { useChat } from 'ai/react';
import { Thread, ThreadMessages, ThreadInput } from 'assistant-ui';
import { UIResourceRenderer } from 'mcp-ui/react';

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
    // Configure with MCP tools
  });

  return (
    <Thread>
      <ThreadMessages
        messages={messages}
        renderCustomContent={(message) => {
          // Render MCP-UI components if present
          if (message.uiResource) {
            return <UIResourceRenderer resource={message.uiResource} />;
          }
        }}
      />
      <ThreadInput />
    </Thread>
  );
}
```

### 4. Chat API Route (with MCP Tools)

**Location**: `app/api/chat/route.ts`

**Responsibilities:**
- Handle chat requests from frontend
- Initialize Claude via Vercel AI SDK
- Inject MCP tools as Claude tool definitions
- Stream responses with tool calls
- Execute tool calls via MCP server
- Return streaming text + UI components

**Implementation:**
```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { getMCPTools } from '@/lib/mcp/tools';

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Get all available MCP tools dynamically
  const mcpTools = await getMCPTools();

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    messages,
    tools: mcpTools,
    maxSteps: 5, // Allow multi-step tool usage
  });

  return result.toDataStreamResponse();
}
```

### 5. MCP Configuration Model

**Location**: `lib/db/models/mcp-config.ts`

**Purpose**: Store MCP server deployment configurations

**Schema:**
```typescript
interface IMCPConfig {
  serverId: string;              // Unique server ID
  serverName: string;            // Display name
  deploymentUrl?: string;        // Cloudflare/Cloud Run URL
  deploymentStatus: 'pending' | 'deployed' | 'failed';
  transportType: 'stdio' | 'http';
  registeredTools: string[];     // Array of providerIds
  createdAt: Date;
  updatedAt: Date;
}
```

### 6. MCP Deployment Service

**Location**: `lib/services/mcp-deployer.ts`

**Responsibilities:**
- Deploy MCP server to Cloudflare Workers (primary)
- Alternative: Deploy to Google Cloud Run
- Update deployment status in MongoDB
- Generate deployment URLs

**Methods:**
```typescript
class MCPDeployerService {
  async deployToCloudflare(config: MCPServerConfig): Promise<DeploymentResult>
  async deployToCloudRun(config: MCPServerConfig): Promise<DeploymentResult>
  async updateDeploymentStatus(serverId: string, status: string): Promise<void>
}
```

---

## Data Flow

### Endpoint Registration → MCP Tool Creation

```
1. User registers endpoint via /register
   ↓
2. Endpoint saved to MongoDB with providerId
   ↓
3. MCP Generator Service detects new endpoint
   ↓
4. Auto-generate MCP tool definition
   ↓
5. MCP Server loads new tool (hot reload or restart)
   ↓
6. Tool becomes available in chat interface
```

### Chat → Tool Call → x402 Payment → Response

```
1. User sends message: "Get weather for San Francisco"
   ↓
2. Claude determines to call get-weather tool (MCP tool)
   ↓
3. Chat API executes tool via MCP server
   ↓
4. MCP server makes request to /api/x402/weather-api
   ↓
5. x402-axios interceptor handles:
   - Receive 402 response with payment requirements
   - Sign payment with wallet
   - Retry with X-PAYMENT header
   ↓
6. Payment verified & settled via CDP Facilitator
   ↓
7. Provider API returns weather data
   ↓
8. MCP server wraps response in MCP-UI component (optional)
   ↓
9. Response streamed back to user via Claude
   ↓
10. UI renders interactive component in chat
```

---

## Environment Variables (New)

Add to `.env.local`:

```bash
# Anthropic API
ANTHROPIC_API_KEY=sk-ant-...

# MCP Server Wallet (for making x402 payments)
MCP_WALLET_PRIVATE_KEY=0x...

# Deployment (Cloudflare Workers)
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...

# OR Deployment (Google Cloud Run)
GCP_PROJECT_ID=...
GCP_SERVICE_ACCOUNT_KEY=...

# MCP Server URL (after deployment)
MCP_SERVER_URL=https://ez402-mcp.workers.dev
```

---

## Implementation Plan

### Phase 1: Foundation Setup ⚙️

- [x] **Task 1.1**: Install core dependencies ✅
  ```bash
  pnpm add @modelcontextprotocol/sdk @ai-sdk/anthropic ai assistant-ui mcp-ui x402-axios
  ```

- [x] **Task 1.2**: Create MongoDB schema for MCP configurations ✅
  - Create `lib/db/models/mcp-config.ts`
  - Define `IMCPConfig` interface and Mongoose schema
  - Add indexes for `serverId` and `deploymentStatus`

- [x] **Task 1.3**: Set up environment variables ✅
  - Add new variables to `.env.local`
  - Update `.env.example` with new variables
  - Document required credentials in README

### Phase 2: MCP Server Implementation 🔧

- [x] **Task 2.1**: Create MCP Generator Service ✅
  - Implement `lib/services/mcp-generator.ts`
  - Write `generateToolDefinitions()` method
  - Write `createToolFromEndpoint()` method
  - Add unit tests for tool generation

- [x] **Task 2.2**: Build Dynamic MCP Server ✅
  - Create `lib/mcp/server.ts`
  - Initialize `McpServer` from @modelcontextprotocol/sdk
  - Implement dynamic tool registration from MongoDB
  - Add x402-axios interceptor for payment handling
  - Support stdio transport for local testing

- [x] **Task 2.3**: Create MCP Tools Helper ✅
  - Implement `lib/mcp/tools.ts`
  - Write function to convert MCP tools to Claude tool format
  - Handle tool invocation and response formatting
  - Add support for MCP-UI resource creation

- [x] **Task 2.4**: Test MCP Server Locally ✅
  - Create test script `test-mcp-server.ts`
  - Test tool registration and invocation
  - Verify x402 payment flow works through MCP
  - Test with @modelcontextprotocol/inspector

### Phase 3: Chat Interface Development 💬

- [x] **Task 3.1**: Install and configure assistant-ui ✅
  ```bash
  npx assistant-ui init
  ```
  - Configure with shadcn/ui theme
  - Set up React providers and context

- [x] **Task 3.2**: Create Chat Page ✅
  - Build `app/chat/page.tsx`
  - Integrate `Thread`, `ThreadMessages`, `ThreadInput` from assistant-ui
  - Add chat history management
  - Style with Tailwind CSS

- [x] **Task 3.3**: Create Chat API Route ✅
  - Implement `app/api/chat/route.ts`
  - Initialize Claude via `@ai-sdk/anthropic`
  - Load MCP tools dynamically
  - Implement streaming with `streamText()`
  - Handle tool calls and responses

- [x] **Task 3.4**: Integrate MCP-UI Renderer ✅
  - Add `UIResourceRenderer` component
  - Create custom message renderer for MCP-UI resources
  - Test with sample interactive components
  - Add CSS/styling for UI resources

### Phase 4: MCP-UI Interactive Components 🎨

- [x] **Task 4.1**: Install and configure mcp-ui ✅
  ```bash
  pnpm add mcp-ui
  ```
  - Set up client-side renderer
  - Configure allowed content types

- [x] **Task 4.2**: Create UI Resource Factory ✅
  - Implement `lib/mcp/ui-factory.ts`
  - Write helper to create HTML UI resources
  - Write helper for Remote DOM components
  - Add templates for common response types

- [x] **Task 4.3**: Update MCP Tools to Return UI Resources ✅
  - Modify tool handlers in `lib/mcp/tools.ts`
  - Return UI resources for rich responses (charts, tables, etc.)
  - Fallback to plain text for simple responses

- [x] **Task 4.4**: Test Interactive Components ✅
  - Create sample tools with UI resources
  - Test rendering in chat interface
  - Verify sandbox security
  - Test event handling (intents)

### Phase 5: Deployment Infrastructure 🚀

- [x] **Task 5.1**: Create MCP Deployer Service ✅
  - Implement `lib/services/mcp-deployer.ts`
  - Write `deployToCloudflare()` method
  - Write `deployToCloudRun()` method (alternative)
  - Add deployment status tracking

- [x] **Task 5.2**: Create Cloudflare Worker Configuration ✅
  - Create `workers/mcp-server.ts` (entry point)
  - Configure wrangler.toml
  - Add HTTP/SSE transport support
  - Test local worker deployment

- [x] **Task 5.3**: Build Deployment API Route ✅
  - Create `app/api/mcp/deploy/route.ts`
  - Trigger deployment on endpoint registration
  - Update MCP config in MongoDB
  - Return deployment status and URL

- [x] **Task 5.4**: Create Deployment Dashboard ✅
  - Build `app/mcp/page.tsx`
  - Show list of deployed MCP servers
  - Display deployment status and URLs
  - Add manual redeploy button

### Phase 6: Auto-Generation Workflow 🔄

- [x] **Task 6.1**: Add Post-Registration Hook ✅
  - Update `app/api/register/route.ts`
  - Trigger MCP tool generation after successful registration
  - Update MCP server configuration
  - Queue deployment job

- [x] **Task 6.2**: Implement Hot Reload for MCP Server ✅
  - Add webhook endpoint: `app/api/mcp/reload/route.ts`
  - Trigger tool reload without redeployment
  - Cache tools in memory with TTL
  - Test hot reload functionality

- [x] **Task 6.3**: Create MCP Discovery Endpoint ✅
  - Implement `app/api/mcp/tools/route.ts`
  - Return list of all available MCP tools
  - Include tool schemas and metadata
  - Support filtering by category/provider

- [x] **Task 6.4**: Add Tool Testing in Registration Flow ✅
  - Extend registration form to test MCP tool
  - Validate tool works via MCP server before saving
  - Show preview of MCP tool definition
  - Allow editing tool metadata

### Phase 7: Chat Features & UX Enhancements ✨

- [x] **Task 7.1**: Add Chat History Persistence ✅
  - Create MongoDB schema for chat sessions
  - Save messages and tool calls to database
  - Implement session management
  - Add "Recent Chats" sidebar

- [x] **Task 7.2**: Add Tool Call Visibility ✅
  - Show when Claude is calling a tool
  - Display payment amount for x402 tools
  - Show transaction hash after payment
  - Add "View on BaseScan" link

- [ ] **Task 7.3**: Implement Multi-Step Workflows
  - Configure `maxSteps` for complex tasks
  - Show step-by-step progress in UI
  - Handle tool call chains (tool A → tool B)
  - Add abort/cancel functionality

- [ ] **Task 7.4**: Add Tool Suggestions
  - Show available tools in chat input
  - Add autocomplete for tool names
  - Display tool descriptions on hover
  - Create "Quick Actions" menu

### Phase 8: Testing & Quality Assurance 🧪

- [ ] **Task 8.1**: Write Unit Tests
  - Test MCP generator service
  - Test tool schema generation
  - Test x402 payment flow in tools
  - Test UI resource creation

- [ ] **Task 8.2**: Write Integration Tests
  - Test end-to-end chat flow
  - Test tool invocation via Claude
  - Test payment handling
  - Test deployment workflow

- [ ] **Task 8.3**: Test with Real x402 Endpoints
  - Register 3-5 real API endpoints
  - Test chat interface with each endpoint
  - Verify payments settle correctly
  - Test error handling (payment failures, API errors)

- [ ] **Task 8.4**: Performance Testing
  - Test MCP server response times
  - Test chat streaming performance
  - Test with multiple concurrent users
  - Optimize database queries

### Phase 9: Documentation 📚

- [ ] **Task 9.1**: Update README
  - Add chat interface documentation
  - Document MCP server setup
  - Add deployment instructions
  - Include usage examples

- [ ] **Task 9.2**: Create User Guide
  - Write guide for using chat interface
  - Document available commands
  - Explain how tools work
  - Add troubleshooting section

- [ ] **Task 9.3**: Create Developer Guide
  - Document MCP server architecture
  - Explain how to add custom tools
  - Document UI resource patterns
  - Add API reference

- [ ] **Task 9.4**: Update CLAUDE.md
  - Add MCP server architecture
  - Document chat interface implementation
  - Add deployment considerations
  - Include testing procedures

### Phase 10: Deployment & Launch 🎉

- [ ] **Task 10.1**: Deploy MCP Server to Production
  - Deploy to Cloudflare Workers
  - Configure custom domain
  - Set up monitoring and logging
  - Test production deployment

- [ ] **Task 10.2**: Deploy Web App to Vercel
  - Push to main branch
  - Verify environment variables
  - Test production build
  - Monitor for errors

- [ ] **Task 10.3**: Create Demo Video
  - Record registration flow
  - Show chat interface in action
  - Demonstrate tool calls and payments
  - Show interactive UI components

- [ ] **Task 10.4**: Launch & Monitor
  - Announce on social media
  - Monitor error logs
  - Collect user feedback
  - Plan v2 improvements

---

## Success Criteria

### Must Have ✅
- [ ] Users can register an endpoint and it becomes available as an MCP tool
- [ ] Chat interface can invoke MCP tools via Claude
- [ ] x402 payments are handled automatically for tool calls
- [ ] MCP server can be deployed to Cloudflare Workers
- [ ] Basic UI rendering with MCP-UI works

### Should Have 🎯
- [ ] Hot reload for new tools without redeployment
- [ ] Chat history persistence
- [ ] Tool call visibility with payment amounts
- [ ] Interactive UI components for rich responses
- [ ] Deployment dashboard

### Nice to Have 🌟
- [ ] Multi-step workflows with progress tracking
- [ ] Tool suggestions and autocomplete
- [ ] Voice input for chat
- [ ] Export chat history
- [ ] Mobile-responsive chat interface

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Claude API rate limits | Medium | Implement request throttling and queue |
| MCP server cold starts | Low | Use warm-up pings; consider always-on tier |
| x402 payment failures | Medium | Implement retry logic; show clear error messages |
| Wallet funding required | High | Document funding process; add balance checks |
| Cloudflare Workers limits | Low | Monitor usage; have Cloud Run fallback |
| MCP-UI sandbox issues | Medium | Test extensively; have plain text fallback |

---

## Cost Estimates (Monthly)

### Development Phase
- Cloudflare Workers (free tier): **$0**
- Anthropic API (dev usage ~$20): **$20**
- MongoDB Atlas (current): **$0** (existing)
- Vercel (current): **$0** (existing)

**Total Development**: ~$20/month

### Production (Estimated)
- Cloudflare Workers (paid tier): **$5-25**
- Anthropic API (production usage): **$100-500**
- MongoDB Atlas: **$0-25**
- Vercel: **$0-20**

**Total Production**: ~$105-570/month (scales with usage)

---

## Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Foundation | 1-2 days | None |
| Phase 2: MCP Server | 3-4 days | Phase 1 |
| Phase 3: Chat Interface | 2-3 days | Phase 1 |
| Phase 4: MCP-UI | 2-3 days | Phases 2, 3 |
| Phase 5: Deployment | 2-3 days | Phase 2 |
| Phase 6: Auto-Generation | 2-3 days | Phases 2, 5 |
| Phase 7: UX Enhancements | 2-3 days | Phases 3, 4 |
| Phase 8: Testing | 2-3 days | All phases |
| Phase 9: Documentation | 1-2 days | All phases |
| Phase 10: Launch | 1-2 days | All phases |

**Total Estimated Time**: 18-29 days (~4-6 weeks)

---

## Next Steps

1. **Review this specification** and provide feedback
2. **Approve the plan** to begin implementation
3. **Set up Anthropic API key** and other credentials
4. **Start with Phase 1** - Foundation setup

---

## References

- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [assistant-ui Documentation](https://github.com/assistant-ui/assistant-ui)
- [MCP-UI GitHub](https://github.com/idosal/mcp-ui)
- [Vercel AI SDK](https://ai-sdk.dev/)
- [x402 MCP Examples](https://github.com/coinbase/x402/tree/main/examples/typescript/mcp)
- [Cloudflare Workers MCP Guide](https://blog.cloudflare.com/remote-model-context-protocol-servers-mcp/)
- [x402 Whitepaper](https://www.x402.org/x402-whitepaper.pdf)

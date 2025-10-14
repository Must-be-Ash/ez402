# ez402 - Easy x402 Endpoint Wrapper Service

A Next.js application that makes it easy to wrap existing HTTP API endpoints with the x402 micropayment protocol, enabling instant monetization using USDC on Base network. Now featuring **auto-generated MCP servers** and an **AI chat interface** powered by Claude.

## Overview

This service allows API providers to wrap their existing endpoints with x402 protocol without modifying their original APIs. Clients pay per request using USDC on Base network, and payments are verified and settled via Coinbase's CDP Facilitator.

**New in v2:** Registered endpoints are automatically available as MCP (Model Context Protocol) tools that can be invoked by Claude in an interactive chat interface, with payments handled transparently.

## Features

### Core Features
- ✅ **Zero Code Changes**: Wrap existing APIs without modifications
- ✅ **Instant Monetization**: Set pricing and start earning immediately
- ✅ **Secure Payments**: On-chain USDC payments on Base network
- ✅ **Encrypted Storage**: API keys encrypted with AES-256-GCM
- ✅ **Automatic Settlement**: Payments settled directly to provider wallets
- ✅ **x402 Protocol**: Full HTTP 402 Payment Required implementation

### AI & MCP Features (New)
- 🤖 **Auto-Generated MCP Servers**: Endpoints automatically become AI tools
- 💬 **AI Chat Interface**: Built-in Claude-powered chat with tool calling
- 🎨 **Interactive UI Components**: Rich responses via MCP-UI
- 💰 **Transparent Payments**: x402 payments handled automatically for AI
- 🚀 **On-Demand Deployment**: Deploy MCP servers to Cloudflare Workers

## Tech Stack

### Core Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: MongoDB with Mongoose
- **Payments**: Coinbase CDP Facilitator
- **Blockchain**: Base Mainnet (USDC)
- **Authentication**: AES-256-GCM encryption
- **UI**: shadcn/ui + Tailwind CSS
- **Validation**: Zod + React Hook Form

### AI & MCP Stack
- **AI Model**: Claude 4 (Anthropic) via Vercel AI SDK
- **MCP Server**: @modelcontextprotocol/sdk
- **Chat UI**: assistant-ui (React)
- **Interactive UI**: mcp-ui
- **Payment Handler**: x402-axios
- **Wallet**: viem (Base network)

## Prerequisites

- Node.js 18+ and pnpm
- MongoDB Atlas account
- Coinbase CDP API credentials
- Base network wallet address (for receiving payments)
- **Anthropic API key** (for AI chat)
- **Base wallet with USDC** (for MCP server to make payments)

## Installation

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Configure environment variables in `.env.local`:
```bash
# MongoDB connection string
MONGODB_URI=mongodb+srv://...

# CDP credentials (get from https://portal.cdp.coinbase.com)
CDP_API_KEY_ID=your-key-id
CDP_API_KEY_SECRET=your-secret

# Generate encryption key
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Base URL (update for production)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# AI Chat - Anthropic API (get from https://console.anthropic.com)
ANTHROPIC_API_KEY=sk-ant-api03-...

# MCP Server Wallet - Private key with USDC on Base
MCP_WALLET_PRIVATE_KEY=0x...

# Optional: Cloudflare Workers deployment
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...
```

See `.env.example` for complete configuration options.

4. Run the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── chat/              # AI chat API (NEW)
│   │   ├── mcp/               # MCP server management (NEW)
│   │   ├── register/          # Endpoint registration
│   │   ├── test-endpoint/     # Endpoint testing
│   │   └── x402/[providerId]  # x402 proxy
│   ├── chat/                  # AI chat interface page (NEW)
│   └── register/              # Registration UI
├── components/                # React components
├── lib/
│   ├── db/
│   │   ├── models/
│   │   │   ├── endpoint.ts    # Endpoint configurations
│   │   │   └── mcp-config.ts  # MCP server configs (NEW)
│   │   └── connection.ts
│   ├── mcp/                   # MCP server implementation (NEW)
│   │   ├── server.ts          # Dynamic MCP server
│   │   ├── tools.ts           # MCP tool definitions
│   │   └── ui-factory.ts      # MCP-UI resources
│   ├── services/              # Core services
│   │   ├── mcp-generator.ts   # MCP tool generation (NEW)
│   │   ├── mcp-deployer.ts    # Cloudflare deployment (NEW)
│   │   ├── facilitator.ts     # CDP Facilitator
│   │   ├── payment-requirements.ts
│   │   ├── request-forwarder.ts
│   │   ├── encryption.ts
│   │   └── endpoint-tester.ts
│   ├── utils/                 # Utility functions
│   ├── constants.ts           # Configuration
│   ├── types.ts               # TypeScript types
│   └── validation.ts          # Zod schemas
└── middleware.ts              # CORS middleware
```

## Development

```bash
pnpm dev    # Start dev server
pnpm build  # Build for production
pnpm start  # Start production server
pnpm lint   # Lint code
```

## Usage

### 1. Register an Endpoint

Visit [http://localhost:3000/register](http://localhost:3000/register) and fill out the registration form:
- Original API endpoint URL
- HTTP method (GET, POST, PUT, DELETE)
- Price per request in USD
- Wallet address for payments
- Authentication method and credentials
- Description and metadata

### 2. Get Your Wrapped Endpoint

After registration, you'll receive:
- A wrapped x402 endpoint: `http://localhost:3000/api/x402/{providerId}`
- The endpoint is automatically available as an MCP tool

### 3. Use in AI Chat

Visit [http://localhost:3000/chat](http://localhost:3000/chat) to:
- Chat with Claude AI
- Claude can invoke your registered endpoints as tools
- Payments are handled automatically with x402 protocol
- See transaction hashes and payment details in the chat

### 4. Test x402 Payment Flow

Use the test script to verify your endpoint works with x402:
```bash
# Update ENDPOINT variable in test-x402-payment.ts
tsx test-x402-payment.ts
```

## How It Works

### Traditional x402 Flow

```
Client → [402 Response] → Sign Payment → [200 Response + Data]
```

### AI Chat Flow (New)

```
User → Claude Chat → Tool Call → MCP Server → x402 Endpoint → Payment → Data → Claude → User
```

The MCP server acts as a smart client that:
1. Receives tool calls from Claude
2. Makes x402 payment automatically with its wallet
3. Returns data to Claude for natural language response

## Deployment

### Web App (Vercel)
Deploy to Vercel and set environment variables in the dashboard.

### MCP Server (Cloudflare Workers)
MCP servers can be deployed to Cloudflare Workers for global edge distribution:
```bash
# Deploy from the dashboard at /mcp (coming soon)
# Or manually deploy to Cloudflare Workers
```

## Documentation

- See `CLAUDE.md` for AI-assisted development guidelines
- See `TECHNICAL_SPEC.md` for complete architecture and implementation details
- See `test.md` for testing documentation

## License

MIT

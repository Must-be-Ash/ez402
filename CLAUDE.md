# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ez402 is a Next.js application that wraps existing HTTP API endpoints with the x402 micropayment protocol, enabling instant monetization using USDC on Base network. The service acts as a payment proxy - API providers register their endpoints, and clients pay per request via on-chain USDC transfers verified by Coinbase's CDP Facilitator.

## Key Architecture

### x402 Payment Flow (app/api/x402/[providerId]/route.ts)

The main proxy endpoint implements a two-step payment flow:

1. **Initial Request (No X-PAYMENT header)**: Returns 402 status with `PaymentRequirements` in response body
2. **Paid Request (With X-PAYMENT header)**:
   - Verifies payment signature via CDP Facilitator (`/verify`)
   - Forwards request to original provider endpoint
   - Settles payment on-chain via CDP Facilitator (`/settle`)
   - Returns provider data with `X-PAYMENT-RESPONSE` header containing transaction details

### Core Services (lib/services/)

- **FacilitatorService**: Communicates with CDP Facilitator for payment verification and settlement. Uses JWT authentication with CDP API. Key methods:
  - `verify()`: Validates payment signature without executing on-chain transaction
  - `settle()`: Executes USDC.receiveWithAuthorization() on Base mainnet

- **PaymentRequirementsBuilder**: Constructs x402 `PaymentRequirements` objects from endpoint configuration. Converts USD prices to atomic USDC units (6 decimals).

- **RequestForwarder**: Forwards authenticated requests to original provider endpoints. Handles:
  - Query parameter preservation
  - API key injection (header or query param based on `authMethod`)
  - Request body forwarding for POST/PUT/DELETE
  - Custom headers from cURL parsing
  - Timeout handling

- **EncryptionService**: AES-256-GCM encryption for API keys stored in MongoDB

- **EndpointTester**: Tests provider endpoints during registration to validate connectivity and authentication

### Database (lib/db/)

MongoDB with Mongoose. Single collection: `endpoints`

**EndpointConfig Schema** (lib/db/models/endpoint.ts):
- `providerId`: Unique identifier generated from description (lowercase, hyphenated)
- `originalEndpoint`: Provider's actual API URL
- `httpMethod`: GET, POST, PUT, or DELETE
- `price`: USD price (stored as number, converted to atomic units for x402)
- `walletAddress`: Base address where payments are sent
- `authMethod`: 'header', 'query', or 'none'
- `apiKey`: Encrypted API key (if authMethod != 'none')
- `customHeaders`: Parsed from cURL example during registration
- `curlExample`, `expectedResponse`: Used for endpoint testing
- `mimeType`, `outputSchema`, `description`: x402 metadata

### Registration Flow (app/api/register/route.ts)

1. Validate registration form data with Zod
2. Parse cURL example to extract custom headers
3. Generate unique `providerId` from description
4. Test endpoint connectivity with provided credentials
5. Encrypt API key (if provided)
6. Save configuration to MongoDB
7. Return wrapped endpoint URL: `{baseUrl}/api/x402/{providerId}`

## Environment Variables

Required in `.env.local`:

```bash
MONGODB_URI=mongodb+srv://...           # MongoDB Atlas connection string
CDP_API_KEY_ID=...                      # Coinbase CDP API key ID
CDP_API_KEY_SECRET=...                  # Coinbase CDP API key secret
ENCRYPTION_KEY=...                      # 32-byte hex string for AES-256-GCM
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Base URL for wrapped endpoints
PRIVATE_KEY=0x...                       # (Optional) Private key for testing script
```

## Development Commands

```bash
pnpm dev       # Start dev server with Turbopack (http://localhost:3000)
pnpm build     # Build for production with Turbopack
pnpm start     # Start production server
pnpm lint      # Run ESLint
```

## Testing x402 Payments

Use `test-x402-payment.ts` to test the complete payment flow:

```bash
# 1. Set PRIVATE_KEY in .env.local (Base wallet with USDC)
# 2. Update ENDPOINT variable in test-x402-payment.ts to your wrapped endpoint
# 3. Run test script
tsx test-x402-payment.ts
```

The script demonstrates:
- Making initial 402 request
- Creating EIP-712 signature for USDC.transferWithAuthorization()
- Retrying with X-PAYMENT header
- Parsing X-PAYMENT-RESPONSE for transaction hash

## Constants and Configuration (lib/constants.ts)

All x402 parameters are hardcoded for Base Mainnet in V1:
- Network: Base (chainId 8453)
- USDC Contract: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- CDP Facilitator: `https://api.cdp.coinbase.com/platform/v2/x402`
- Price limits: $0.0001 - $1000
- Timeout limits: 10s - 300s

## Important Implementation Details

### Payment Signature (EIP-712)

Clients sign USDC `TransferWithAuthorization` messages with:
- `validAfter`: Current time - 10 minutes (x402 standard buffer)
- `validBefore`: Current time + endpoint's `maxTimeoutSeconds`
- `nonce`: Random 32-byte hex string (prevents replay attacks)

### cURL Parsing

During registration, cURL examples are parsed to extract custom headers. This allows providers to include authentication headers, content-type overrides, and other headers needed for their API without manually entering them.

### Error Handling

- 402 responses include `PaymentRequirements` in body
- 400 for invalid payment payloads (Zod validation)
- 404 for non-existent providerId
- 502 if provider endpoint fails
- Settlement failures are logged but don't block response (payment was verified)

### Authentication Methods

Three authentication strategies:
1. **header**: API key injected as request header (e.g., `Authorization: Bearer {key}`)
2. **query**: API key added as `api_key` query parameter
3. **none**: No authentication (public endpoints)

## Known Limitations

- Base Mainnet only (no testnet support)
- Single payment scheme: "exact" (no tipping, range payments)
- No payment retry logic for settlement failures
- No rate limiting or abuse prevention
- Provider endpoints must return JSON (configurable mimeType not fully implemented)

## Troubleshooting x402 Errors

When experiencing errors with x402 calls, use the context7 MCP to study the x402 documentation for proper request formatting and protocol requirements. Common issues:
- Invalid signature format in X-PAYMENT header
- Incorrect validAfter/validBefore windows
- Mismatched payment amounts between PaymentRequirements and PaymentPayload
- Wrong network or asset address

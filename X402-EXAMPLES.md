# x402 Payment Examples

This directory contains two complete x402 payment examples demonstrating different settlement patterns.

## Files Overview

### Test Scripts
- **`async-x402-example.ts`** - Async settlement (fast, fire-and-forget)
- **`sync-x402-example.ts`** - Sync settlement (agent-bid style, includes transaction hash)

### API Endpoints
- **`/api/x402/test-hello`** - Async settlement endpoint
- **`/api/x402/test-hello-sync`** - Sync settlement endpoint

## Usage

### Async Settlement (Fast)
```bash
# Start dev server
pnpm dev

# Run async example
npx tsx async-x402-example.ts "http://localhost:3000/api/x402/test-hello"
```

**Characteristics:**
- ✅ Fast response (service delivered immediately after verification)
- ❌ No transaction hash in client response
- 📝 Transaction hash logged on server
- 🔄 Settlement happens in background

### Sync Settlement (Agent-Bid Style)
```bash
# Start dev server
pnpm dev

# Run sync example
npx tsx sync-x402-example.ts "http://localhost:3000/api/x402/test-hello-sync"
```

**Characteristics:**
- ⏱️ Slower response (waits for settlement)
- ✅ Transaction hash in both response body and X-PAYMENT-RESPONSE header
- ✅ Guaranteed payment completion before service delivery
- 🔗 BaseScan link provided

## Key Differences

| Feature | Async | Sync |
|---------|-------|------|
| Response Time | Fast | Slower |
| Transaction Hash | Server logs only | Client response |
| Settlement Timing | Background | Before response |
| Use Case | High throughput | Critical payments |

## Implementation Details

Both examples use:
- **x402 SDK** (`verify`, `settle` from `x402/facilitator`)
- **viem** for wallet operations
- **EIP-3009** USDC authorization
- **Base Sepolia** testnet
- **CDP facilitator** for verification and settlement

## Transaction Examples

**Async Example Output:**
```
✅ Payment successful! Parsing settlement response...
⚠️  No X-PAYMENT-RESPONSE header found
📦 API Response: { "settlementStatus": "pending" }
```

**Sync Example Output:**
```
✅ X-PAYMENT-RESPONSE header found!
📦 Settlement Response:
   Success: true
   Transaction: 0xa59c6151645d35cccec6694bb72adcc0a2306102d49ffeefa954b1f00840f969
🔗 View on BaseScan: https://sepolia.basescan.org/tx/0xa59c6151645d35cccec6694bb72adcc0a2306102d49ffeefa954b1f00840f969
```

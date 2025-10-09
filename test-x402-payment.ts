/**
 * Test Script for x402 Payment to Anthropic Endpoint
 *
 * This script tests the x402 payment flow by:
 * 1. Making an initial request to get 402 response
 * 2. Creating a payment signature using EIP-712
 * 3. Retrying request with X-PAYMENT header
 * 4. Logging transaction hash for BaseScan verification
 */

import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { randomBytes } from 'crypto';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const ENDPOINT = 'http://localhost:3000/api/x402/anthropic_claude_api_generates_ai_responses_using';
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

// Claude API request body
const CLAUDE_REQUEST = {
  model: 'claude-sonnet-4-20250514',
  max_tokens: 4000,
  messages: [
    {
      role: 'user',
      content: 'Hello! Please respond with a brief greeting.'
    }
  ]
};

async function testX402Payment() {
  console.log('🚀 Starting x402 Payment Test');
  console.log('=================================\n');

  // Step 1: Create wallet account
  console.log('Step 1: Setting up wallet...');
  const account = privateKeyToAccount(PRIVATE_KEY);
  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http()
  }).extend(publicActions);

  console.log(`✅ Wallet address: ${account.address}`);
  console.log(`✅ Network: Base (chainId ${base.id})\n`);

  // Step 2: Make initial request to get 402 response
  console.log('Step 2: Making initial request (expecting 402)...');
  const initialResponse = await fetch(ENDPOINT, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  console.log(`Response status: ${initialResponse.status}`);

  if (initialResponse.status !== 402) {
    throw new Error(`Expected 402 Payment Required, got ${initialResponse.status}`);
  }

  const paymentResponse = await initialResponse.json();
  const { x402Version, accepts } = paymentResponse;
  const paymentRequirements = accepts[0];

  console.log('✅ Payment requirements received:');
  console.log(`   - Amount: ${paymentRequirements.maxAmountRequired} (${Number(paymentRequirements.maxAmountRequired) / 10**6} USDC)`);
  console.log(`   - Pay to: ${paymentRequirements.payTo}`);
  console.log(`   - Asset: ${paymentRequirements.asset}`);
  console.log(`   - Network: ${paymentRequirements.network}`);
  console.log(`   - Scheme: ${paymentRequirements.scheme}\n`);

  // Step 3: Create payment signature
  console.log('Step 3: Creating payment signature...');

  // Generate payment parameters
  const now = Math.floor(Date.now() / 1000);
  const validAfter = (now - 600).toString(); // 10 minutes before now (x402 standard)
  const validBefore = (now + (paymentRequirements.maxTimeoutSeconds || 3600)).toString();
  const nonce = `0x${randomBytes(32).toString('hex')}`;

  console.log(`   - validAfter: ${validAfter} (10 min before now)`);
  console.log(`   - validBefore: ${validBefore}`);
  console.log(`   - nonce: ${nonce}`);

  // EIP-712 domain for USDC
  const domain = {
    name: paymentRequirements.extra?.name || 'USD Coin',
    version: paymentRequirements.extra?.version || '2',
    chainId: await walletClient.getChainId(),
    verifyingContract: paymentRequirements.asset as `0x${string}`,
  };

  // EIP-712 types for USDC transferWithAuthorization
  const types = {
    TransferWithAuthorization: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
    ],
  };

  const authorizationMessage = {
    from: account.address,
    to: paymentRequirements.payTo,
    value: paymentRequirements.maxAmountRequired,
    validAfter,
    validBefore,
    nonce,
  };

  // Sign with EIP-712
  const signature = await account.signTypedData({
    domain,
    types,
    primaryType: 'TransferWithAuthorization',
    message: authorizationMessage,
  });

  console.log(`✅ Signature created: ${signature.substring(0, 20)}...${signature.substring(signature.length - 10)}\n`);

  // Step 4: Create payment payload
  console.log('Step 4: Building payment payload...');

  const paymentPayload = {
    x402Version,
    scheme: paymentRequirements.scheme,
    network: paymentRequirements.network,
    payload: {
      signature,
      authorization: {
        from: account.address,
        to: paymentRequirements.payTo,
        value: paymentRequirements.maxAmountRequired,
        validAfter,
        validBefore,
        nonce,
      },
    },
  };

  const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');
  console.log(`✅ Payment header created (${paymentHeader.length} bytes)\n`);

  // Step 5: Retry request with payment
  console.log('Step 5: Retrying request with payment...');

  const paidResponse = await fetch(ENDPOINT, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-PAYMENT': paymentHeader,
    }
  });

  console.log(`Response status: ${paidResponse.status}`);

  if (paidResponse.status !== 200) {
    const errorBody = await paidResponse.text();
    console.error('❌ Payment failed:', errorBody);
    throw new Error(`Payment failed: ${paidResponse.status}`);
  }

  // Step 6: Parse settlement response
  console.log('\n✅ Payment successful! Parsing settlement response...\n');

  const xPaymentResponseHeader = paidResponse.headers.get('x-payment-response');
  if (!xPaymentResponseHeader) {
    console.warn('⚠️  No X-PAYMENT-RESPONSE header found');
  } else {
    const paymentResponseData = JSON.parse(Buffer.from(xPaymentResponseHeader, 'base64').toString('utf-8'));
    console.log('💰 Payment Settlement Details:');
    console.log(`   - Transaction: ${paymentResponseData.transaction}`);
    console.log(`   - Network: ${paymentResponseData.network}`);
    console.log(`   - Payer: ${paymentResponseData.payer}`);
    console.log(`   - Success: ${paymentResponseData.success}`);
    console.log(`\n🔗 View on BaseScan: https://basescan.org/tx/${paymentResponseData.transaction}\n`);
  }

  // Get the response data
  const responseData = await paidResponse.json();
  console.log('📝 Claude API Response:');
  console.log(JSON.stringify(responseData, null, 2));

  console.log('\n=================================');
  console.log('✅ Test completed successfully!');
  console.log('=================================');
}

// Run the test
testX402Payment().catch((error) => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});

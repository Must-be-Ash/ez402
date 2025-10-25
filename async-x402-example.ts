/**
 * Async x402 Payment Example
 * 
 * Tests the complete x402 payment flow with ASYNC settlement:
 * 1. Check payer wallet USDC balance
 * 2. Make 402 call to get payment requirements
 * 3. Create payment signature
 * 4. Retry with X-PAYMENT header
 * 5. Service delivered immediately, settlement happens in background
 * 
 * Usage: npx tsx async-x402-example.ts
 *        npx tsx async-x402-example.ts "http://localhost:3000/api/x402/test-hello"
 */

import { createWalletClient, http, publicActions, createPublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { randomBytes } from 'crypto';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const USDC_BASE_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;

// ERC-20 ABI for balanceOf
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const;

async function checkBalance(address: string): Promise<{ eth: string; usdc: string }> {
  console.log(`\n💰 Checking balances for ${address}...`);
  
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  // Get ETH balance
  const ethBalance = await publicClient.getBalance({ address: address as `0x${string}` });

  // Get USDC balance
  const usdcBalance = await publicClient.readContract({
    address: USDC_BASE_SEPOLIA,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
  });

  const ethFormatted = (Number(ethBalance) / 1e18).toFixed(6);
  const usdcFormatted = (Number(usdcBalance) / 1e6).toFixed(6);

  console.log(`   ETH: ${ethFormatted}`);
  console.log(`   USDC: ${usdcFormatted}`);

  return {
    eth: ethFormatted,
    usdc: usdcFormatted,
  };
}

async function testX402Payment(endpoint: string) {
  console.log('🧪 Testing x402 Payment Flow');
  console.log('=================================\n');

  // Step 1: Create wallet account
  console.log('Step 1: Setting up wallet...');
  const account = privateKeyToAccount(PRIVATE_KEY);
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http()
  }).extend(publicActions);

  console.log(`✅ Wallet address: ${account.address}`);
  console.log(`✅ Network: Base Sepolia (chainId ${baseSepolia.id})`);

  // Check balance
  const balance = await checkBalance(account.address);
  
  if (parseFloat(balance.usdc) < 1) {
    console.log('\n⚠️  WARNING: USDC balance is very low!');
    console.log('   You need USDC on Base Sepolia to make x402 payments.');
    console.log('   Get testnet USDC from: https://portal.cdp.coinbase.com/');
    console.log('\n   Continuing anyway...\n');
  } else {
    console.log('\n✅ Sufficient USDC balance for testing\n');
  }

  // Step 2: Make initial request to get 402 response
  console.log(`Step 2: Making initial request to ${endpoint}...`);
  
  // Determine method based on endpoint
  const method = endpoint.includes('localhost') ? 'GET' : 'POST';
  const requestBody = method === 'POST' ? JSON.stringify({ query: 'test query' }) : undefined;
  
  const initialResponse = await fetch(endpoint, {
    method,
    headers: requestBody ? { 'Content-Type': 'application/json' } : undefined,
    body: requestBody
  });

  console.log(`Response status: ${initialResponse.status}`);

  if (initialResponse.status !== 402) {
    const body = await initialResponse.text();
    console.error(`❌ Expected 402 Payment Required, got ${initialResponse.status}`);
    console.error('Response body:', body);
    throw new Error(`Expected 402, got ${initialResponse.status}`);
  }

  const paymentResponse = await initialResponse.json();
  const { x402Version, accepts } = paymentResponse;
  const paymentRequirements = accepts[0];

  console.log('✅ Payment requirements received:');
  console.log(`   - Amount: ${paymentRequirements.maxAmountRequired} (${Number(paymentRequirements.maxAmountRequired) / 10**6} USDC)`);
  console.log(`   - Pay to: ${paymentRequirements.payTo}`);
  console.log(`   - Asset: ${paymentRequirements.asset}`);
  console.log(`   - Network: ${paymentRequirements.network}`);
  console.log(`   - Scheme: ${paymentRequirements.scheme}`);
  console.log(`   - Description: ${paymentRequirements.description}\n`);

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

  const paidResponse = await fetch(endpoint, {
    method,
    headers: {
      'X-PAYMENT': paymentHeader,
      ...(requestBody ? { 'Content-Type': 'application/json' } : {})
    },
    body: requestBody
  });

  console.log(`Response status: ${paidResponse.status}\n`);

  if (paidResponse.status !== 200) {
    const errorBody = await paidResponse.text();
    console.error('❌ Payment failed!');
    console.error('Response body:', errorBody);
    throw new Error(`Payment failed: ${paidResponse.status}`);
  }

  // Step 6: Parse settlement response
  console.log('✅ Payment successful! Parsing settlement response...\n');

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
    console.log(`\n🔗 View on BaseScan: https://sepolia.basescan.org/tx/${paymentResponseData.transaction}\n`);
  }

  // Get the response data
  const responseData = await paidResponse.json();
  console.log('📦 API Response:');
  console.log(JSON.stringify(responseData, null, 2));

  // Check final balance
  console.log('\n');
  await checkBalance(account.address);

  console.log('\n=================================');
  console.log('✅ Test completed successfully!');
  console.log('=================================');
}

// Run the test
// Use a known-working testnet endpoint from x402 discovery
// This is a Google Gemini search agent on Base Sepolia (0.01 USDC)
const DEFAULT_TESTNET_ENDPOINT = 'https://api-dev.intra-tls2.dctx.link/x402/agent/qrn:agent:682306635380bd59df4992fa';
const endpoint = process.argv[2] || DEFAULT_TESTNET_ENDPOINT;

console.log(`\nEndpoint: ${endpoint}`);
if (endpoint === DEFAULT_TESTNET_ENDPOINT) {
  console.log('Using Questflow Google Gemini Search Agent (testnet)');
  console.log('Price: 0.01 USDC on Base Sepolia\n');
}

testX402Payment(endpoint).catch((error) => {
  console.error('\n❌ Test failed:', error.message);
  if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});


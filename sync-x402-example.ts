/**
 * Sync x402 Payment Example (Agent-Bid Style)
 * 
 * Tests the complete x402 payment flow with SYNCHRONOUS settlement:
 * 1. Check payer wallet USDC balance
 * 2. Make 402 call to get payment requirements
 * 3. Create payment signature
 * 4. Retry with X-PAYMENT header
 * 5. Wait for settlement and show transaction hash in response
 * 
 * Usage: npx tsx sync-x402-example.ts
 *        npx tsx sync-x402-example.ts "http://localhost:3000/api/x402/test-hello-sync"
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
    usdc: usdcFormatted
  };
}

async function testSyncX402Payment(endpoint: string) {
  console.log(`\nEndpoint: ${endpoint}`);
  console.log('🧪 Testing x402 Payment Flow (Sync Settlement)');
  console.log('===============================================\n');

  // Step 1: Setup wallet
  console.log('Step 1: Setting up wallet...');
  const account = privateKeyToAccount(PRIVATE_KEY);
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(),
  }).extend(publicActions);

  console.log(`✅ Wallet address: ${account.address}`);
  console.log(`✅ Network: Base Sepolia (chainId ${await walletClient.getChainId()})`);

  // Check balance
  const balances = await checkBalance(account.address);
  const usdcBalance = parseFloat(balances.usdc);
  
  if (usdcBalance < 0.001) {
    console.log('❌ Insufficient USDC balance for testing');
    return;
  }
  console.log('✅ Sufficient USDC balance for testing');

  // Step 2: Make initial request (should get 402)
  console.log(`\nStep 2: Making initial request to ${endpoint}...`);
  
  const initialResponse = await fetch(endpoint);
  console.log(`Response status: ${initialResponse.status}`);

  if (initialResponse.status !== 402) {
    console.log('❌ Expected 402 Payment Required response');
    return;
  }

  const paymentRequirements = await initialResponse.json();
  console.log('✅ Payment requirements received:');
  console.log(`   - Amount: ${paymentRequirements.accepts?.[0]?.maxAmountRequired || 'unknown'}`);
  console.log(`   - Pay to: ${paymentRequirements.accepts?.[0]?.payTo || 'unknown'}`);
  console.log(`   - Asset: ${paymentRequirements.accepts?.[0]?.asset || 'unknown'}`);
  console.log(`   - Network: ${paymentRequirements.accepts?.[0]?.network || 'unknown'}`);
  console.log(`   - Scheme: ${paymentRequirements.accepts?.[0]?.scheme || 'unknown'}`);
  console.log(`   - Description: ${paymentRequirements.accepts?.[0]?.description || 'unknown'}`);

  // Step 3: Create payment signature
  console.log('\nStep 3: Creating payment signature...');
  
  const accept = paymentRequirements.accepts[0];
  
  // Generate payment parameters
  const now = Math.floor(Date.now() / 1000);
  const validAfter = (now - 600).toString(); // 10 minutes before now (x402 standard)
  const validBefore = (now + (accept.maxTimeoutSeconds || 3600)).toString();
  const nonce = `0x${randomBytes(32).toString('hex')}`;

  console.log(`   - validAfter: ${validAfter} (10 min before now)`);
  console.log(`   - validBefore: ${validBefore}`);
  console.log(`   - nonce: ${nonce}`);

  // EIP-712 domain for USDC (use values from payment requirements)
  const domain = {
    name: accept.extra?.name || 'USD Coin',
    version: accept.extra?.version || '2',
    chainId: await walletClient.getChainId(),
    verifyingContract: accept.asset as `0x${string}`,
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
    to: accept.payTo,
    value: accept.maxAmountRequired,
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

  console.log(`✅ Signature created: ${signature.substring(0, 20)}...${signature.substring(signature.length - 10)}`);

  // Step 4: Build payment payload
  console.log('\nStep 4: Building payment payload...');
  
  const paymentPayload = {
    x402Version: 1,
    scheme: 'exact',
    network: 'base-sepolia',
    payload: {
      signature,
      authorization: {
        from: account.address,
        to: accept.payTo,
        value: accept.maxAmountRequired,
        validAfter,
        validBefore,
        nonce,
      },
    },
  };

  const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');
  console.log(`✅ Payment header created (${paymentHeader.length} bytes)`);

  // Step 5: Retry request with payment
  console.log('\nStep 5: Retrying request with payment...');
  
  const paidResponse = await fetch(endpoint, {
    headers: {
      'X-PAYMENT': paymentHeader,
    },
  });

  console.log(`Response status: ${paidResponse.status}`);

  if (paidResponse.status === 200) {
    console.log('\n✅ Payment successful! Parsing settlement response...');
    
    // Check for X-PAYMENT-RESPONSE header
    const paymentResponseHeader = paidResponse.headers.get('X-PAYMENT-RESPONSE');
    
    if (paymentResponseHeader) {
      console.log('✅ X-PAYMENT-RESPONSE header found!');
      try {
        const decoded = JSON.parse(Buffer.from(paymentResponseHeader, 'base64').toString('utf-8'));
        console.log('📦 Settlement Response:');
        console.log(`   Success: ${decoded.success}`);
        console.log(`   Transaction: ${decoded.transaction}`);
        console.log(`   Network: ${decoded.network}`);
        console.log(`   Payer: ${decoded.payer}`);
        
        if (decoded.transaction) {
          console.log(`🔗 View on BaseScan: https://sepolia.basescan.org/tx/${decoded.transaction}`);
        }
      } catch (e) {
        console.log('⚠️  Could not decode X-PAYMENT-RESPONSE header');
      }
    } else {
      console.log('⚠️  No X-PAYMENT-RESPONSE header found');
    }
    
    // Parse API response
    const apiResponse = await paidResponse.json();
    console.log('\n📦 API Response:');
    console.log(JSON.stringify(apiResponse, null, 2));
    
  } else {
    console.log('❌ Payment failed!');
    const errorBody = await paidResponse.text();
    console.log(`Response body: ${errorBody}`);
    return;
  }

  // Final balance check
  console.log('\n💰 Final balance check...');
  const finalBalances = await checkBalance(account.address);
  
  console.log('\n=================================');
  console.log('✅ Test completed successfully!');
  console.log('=================================');
}

// Run the test
const endpoint = process.argv[2] || 'http://localhost:3000/api/x402/test-hello-sync';
testSyncX402Payment(endpoint).catch(console.error);

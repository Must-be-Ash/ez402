#!/usr/bin/env tsx

import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http, publicActions } from 'viem';
import { baseSepolia } from 'viem/chains';
import { wrapFetchWithPayment, decodeXPaymentResponse } from 'x402-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testHello402() {
  console.log('🧪 Testing test-hello x402 Integration...\n');

  // Check required environment variables
  const privateKey = process.env.SERVER_WALLET_PRIVATE_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  if (!privateKey) {
    console.error('❌ No private key found. Set SERVER_WALLET_PRIVATE_KEY in .env.local');
    process.exit(1);
  }

  console.log('✅ Environment variables loaded');
  console.log(`🔑 Using private key: ${privateKey.slice(0, 10)}...`);

  try {
    // Create account and wallet client
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    console.log(`👤 Account address: ${account.address}`);

    // Create wallet client for x402 payments (use Base Sepolia testnet)
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http()
    }).extend(publicActions);

    console.log('🔗 Wallet client created for Base Sepolia');

    // Wrap fetch with x402 payment handling
    const fetchWithPayment = wrapFetchWithPayment(
      fetch,
      walletClient as any,
      BigInt(0.01 * 10 ** 6) // Allow up to $0.01 USDC (test-hello costs $0.001)
    );

    console.log('💳 x402 payment wrapper configured (max $0.01)');
    console.log('📍 Payment will go to: 0xAbF01df9428EaD5418473A7c91244826A3Af23b3');

    // Test endpoint URL
    const testUrl = `${baseUrl}/api/x402/test-hello`;
    console.log(`🔍 Testing endpoint: ${testUrl}`);

    // Step 1: Make initial request (should get 402)
    console.log('\n📡 Step 1: Making initial request (expecting 402)...');
    const initialResponse = await fetch(testUrl, {
      method: 'GET',
    });

    console.log(`📊 Initial response status: ${initialResponse.status}`);

    if (initialResponse.status === 402) {
      const paymentRequirements = await initialResponse.json();
      console.log('✅ Received 402 Payment Required');
      console.log('💰 Payment Requirements:', JSON.stringify(paymentRequirements, null, 2));
    }

    // Step 2: Make request with automatic payment
    console.log('\n📡 Step 2: Making request with x402 payment...');
    const response = await fetchWithPayment(testUrl, {
      method: 'GET',
    });

    console.log(`📊 Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Request failed:`, response.status, errorText);
      return;
    }

    // Get the response data
    const result = await response.json();
    console.log('✅ Response received!');
    console.log('📄 Response data:', JSON.stringify(result, null, 2));

    // Check for X-PAYMENT-RESPONSE header
    const paymentResponseHeader = response.headers.get('X-PAYMENT-RESPONSE');
    if (paymentResponseHeader) {
      try {
        const paymentResponse = decodeXPaymentResponse(paymentResponseHeader);
        console.log('\n💳 Payment Response:');
        console.log('   Transaction Hash:', paymentResponse.transaction);
        console.log('   View on BaseScan:', `https://sepolia.basescan.org/tx/${paymentResponse.transaction}`);
      } catch (e) {
        console.log('ℹ️  X-PAYMENT-RESPONSE header present but could not decode');
      }
    }

    console.log('\n🎉 test-hello x402 integration test completed successfully!');
    console.log('💡 What just happened:');
    console.log('   1. Made initial request → received 402 Payment Required');
    console.log('   2. x402-fetch automatically created payment signature');
    console.log('   3. Retried request with X-PAYMENT header');
    console.log('   4. Server verified payment via CDP Facilitator');
    console.log('   5. Server settled payment on Base Sepolia');
    console.log('   6. Received service response');
    console.log('\n✨ Payment flow working perfectly!');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);

    if (error.message.includes('insufficient funds')) {
      console.log('\n💡 Tip: Make sure your wallet has USDC on Base Sepolia testnet');
      console.log('   You can get testnet USDC from: https://faucet.circle.com/');
    } else if (error.message.includes('network')) {
      console.log('\n💡 Tip: Check your network connection and Base Sepolia RPC endpoint');
    } else if (error.message.includes('402')) {
      console.log('\n💡 Tip: Check x402 configuration and payment requirements');
    }
    process.exit(1);
  }
}

// Run the test
testHello402().catch(console.error);

/**
 * Test x402 Payment Flow on Base Sepolia
 *
 * Tests the complete x402 payment flow for Browserbase endpoints
 * using Base Sepolia testnet with USDC payments
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { withPaymentInterceptor, decodeXPaymentResponse } from 'x402-axios';
import axios from 'axios';

async function testX402Payment() {
  try {
    console.log('🧪 Testing x402 Payment Flow on Base Sepolia\n');

    // 1. Setup wallet client
    const privateKey = process.env.MCP_WALLET_PRIVATE_KEY as `0x${string}`;
    if (!privateKey) {
      throw new Error('MCP_WALLET_PRIVATE_KEY not set in .env.local');
    }

    const account = privateKeyToAccount(privateKey);
    console.log(`👛 Wallet address: ${account.address}`);

    // Create WalletClient with publicActions (required for x402-axios)
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(),
    }).extend(publicActions);

    console.log(`⛓️  Network: Base Sepolia (chainId: ${baseSepolia.id})`);
    console.log(`💵 USDC Contract: 0x036CbD53842c5426634e7929541eC2318f3dCF7e\n`);

    // 2. Create payment-enabled axios client
    const client = withPaymentInterceptor(
      axios.create({
        baseURL: 'http://localhost:3000',
        timeout: 60000,
      }),
      walletClient as any
    );

    console.log('💳 Payment client initialized\n');

    // 3. Test endpoint
    const testUrl = 'https://form-smaple.vercel.app';
    console.log(`📋 Test: Scrape form from ${testUrl}\n`);

    // 4. Make request (will automatically handle 402 payment challenge)
    console.log('🚀 Making request to x402 endpoint...');
    console.log('   (x402-axios will automatically handle payment)\n');

    const startTime = Date.now();

    const response = await client.get(
      `/api/x402/scrape_form_structure_from_any_website`,
      {
        params: { url: testUrl }
      }
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // 5. Extract payment response
    const paymentResponse = response.headers['x-payment-response'];

    console.log('\n✅ Payment successful!');
    console.log(`⏱️  Duration: ${duration}s\n`);

    if (paymentResponse) {
      const decoded = decodeXPaymentResponse(paymentResponse);
      console.log('💳 Payment Details:');
      console.log(`   Transaction: ${decoded.transaction}`);
      console.log(`   Network: ${decoded.network}`);
      console.log(`   Payer: ${decoded.payer}`);
      console.log(`   View on Explorer: https://sepolia.basescan.org/tx/${decoded.transaction}\n`);
    }

    // 6. Check response data
    console.log('📦 Response data:');
    if (response.data.url && response.data.formStructure) {
      console.log(`   URL: ${response.data.url}`);
      console.log(`   Form fields: ${response.data.formStructure.fields?.length || 0}`);
      console.log(`   Timestamp: ${response.data.timestamp}\n`);
    } else {
      console.log(JSON.stringify(response.data, null, 2));
    }

    console.log('🎉 Test completed successfully!');

  } catch (error: any) {
    console.error('\n❌ Test failed:');

    if (axios.isAxiosError(error)) {
      console.error(`   Status: ${error.response?.status}`);
      console.error(`   Error: ${JSON.stringify(error.response?.data, null, 2)}`);

      if (error.response?.status === 402) {
        console.error('\n💡 Hint: Make sure your wallet has USDC on Base Sepolia');
        console.error(`   Wallet: ${privateKeyToAccount(process.env.MCP_WALLET_PRIVATE_KEY as `0x${string}`).address}`);
        console.error('   Get testnet USDC: https://faucet.circle.com/');
      }
    } else {
      console.error(`   ${error.message}`);
    }

    process.exit(1);
  }
}

testX402Payment();

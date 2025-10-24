/**
 * Test x402 Payment for Form Scraping Endpoint
 *
 * Makes a single isolated x402 payment call to test the full flow
 */

import { config } from 'dotenv';
import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import axios from 'axios';

// Load environment variables
config({ path: '.env.local' });

// Configuration
const ENDPOINT = 'http://localhost:3000/api/x402/scrape_form_structure_from_any_website';
const TEST_URL = 'https://form-smaple.vercel.app/';
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;

async function testX402Payment() {
  try {
    console.log('🧪 Testing x402 Payment for Form Scraping Endpoint\n');

    // 1. Setup wallet
    const account = privateKeyToAccount(PRIVATE_KEY);
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(),
    }).extend(publicActions);

    console.log(`💳 Using wallet: ${account.address}`);
    console.log(`⛓️  Network: Base Sepolia (chainId: ${baseSepolia.id})`);
    console.log(`📍 Endpoint: ${ENDPOINT}\n`);

    // 2. Make initial request (expecting 402)
    console.log('📤 Step 1: Making initial request (expecting 402)...');
    let response;

    try {
      response = await axios.get(ENDPOINT, {
        params: { url: TEST_URL },
        validateStatus: () => true, // Accept all status codes
      });
    } catch (error) {
      console.error('❌ Initial request failed:', error);
      throw error;
    }

    if (response.status !== 402) {
      console.log(`⚠️  Expected 402, got ${response.status}`);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return;
    }

    console.log('✅ Received 402 Payment Required');

    // 3. Extract payment requirements
    const paymentRequirements = response.data.accepts?.[0];
    if (!paymentRequirements) {
      console.error('❌ No payment requirements in response');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return;
    }

    console.log('\n💰 Payment Requirements:');
    console.log(`   Amount: ${paymentRequirements.maxAmountRequired} (${parseFloat(paymentRequirements.maxAmountRequired) / 1000000} USDC)`);
    console.log(`   Pay To: ${paymentRequirements.payTo}`);
    console.log(`   Asset: ${paymentRequirements.asset}`);
    console.log(`   Network: ${paymentRequirements.network}`);

    // 4. Create payment signature
    console.log('\n📝 Step 2: Creating payment signature...');

    const now = Math.floor(Date.now() / 1000);
    const validAfter = (now - 600).toString(); // 10 minutes ago
    const validBefore = (now + paymentRequirements.maxTimeoutSeconds).toString();
    const nonce = `0x${require('crypto').randomBytes(32).toString('hex')}`;

    const domain = {
      name: paymentRequirements.extra?.name || 'USD Coin',
      version: paymentRequirements.extra?.version || '2',
      chainId: baseSepolia.id,
      verifyingContract: paymentRequirements.asset as `0x${string}`,
    };

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

    const message = {
      from: account.address,
      to: paymentRequirements.payTo,
      value: paymentRequirements.maxAmountRequired,
      validAfter,
      validBefore,
      nonce,
    };

    const signature = await account.signTypedData({
      domain,
      types,
      primaryType: 'TransferWithAuthorization',
      message,
    });

    console.log('✅ Signature created');

    // 5. Create payment payload
    const paymentPayload = {
      x402Version: 1,
      scheme: 'exact',
      network: 'base-sepolia',
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

    // 6. Retry with payment
    console.log('\n📤 Step 3: Retrying request with payment...');

    const paidResponse = await axios.get(ENDPOINT, {
      params: { url: TEST_URL },
      headers: {
        'X-PAYMENT': paymentHeader,
      },
      validateStatus: () => true,
    });

    console.log(`\n📨 Response Status: ${paidResponse.status}`);

    if (paidResponse.status === 200) {
      console.log('✅ Payment successful!');

      // Check for payment response header
      const paymentResponseHeader = paidResponse.headers['x-payment-response'];
      if (paymentResponseHeader) {
        const paymentResponse = JSON.parse(Buffer.from(paymentResponseHeader, 'base64').toString());
        console.log('\n💳 Payment Response:');
        console.log(`   Transaction: ${paymentResponse.transaction}`);
        console.log(`   Network: ${paymentResponse.network}`);
        console.log(`   Payer: ${paymentResponse.payer}`);
        console.log(`\n🔗 View on BaseScan: https://sepolia.basescan.org/tx/${paymentResponse.transaction}`);
      }

      // Show form data
      console.log('\n📋 Form Data Received:');
      console.log(`   Form Title: ${paidResponse.data.formStructure.formTitle}`);
      console.log(`   Fields Found: ${paidResponse.data.formStructure.fields.length}`);
      console.log(`   Submit Button: ${paidResponse.data.formStructure.submitButtonText}`);

    } else {
      console.log('❌ Payment failed');
      console.log('Response:', JSON.stringify(paidResponse.data, null, 2));
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response:', error.response?.data);
    }
  }
}

// Run the test
testX402Payment();

/**
 * Direct Facilitator API Test
 * 
 * Tests the CDP facilitator verify and settle endpoints directly
 */

import { createFacilitatorConfig } from '@coinbase/x402';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { randomBytes } from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const USDC_BASE_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const TEST_RECIPIENT = '0xabf01df9428ead5418473a7c91244826a3af23b3'; // Your recipient address

async function testFacilitatorDirect() {
  console.log('🧪 Testing CDP Facilitator Directly');
  console.log('=====================================\n');

  // 1. Setup wallet
  const account = privateKeyToAccount(PRIVATE_KEY);
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http()
  });

  console.log(`Payer: ${account.address}`);
  console.log(`Recipient: ${TEST_RECIPIENT}`);
  console.log(`USDC Contract: ${USDC_BASE_SEPOLIA}\n`);

  // 2. Create facilitator config
  const facilitatorConfig = createFacilitatorConfig(
    process.env.CDP_API_KEY_ID!,
    process.env.CDP_API_KEY_SECRET!
  );

  console.log(`Facilitator URL: ${facilitatorConfig.url}\n`);

  // 3. Create payment signature
  const now = Math.floor(Date.now() / 1000);
  const validAfter = (now - 600).toString(); // 10 min ago
  const validBefore = (now + 3600).toString(); // 1 hour from now
  const nonce = `0x${randomBytes(32).toString('hex')}`;
  const amount = '10000'; // 0.01 USDC

  console.log('Payment Details:');
  console.log(`  Amount: ${amount} (0.01 USDC)`);
  console.log(`  ValidAfter: ${validAfter} (${new Date(Number(validAfter) * 1000).toISOString()})`);
  console.log(`  ValidBefore: ${validBefore} (${new Date(Number(validBefore) * 1000).toISOString()})`);
  console.log(`  Nonce: ${nonce}\n`);

  // 4. Sign EIP-712 message
  const domain = {
    name: 'USD Coin',
    version: '2',
    chainId: await walletClient.getChainId(),
    verifyingContract: USDC_BASE_SEPOLIA as `0x${string}`,
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
    to: TEST_RECIPIENT,
    value: amount,
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

  console.log(`Signature: ${signature.substring(0, 20)}...${signature.substring(signature.length - 10)}\n`);

  // 5. Create payment payload
  const paymentPayload = {
    x402Version: 1 as const,
    scheme: 'exact' as const,
    network: 'base-sepolia' as const,
    payload: {
      signature,
      authorization: {
        from: account.address,
        to: TEST_RECIPIENT,
        value: amount,
        validAfter,
        validBefore,
        nonce,
      },
    },
  };

  // 6. Create payment requirements
  const paymentRequirements = {
    scheme: 'exact' as const,
    network: 'base-sepolia' as const,
    maxAmountRequired: amount,
    resource: 'http://test.example.com/test',
    description: 'Test payment',
    mimeType: 'application/json',
    payTo: TEST_RECIPIENT,
    maxTimeoutSeconds: 120,
    asset: USDC_BASE_SEPOLIA,
    extra: {
      name: 'USD Coin',
      version: '2'
    }
  };

  // 7. Get auth headers
  if (!facilitatorConfig.createAuthHeaders) {
    throw new Error('createAuthHeaders not available');
  }
  const authHeaders = await facilitatorConfig.createAuthHeaders();

  // 8. Test VERIFY endpoint
  console.log('Step 1: Testing /verify endpoint...');
  
  const verifyBody = {
    x402Version: 1,
    paymentPayload,
    paymentRequirements
  };

  console.log('\nVerify Request Body:');
  console.log(JSON.stringify(verifyBody, null, 2));
  console.log('');

  const verifyResponse = await fetch(`${facilitatorConfig.url}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders.verify
    },
    body: JSON.stringify(verifyBody)
  });

  console.log(`Verify Response Status: ${verifyResponse.status}`);
  const verifyResult = await verifyResponse.json();
  console.log('Verify Result:', JSON.stringify(verifyResult, null, 2));
  console.log('');

  if (!verifyResult.isValid) {
    console.error('❌ Verify failed!');
    return;
  }

  console.log('✅ Verify succeeded!\n');

  // 9. Test SETTLE endpoint
  console.log('Step 2: Testing /settle endpoint...');
  
  const settleBody = {
    x402Version: 1,
    paymentPayload,
    paymentRequirements
  };

  console.log('\nSettle Request Body:');
  console.log(JSON.stringify(settleBody, null, 2));
  console.log('');

  const settleResponse = await fetch(`${facilitatorConfig.url}/settle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders.settle
    },
    body: JSON.stringify(settleBody)
  });

  console.log(`Settle Response Status: ${settleResponse.status}`);
  
  if (!settleResponse.ok) {
    const errorText = await settleResponse.text();
    console.error('❌ Settle failed!');
    console.error('Error Response:', errorText);
    return;
  }

  const settleResult = await settleResponse.json();
  console.log('Settle Result:', JSON.stringify(settleResult, null, 2));

  if (settleResult.success) {
    console.log(`\n✅ Settlement successful!`);
    console.log(`Transaction: https://sepolia.basescan.org/tx/${settleResult.transaction}`);
  } else {
    console.log(`\n❌ Settlement failed: ${settleResult.errorReason}`);
  }
}

testFacilitatorDirect().catch(error => {
  console.error('\n❌ Test failed:', error.message);
  if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});


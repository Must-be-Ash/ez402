import { CdpClient } from '@coinbase/cdp-sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function fundWithCDP() {
  console.log('🚰 Funding wallet from CDP Faucet...\n');
  
  const client = new CdpClient({
    apiKeyId: process.env.CDP_API_KEY_ID!,
    apiKeySecret: process.env.CDP_API_KEY_SECRET!,
  });

  const address = '0xeDeE7Ee27e99953ee3E99acE79a6fbc037E31C0D';
  
  console.log(`Address: ${address}`);
  console.log('Requesting USDC from CDP faucet on Base Sepolia...\n');

  try {
    const result = await client.evm.requestFaucet({
      address,
      network: 'base-sepolia',
      token: 'usdc'
    });

    console.log(`✅ Faucet request successful!`);
    console.log(`Transaction: https://sepolia.basescan.org/tx/${result.transactionHash}`);
  } catch (error: any) {
    console.error('❌ Faucet request failed:', error.message);
    if (error.response) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

fundWithCDP();

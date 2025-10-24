/**
 * Discover x402 Protected Endpoints
 * 
 * Uses the x402 facilitator to discover public endpoints on the network
 */

import { useFacilitator } from 'x402/verify';
import { facilitator } from '@coinbase/x402';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { list } = useFacilitator(facilitator);

async function discoverEndpoints() {
  console.log('🔍 Discovering x402 Protected Endpoints...');
  console.log('=========================================\n');

  try {
    const response = await list();
    
    if (!response.items || response.items.length === 0) {
      console.log('No x402 endpoints discovered on the network.');
      return;
    }

    console.log(`Found ${response.items.length} x402 protected endpoint(s):\n`);
    
    // Filter for testnet endpoints
    const testnetEndpoints = response.items.filter(item => 
      item.accepts.some(accept => accept.network === 'base-sepolia')
    );

    console.log(`📊 Testnet (base-sepolia) endpoints: ${testnetEndpoints.length}\n`);

    testnetEndpoints.forEach((item, index) => {
      console.log(`\n[${index + 1}] ${item.resource}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`  Type: ${item.type}`);
      console.log(`  Last Updated: ${new Date(item.lastUpdated).toLocaleString()}`);
      console.log(`  X402 Version: ${item.x402Version}`);
      
      item.accepts.forEach((accept, i) => {
        console.log(`\n  Payment Option ${i + 1}:`);
        console.log(`    Network: ${accept.network}`);
        console.log(`    Scheme: ${accept.scheme}`);
        console.log(`    Price: ${Number(accept.maxAmountRequired) / 1e6} USDC`);
        console.log(`    Pay To: ${accept.payTo}`);
        console.log(`    Description: ${accept.description}`);
        console.log(`    MIME Type: ${accept.mimeType}`);
      });
      
      if (item.metadata && Object.keys(item.metadata).length > 0) {
        console.log(`\n  Metadata:`);
        console.log(`    ${JSON.stringify(item.metadata, null, 4).replace(/\n/g, '\n    ')}`);
      }
      console.log('');
    });

    // Also show mainnet endpoints for reference
    const mainnetEndpoints = response.items.filter(item => 
      item.accepts.some(accept => accept.network === 'base')
    );

    if (mainnetEndpoints.length > 0) {
      console.log(`\n\n📊 Mainnet (base) endpoints: ${mainnetEndpoints.length}`);
      console.log('(Note: These require real USDC on Base mainnet)\n');

      mainnetEndpoints.forEach((item, index) => {
        console.log(`\n[${index + 1}] ${item.resource}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        
        item.accepts.forEach((accept, i) => {
          if (accept.network === 'base') {
            console.log(`  Price: ${Number(accept.maxAmountRequired) / 1e6} USDC`);
            console.log(`  Description: ${accept.description}`);
          }
        });
      });
    }

    console.log('\n=========================================');
    console.log('✅ Discovery complete!');
    
  } catch (error: any) {
    console.error('\n❌ Error discovering endpoints:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

discoverEndpoints();


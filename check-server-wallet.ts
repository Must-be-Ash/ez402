import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

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

const USDC_BASE_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

async function checkServerWallet() {
  console.log('🔍 Checking Server Wallet Balance\n');
  console.log('================================\n');

  const serverPrivateKey = process.env.SERVER_WALLET_PRIVATE_KEY as `0x${string}`;
  if (!serverPrivateKey) {
    console.error('❌ SERVER_WALLET_PRIVATE_KEY not found in .env.local');
    return;
  }

  const serverAccount = privateKeyToAccount(serverPrivateKey);
  console.log(`Server Wallet: ${serverAccount.address}\n`);

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  // Get ETH balance
  const ethBalance = await publicClient.getBalance({ address: serverAccount.address });
  const ethFormatted = (Number(ethBalance) / 1e18).toFixed(6);

  // Get USDC balance
  const usdcBalance = await publicClient.readContract({
    address: USDC_BASE_SEPOLIA,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [serverAccount.address],
  });
  const usdcFormatted = (Number(usdcBalance) / 1e6).toFixed(6);

  console.log(`ETH Balance:  ${ethFormatted} ETH`);
  console.log(`USDC Balance: ${usdcFormatted} USDC\n`);

  // Check if server wallet has enough ETH for gas
  const minEthForGas = 0.001; // Minimum ETH needed for settlement transactions
  
  if (parseFloat(ethFormatted) < minEthForGas) {
    console.log('❌ PROBLEM FOUND!');
    console.log(`Server wallet needs at least ${minEthForGas} ETH for gas fees to settle transactions.`);
    console.log(`Current balance: ${ethFormatted} ETH\n`);
    console.log('💡 Solution:');
    console.log('   Fund the server wallet with testnet ETH from:');
    console.log('   https://portal.cdp.coinbase.com/ (CDP Faucet)');
    console.log('   or');
    console.log('   https://www.alchemy.com/faucets/base-sepolia\n');
  } else {
    console.log(`✅ Server wallet has sufficient ETH for gas (${ethFormatted} ETH)`);
  }

  console.log('================================');
}

checkServerWallet().catch(console.error);


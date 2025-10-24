import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const USDC_BASE_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const;

async function checkBalance() {
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  const address = '0x16CA9e69E97EF3E740f573E79b913183BF500C18' as `0x${string}`;

  const ethBalance = await publicClient.getBalance({ address });
  const usdcBalance = await publicClient.readContract({
    address: USDC_BASE_SEPOLIA,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
  });

  console.log(`\n💰 Wallet Balance Check`);
  console.log(`Address: ${address}`);
  console.log(`ETH Balance: ${(Number(ethBalance) / 1e18).toFixed(6)} ETH`);
  console.log(`USDC Balance: ${(Number(usdcBalance) / 1e6).toFixed(6)} USDC`);
  console.log(`\n${Number(usdcBalance) === 0 ? '❌ No USDC! Need to fund wallet with testnet USDC' : '✅ USDC available'}`);
  console.log(`\nGet testnet USDC from:`);
  console.log(`  https://faucet.circle.com/ (Base Sepolia USDC)`);
  console.log(`  OR use CDP SDK to request from faucet`);
}

checkBalance();

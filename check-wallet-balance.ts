import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkBalance() {
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  const address = '0x16CA9e69E97EF3E740f573E79b913183BF500C18' as `0x${string}`;
  const balance = await publicClient.getBalance({ address });
  console.log(`Wallet: ${address}`);
  console.log(`ETH Balance: ${(Number(balance) / 1e18).toFixed(6)} ETH`);
  console.log(`\nNote: Need ETH for gas fees on Base Sepolia`);
  console.log(`Get testnet ETH from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet`);
}

checkBalance();

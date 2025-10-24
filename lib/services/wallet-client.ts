/**
 * Wallet Client for x402 Payments
 *
 * Creates a viem wallet client for x402 facilitator operations
 * Matches agent-bid pattern exactly
 */

import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http, publicActions } from 'viem';
import { baseSepolia } from 'viem/chains';

/**
 * Get server wallet client for x402 payments
 *
 * Creates a viem wallet client with the server's private key
 * for use with x402 verify/settle functions
 */
export async function getServerWalletClient() {
  const serverPrivateKey = process.env.SERVER_WALLET_PRIVATE_KEY;
  if (!serverPrivateKey) {
    throw new Error('SERVER_WALLET_PRIVATE_KEY not set in environment');
  }

  const account = privateKeyToAccount(serverPrivateKey as `0x${string}`);

  // Create wallet client with public actions for x402
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(),
  }).extend(publicActions);

  return walletClient;
}

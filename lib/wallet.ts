import { createWalletClient, http, publicActions } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

/**
 * Server Wallet Service for x402 Payment Settlement
 *
 * This wallet is used to settle x402 payments on-chain.
 * The server pays gas to execute USDC.receiveWithAuthorization(),
 * which transfers USDC from the payer to the server.
 *
 * Requirements:
 * - SERVER_WALLET_PRIVATE_KEY env var must be set
 * - Wallet must have ETH on Base Sepolia for gas
 * - Used by x402/facilitator for verify() and settle()
 */

export async function getServerWalletClient() {
  const serverPrivateKey = process.env.SERVER_WALLET_PRIVATE_KEY;
  if (!serverPrivateKey) {
    throw new Error('SERVER_WALLET_PRIVATE_KEY not set in environment');
  }

  const account = privateKeyToAccount(serverPrivateKey as `0x${string}`);

  // Create wallet client with public actions for x402
  // Type is intentionally inferred to ensure compatibility with x402's Signer type
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(),
  }).extend(publicActions);

  return walletClient;
}

export async function getServerWalletAddress(): Promise<string> {
  const walletClient = await getServerWalletClient();
  return walletClient.account.address;
}

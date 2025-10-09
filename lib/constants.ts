/**
 * Network Configuration for x402 Protocol
 *
 * Hardcoded for V1 (Base Mainnet Only)
 *
 * Based on PRD Section 10.2
 */

export const NETWORK_CONFIG = {
  network: 'base',
  chainId: 8453,
  usdcContract: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  usdcDecimals: 6,
  facilitatorUrl: 'https://api.cdp.coinbase.com/platform/v2/x402',
  rpcUrl: 'https://mainnet.base.org',
  explorerUrl: 'https://basescan.org'
} as const;

/**
 * USDC token configuration for Base mainnet
 */
export const USDC_BASE_MAINNET = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

/**
 * USDC has 6 decimal places
 * Example: 1 USDC = 1,000,000 atomic units
 */
export const USDC_DECIMALS = 6;

/**
 * x402 Protocol version
 */
export const X402_VERSION = 1;

/**
 * CDP SDK and x402 SDK versions for correlation headers
 */
export const CDP_SDK_VERSION = '1.38.3';
export const X402_SDK_VERSION = '0.5.1';

/**
 * Default timeout for provider endpoint requests (in seconds)
 */
export const DEFAULT_TIMEOUT_SECONDS = 60;

/**
 * Minimum and maximum price limits (in USDC)
 */
export const PRICE_LIMITS = {
  min: 0.0001,  // $0.0001 minimum
  max: 1000,    // $1000 maximum
} as const;

/**
 * Timeout limits for provider endpoints (in seconds)
 */
export const TIMEOUT_LIMITS = {
  min: 10,   // 10 seconds minimum
  max: 300,  // 5 minutes maximum
} as const;

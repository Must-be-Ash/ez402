/**
 * Payment Requirements Builder
 *
 * Constructs x402 PaymentRequirements from endpoint configuration
 * Based on PRD Section 6.1
 */

import { IEndpointConfig } from '../db/models/endpoint';
import { PaymentRequirements } from '../types';
import { NETWORK_CONFIG_SEPOLIA, USDC_DECIMALS } from '../constants';

export class PaymentRequirementsBuilder {
  /**
   * Build payment requirements from endpoint config and request URL
   *
   * @param config - Endpoint configuration from MongoDB
   * @param requestUrl - Full URL of the request being made
   * @returns PaymentRequirements object for 402 response
   *
   * @example
   * const builder = new PaymentRequirementsBuilder();
   * const requirements = builder.build(config, 'https://ourdomain.com/api/x402/firecrawl?query=test');
   * // Returns PaymentRequirements with all fields populated
   */
  build(config: IEndpointConfig, requestUrl: string): PaymentRequirements {
    return {
      scheme: 'exact',
      network: NETWORK_CONFIG_SEPOLIA.network, // Base Sepolia testnet
      maxAmountRequired: this.calculateMaxAmountRequired(config.price),
      resource: requestUrl,
      description: config.description,
      mimeType: config.mimeType,
      outputSchema: config.outputSchema,
      payTo: config.walletAddress,
      maxTimeoutSeconds: config.maxTimeoutSeconds,
      asset: NETWORK_CONFIG_SEPOLIA.usdcContract, // Base Sepolia USDC
      extra: {
        name: 'USDC',
        version: '2'
      }
    };
  }

  /**
   * Convert USD price to atomic USDC units
   *
   * USDC has 6 decimal places, so 1 USDC = 1,000,000 atomic units
   *
   * @param priceUSD - Price in USD (e.g., 0.01 for $0.01)
   * @returns String representation of atomic units
   *
   * @example
   * builder.calculateMaxAmountRequired(0.01);  // Returns "10000"
   * builder.calculateMaxAmountRequired(1.00);  // Returns "1000000"
   * builder.calculateMaxAmountRequired(0.001); // Returns "1000"
   */
  private calculateMaxAmountRequired(priceUSD: number): string {
    const atomicUnits = priceUSD * Math.pow(10, USDC_DECIMALS);
    return Math.floor(atomicUnits).toString();
  }

  /**
   * Parse atomic units back to USD for display purposes
   *
   * @param atomicUnits - Atomic units as string (e.g., "10000")
   * @returns Price in USD (e.g., 0.01)
   *
   * @example
   * builder.atomicToUSD("10000");    // Returns 0.01
   * builder.atomicToUSD("1000000");  // Returns 1.00
   */
  atomicToUSD(atomicUnits: string): number {
    const units = parseInt(atomicUnits, 10);
    return units / Math.pow(10, USDC_DECIMALS);
  }
}

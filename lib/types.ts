/**
 * TypeScript Type Definitions for x402 Wrapper Service
 *
 * Based on PRD Section 4.2
 */

import { IEndpointConfig } from './db/models/endpoint';

/**
 * x402 Protocol Types
 * Based on x402 specification
 */

export interface PaymentRequirements {
  scheme: 'exact';
  network: 'base' | 'base-sepolia';
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  outputSchema?: object;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  extra?: Record<string, unknown>;
}

export interface PaymentPayload {
  x402Version: 1;
  scheme: 'exact';
  network: 'base' | 'base-sepolia';
  payload: {
    signature: string;
    authorization: {
      from: string;
      to: string;
      value: string;
      validAfter: string;
      validBefore: string;
      nonce: string;
    };
  };
}

export interface X402ErrorResponse {
  x402Version: 1;
  error: string;
  accepts: PaymentRequirements[];
  payer?: string;
}

export interface VerifyResponse {
  isValid: boolean;
  payer: string;
  invalidReason?: string;
}

export interface SettleResponse {
  success: boolean;
  transaction: string;
  network: 'base' | 'base-sepolia';
  payer: string;
  errorReason?: string;
}

export interface PaymentResponseHeader {
  success: boolean;
  transaction: string;
  network: 'base' | 'base-sepolia';
  payer: string;
}

/**
 * Registration Form Types
 */

export interface RegistrationFormData {
  originalEndpoint: string;
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  requestBody?: string;
  price: string;
  walletAddress: string;
  authMethod: 'header' | 'query' | 'none';
  authHeaderName?: string;
  apiKey?: string;
  curlExample: string;
  expectedResponse: string;
  description: string;
  mimeType: string;
  outputSchema?: string;
  maxTimeoutSeconds: number;
}

export interface RegisterEndpointResponse {
  success: boolean;
  wrappedEndpoint?: string;
  providerId?: string;
  error?: string;
  fieldErrors?: Record<string, string | string[]>;
}

export interface TestEndpointResponse {
  success: boolean;
  response?: unknown;
  error?: string;
  latency?: number;
  details?: string;
}

/**
 * Endpoint Configuration (re-export for convenience)
 */
export type { IEndpointConfig };

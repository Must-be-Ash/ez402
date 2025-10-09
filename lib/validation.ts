/**
 * Zod Validation Schemas
 *
 * Input validation for registration forms and payment payloads
 * Based on PRD Section 4.3
 */

import { z } from 'zod';

/**
 * Registration form validation schema
 */
export const registrationFormSchema = z.object({
  originalEndpoint: z
    .string()
    .url('Must be a valid URL')
    .regex(/^https?:\/\//, 'Must start with http:// or https://'),

  httpMethod: z.enum(['GET', 'POST', 'PUT', 'DELETE']),

  requestBody: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    }, 'Must be valid JSON if provided'),

  price: z
    .string()
    .regex(/^\d+(\.\d{1,6})?$/, 'Must be a valid number with up to 6 decimals')
    .refine((val) => {
      const n = parseFloat(val);
      return n >= 0.0001 && n <= 1000;
    }, {
      message: 'Price must be between $0.0001 and $1000'
    }),

  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid Ethereum address')
    .transform((addr) => addr.toLowerCase()), // Normalize to lowercase

  authMethod: z.enum(['header', 'query', 'none']),

  authHeaderName: z
    .string()
    .min(1, 'Header name is required when using header authentication')
    .optional(),

  apiKey: z
    .string()
    .min(1, 'API key is required for authenticated endpoints')
    .optional(),

  curlExample: z
    .string()
    .min(10, 'cURL example must be at least 10 characters')
    .regex(/curl/, 'Must be a valid cURL command'),

  expectedResponse: z
    .string()
    .min(2, 'Expected response must be valid JSON')
    .refine((val) => {
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    }, 'Must be valid JSON'),

  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),

  mimeType: z
    .enum(['application/json', 'text/html', 'text/plain', 'application/xml']),

  outputSchema: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    }, 'Must be valid JSON if provided'),

  maxTimeoutSeconds: z
    .number()
    .int()
    .min(10, 'Timeout must be at least 10 seconds')
    .max(300, 'Timeout must be less than 5 minutes')
});

export type RegistrationFormInput = z.infer<typeof registrationFormSchema>;

/**
 * Payment payload validation schema (from X-PAYMENT header)
 */
export const paymentPayloadSchema = z.object({
  x402Version: z.literal(1),
  scheme: z.literal('exact'),
  network: z.literal('base'),
  payload: z.object({
    signature: z.string().regex(/^0x[a-fA-F0-9]+$/, 'Invalid signature format'),
    authorization: z.object({
      from: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid from address'),
      to: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid to address'),
      value: z.string().regex(/^\d+$/, 'Invalid value format'),
      validAfter: z.string().regex(/^\d+$/, 'Invalid validAfter timestamp'),
      validBefore: z.string().regex(/^\d+$/, 'Invalid validBefore timestamp'),
      nonce: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid nonce format')
    })
  })
});

export type PaymentPayloadInput = z.infer<typeof paymentPayloadSchema>;

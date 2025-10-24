/**
 * /api/x402/[providerId]
 *
 * Main proxy endpoint that handles x402 payment flow and forwards requests to provider
 * Supports GET, POST, PUT, DELETE methods
 * Based on PRD Section 5.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db/connection';
import EndpointModel from '@/lib/db/models/endpoint';
import { verify, settle } from 'x402/facilitator';
import type { PaymentPayload as X402PaymentPayload } from 'x402/types';
import { getServerWalletClient } from '@/lib/wallet';
import { EncryptionService } from '@/lib/services/encryption';
import { PaymentRequirementsBuilder } from '@/lib/services/payment-requirements';
import { RequestForwarder } from '@/lib/services/request-forwarder';
import { paymentPayloadSchema } from '@/lib/validation';
import { PaymentPayload } from '@/lib/types';

/**
 * Main handler for all HTTP methods
 */
async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
): Promise<NextResponse> {
  try {
    const { providerId } = await params;

    // 1. Connect to MongoDB
    await connectToDatabase();

    // 2. Retrieve endpoint configuration from MongoDB
    const config = await EndpointModel.findOne({ providerId, isActive: true });

    if (!config) {
      return NextResponse.json({
        error: 'Endpoint not found'
      }, { status: 404 });
    }

    // 3. Check for X-PAYMENT header
    const paymentHeader = request.headers.get('X-PAYMENT');

    if (!paymentHeader) {
      // No payment provided - return 402 with payment requirements
      const builder = new PaymentRequirementsBuilder();
      const paymentRequirements = builder.build(config, request.url);

      return NextResponse.json({
        x402Version: 1,
        error: 'X-PAYMENT header is required',
        accepts: [paymentRequirements]
      }, { status: 402 });
    }

    // 4. Decode and validate payment payload
    const paymentPayloadJson = Buffer.from(paymentHeader, 'base64').toString('utf-8');
    const paymentPayload = paymentPayloadSchema.parse(JSON.parse(paymentPayloadJson)) as PaymentPayload;

    // 5. Build payment requirements for verification
    const builder = new PaymentRequirementsBuilder();
    const paymentRequirements = builder.build(config, request.url);

    // 6. Get wallet client for x402 SDK
    const walletClient = await getServerWalletClient();

    // 7. Verify payment using x402 SDK
    console.log(`🔍 Verifying payment for ${providerId}...`);

    // Parse payment payload to X402 format
    const payment = paymentPayload as unknown as X402PaymentPayload;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- x402 facilitator type incompatible with viem wallet client type
    const verifyResult = await verify(walletClient as any, payment, paymentRequirements);

    if (!verifyResult.isValid) {
      console.log(`❌ Payment verification failed: ${verifyResult.invalidReason}`);
      return NextResponse.json({
        x402Version: 1,
        error: `Payment verification failed: ${verifyResult.invalidReason}`,
        accepts: [paymentRequirements]
      }, { status: 402 });
    }

    console.log(`✅ Payment verified from ${verifyResult.payer}`);

    // 7. Decrypt API key and forward request to provider endpoint (deliver service immediately)
    console.log(`📦 Payment verified - delivering service...`);
    const encryption = new EncryptionService();
    const decryptedApiKey = config.apiKey ? encryption.decrypt(config.apiKey) : undefined;

    // Use RequestForwarder service to forward the request
    const forwarder = new RequestForwarder();
    const providerResponse = await forwarder.forward(config, request, decryptedApiKey);

    if (!providerResponse.ok) {
      return NextResponse.json({
        error: `Provider endpoint returned ${providerResponse.status}`,
        details: await providerResponse.text()
      }, { status: 502 });
    }

    const providerData = await providerResponse.json();

    // 8. Settle payment synchronously using x402 SDK
    console.log(`⛓️  Settling payment on-chain...`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- x402 facilitator type incompatible with viem wallet client type
    const settleResult = await settle(walletClient as any, payment, paymentRequirements);

    if (!settleResult.success) {
      console.error(`❌ [${providerId}] Settlement failed: ${settleResult.errorReason || 'unknown'}`);
      // Return 402 if settlement fails - payment was verified but not settled
      return NextResponse.json({
        x402Version: 1,
        error: `Payment settlement failed: ${settleResult.errorReason || 'unknown'}`,
        accepts: [paymentRequirements]
      }, { status: 402 });
    }

    console.log(`✅ [${providerId}] Payment settled! Tx: ${settleResult.transaction}`);
    console.log(`🔗 View on BaseScan: https://sepolia.basescan.org/tx/${settleResult.transaction}`);

    // 9. Build X-PAYMENT-RESPONSE header with settlement details
    const paymentResponse = {
      success: true,
      transaction: settleResult.transaction,
      network: paymentRequirements.network,
      payer: verifyResult.payer
    };

    const paymentResponseHeader = Buffer.from(JSON.stringify(paymentResponse)).toString('base64');

    // 10. Return provider data with payment response header
    return NextResponse.json(providerData, {
      status: 200,
      headers: {
        'X-PAYMENT-RESPONSE': paymentResponseHeader,
        'Access-Control-Expose-Headers': 'X-PAYMENT-RESPONSE'
      }
    });

  } catch (error) {
    console.error('Proxy error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid payment payload',
        details: error.flatten()
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Export handlers for all HTTP methods
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ providerId: string }> }
) {
  return handleRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ providerId: string }> }
) {
  return handleRequest(request, context);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ providerId: string }> }
) {
  return handleRequest(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ providerId: string }> }
) {
  return handleRequest(request, context);
}

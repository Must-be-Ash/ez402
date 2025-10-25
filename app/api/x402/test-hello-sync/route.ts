/**
 * Simple test x402 endpoint - returns instantly for testing payment flow
 * Uses x402 SDK functions exactly like agent-bid
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db/connection';
import EndpointModel from '@/lib/db/models/endpoint';
import { PaymentRequirementsBuilder } from '@/lib/services/payment-requirements';
import { paymentPayloadSchema } from '@/lib/validation';
import { PaymentPayload } from '@/lib/types';
import { verify, settle } from 'x402/facilitator';
import type { PaymentPayload as X402PaymentPayload } from 'x402/types';
import { getServerWalletClient } from '@/lib/services/wallet-client';
export async function GET(request: NextRequest) {
  try {
    const providerId = 'test-hello';

    // 1. Connect to MongoDB
    await connectToDatabase();

    // 2. Retrieve endpoint configuration
    const config = await EndpointModel.findOne({ providerId, isActive: true });

    if (!config) {
      return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    // 3. Check for X-PAYMENT header
    const paymentHeader = request.headers.get('X-PAYMENT');

    if (!paymentHeader) {
      // No payment - return 402
      const builder = new PaymentRequirementsBuilder();
      const paymentRequirements = builder.build(config, request.url);

      return NextResponse.json({
        x402Version: 1,
        error: 'X-PAYMENT header is required',
        accepts: [paymentRequirements]
      }, { status: 402 });
    }

    // 4. Validate payment payload
    const paymentPayloadJson = Buffer.from(paymentHeader, 'base64').toString('utf-8');
    const payment: X402PaymentPayload = JSON.parse(paymentPayloadJson);

    // 5. Build payment requirements (flat object, not wrapped)
    const builder = new PaymentRequirementsBuilder();
    const paymentRequirements = builder.build(config, request.url);

    // 6. Get wallet client for x402 SDK (same as agent-bid)
    const walletClient = await getServerWalletClient();

    // 7. Verify payment using x402 SDK (exact agent-bid pattern)
    console.log(`🔍 Verifying payment for ${providerId}...`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- x402 facilitator type incompatible with viem wallet client type
    const verifyResult = await verify(walletClient as any, payment, paymentRequirements);

    if (!verifyResult.isValid) {
      console.log(`❌ Payment verification failed: ${verifyResult.invalidReason}`);
      return NextResponse.json(
        { error: `Payment verification failed: ${verifyResult.invalidReason}` },
        { status: 402 }
      );
    }

    console.log(`✅ Payment verified from ${verifyResult.payer}`);

    // 8. Settle payment synchronously (agent-bid style)
    console.log(`⛓️  Settling payment on-chain...`);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const settleResult = await settle(walletClient as any, payment, paymentRequirements);
    
    if (!settleResult.success) {
      console.log(`❌ Payment settlement failed: ${settleResult.errorReason}`);
      return NextResponse.json(
        { error: `Payment settlement failed: ${settleResult.errorReason}` },
        { status: 402 }
      );
    }

    console.log(`✅ Payment settled! Tx: ${settleResult.transaction}`);
    console.log(`🔗 View on BaseScan: https://sepolia.basescan.org/tx/${settleResult.transaction}`);

    // 9. Build settlement response header
    const settlementResponse = {
      success: true,
      transaction: settleResult.transaction,
      network: 'base-sepolia',
      payer: verifyResult.payer
    };

    const responseData = {
      message: 'Hello from x402!',
      timestamp: new Date().toISOString(),
      paidBy: verifyResult.payer,
      amount: paymentRequirements.maxAmountRequired,
      transaction: settleResult.transaction,
      settlementStatus: 'completed'
    };

    // Return service with settlement details
    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'X-PAYMENT-RESPONSE': Buffer.from(JSON.stringify(settlementResponse)).toString('base64'),
        'Access-Control-Expose-Headers': 'X-PAYMENT-RESPONSE'
      }
    });

  } catch (error) {
    console.error('Error:', error);

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


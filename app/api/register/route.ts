/**
 * POST /api/register
 *
 * Registers a new endpoint to be wrapped with x402 protocol
 * Based on PRD Section 5.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { registrationFormSchema } from '@/lib/validation';
import { connectToDatabase } from '@/lib/db/connection';
import EndpointModel from '@/lib/db/models/endpoint';
import { EncryptionService } from '@/lib/services/encryption';
import { EndpointTester } from '@/lib/services/endpoint-tester';
import { generateProviderId } from '@/lib/utils/generate-provider-id';
import { parseCurl } from '@/lib/utils/curl-parser';

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const validated = registrationFormSchema.parse(body);

    // 2. Parse cURL command to extract custom headers
    const parsedCurl = parseCurl(validated.curlExample);

    // 3. Generate unique provider ID from description
    const providerId = generateProviderId(validated.description);

    // 4. Connect to MongoDB
    await connectToDatabase();

    // 5. Check if provider ID already exists
    const existing = await EndpointModel.findOne({ providerId });
    if (existing) {
      return NextResponse.json({
        success: false,
        error: 'An endpoint with this description already exists',
        existingProviderId: providerId
      }, { status: 409 });
    }

    // 6. Test the endpoint with provided credentials and parsed headers
    const tester = new EndpointTester();
    const testResult = await tester.testEndpoint({
      endpoint: validated.originalEndpoint,
      method: validated.httpMethod,
      authMethod: validated.authMethod,
      authHeaderName: validated.authHeaderName,
      apiKey: validated.apiKey,
      body: validated.requestBody,
      customHeaders: parsedCurl.headers,
      expectedResponse: JSON.parse(validated.expectedResponse)
    });

    if (!testResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to provider endpoint',
        details: testResult.error
      }, { status: 400 });
    }

    // 6. Encrypt API key if provided
    let encryptedApiKey: string | undefined;
    if (validated.apiKey) {
      const encryption = new EncryptionService();
      encryptedApiKey = encryption.encrypt(validated.apiKey);
    }

    // 7. Save to MongoDB
    await EndpointModel.create({
      providerId,
      originalEndpoint: validated.originalEndpoint,
      httpMethod: validated.httpMethod,
      requestBody: validated.requestBody ? JSON.parse(validated.requestBody) : undefined,
      price: parseFloat(validated.price),
      walletAddress: validated.walletAddress,
      authMethod: validated.authMethod,
      authHeaderName: validated.authHeaderName,
      apiKey: encryptedApiKey,
      curlExample: validated.curlExample,
      expectedResponse: JSON.parse(validated.expectedResponse),
      customHeaders: parsedCurl.headers,
      description: validated.description,
      mimeType: validated.mimeType,
      outputSchema: validated.outputSchema ? JSON.parse(validated.outputSchema) : undefined,
      maxTimeoutSeconds: validated.maxTimeoutSeconds,
      isActive: true
    });

    // 8. Return wrapped endpoint URL
    const wrappedEndpoint = `${process.env.NEXT_PUBLIC_BASE_URL}/api/x402/${providerId}`;

    return NextResponse.json({
      success: true,
      wrappedEndpoint,
      providerId
    }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        fieldErrors: error.flatten().fieldErrors
      }, { status: 400 });
    }

    console.error('Registration error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

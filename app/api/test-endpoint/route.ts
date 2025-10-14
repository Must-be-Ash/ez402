/**
 * POST /api/test-endpoint
 *
 * Tests provider endpoint before registration to ensure credentials work
 * Based on PRD Section 5.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { EndpointTester } from '@/lib/services/endpoint-tester';
import { parseCurl } from '@/lib/utils/curl-parser';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, method, authMethod, authHeaderName, queryParamName, apiKey, requestBody, expectedResponse, curlExample } = body;

    // Parse cURL command to extract custom headers
    let customHeaders: Record<string, string> | undefined;
    if (curlExample) {
      const parsed = parseCurl(curlExample);
      customHeaders = parsed.headers;
    }

    const tester = new EndpointTester();
    const startTime = Date.now();

    const result = await tester.testEndpoint({
      endpoint,
      method: method || 'GET',
      authMethod,
      authHeaderName,
      queryParamName,
      apiKey,
      body: requestBody,
      customHeaders,
      expectedResponse: expectedResponse ? JSON.parse(expectedResponse) : undefined
    });

    const latency = Date.now() - startTime;

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
        details: result.details
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      response: result.response,
      latency
    }, { status: 200 });

  } catch (error) {
    console.error('Endpoint test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test endpoint',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

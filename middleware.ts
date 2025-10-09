/**
 * Next.js Middleware
 *
 * Handles CORS headers for x402 proxy endpoints
 * Based on PRD Section 10 (CORS Configuration)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Handle CORS for x402 proxy endpoints
  if (request.nextUrl.pathname.startsWith('/api/x402/')) {
    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-PAYMENT',
          'Access-Control-Expose-Headers': 'X-PAYMENT-RESPONSE',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Clone the response and add CORS headers
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-PAYMENT');
    response.headers.set('Access-Control-Expose-Headers', 'X-PAYMENT-RESPONSE');

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/x402/:path*',
};

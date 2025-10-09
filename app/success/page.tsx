'use client';

/**
 * Success Page
 *
 * Displays registration success and wrapped endpoint information
 * Route: /success?endpoint=...&providerId=...
 */

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const endpoint = searchParams.get('endpoint') || '';
  const providerId = searchParams.get('providerId') || '';

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-slate-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Registration Successful!
          </h1>
          <p className="text-lg text-slate-600">
            Your API endpoint has been wrapped with x402 protocol
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your x402-Enabled Endpoint</CardTitle>
            <CardDescription>
              Use this endpoint to receive micropayments for API calls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Wrapped Endpoint URL
              </label>
              <div className="flex gap-2">
                <code className="flex-1 bg-slate-100 px-4 py-3 rounded-md text-sm font-mono break-all">
                  {endpoint}
                </code>
                <Button onClick={() => handleCopy(endpoint)} variant="outline">
                  Copy
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Provider ID
              </label>
              <div className="flex gap-2">
                <code className="flex-1 bg-slate-100 px-4 py-3 rounded-md text-sm font-mono">
                  {providerId}
                </code>
                <Button onClick={() => handleCopy(providerId)} variant="outline">
                  Copy
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">1. Share Your Endpoint</h3>
              <p className="text-slate-600 text-sm">
                Share the wrapped endpoint URL with your clients. They can make requests using any
                x402-compatible client library.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-2">2. Monitor Payments</h3>
              <p className="text-slate-600 text-sm">
                Payments will be automatically settled to your wallet address on Base network.
                You can monitor transactions on{' '}
                <a
                  href={`https://basescan.org/address/${searchParams.get('walletAddress') || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  BaseScan
                </a>
                .
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-2">3. Test Your Endpoint</h3>
              <p className="text-slate-600 text-sm mb-3">
                Try making a request using an x402 client. First, call without payment to see the
                402 response, then include payment to access the API.
              </p>
              <code className="block bg-slate-900 text-green-400 p-4 rounded-md text-xs font-mono overflow-x-auto">
                # First request (no payment) - returns 402
                <br />
                curl {endpoint}
                <br />
                <br />
                # Second request (with X-PAYMENT header) - returns data
                <br />
                # Use an x402 SDK to generate payment signature
              </code>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/register">Register Another Endpoint</Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p>Loading...</p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

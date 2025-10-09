/**
 * Homepage
 *
 * Landing page explaining the x402 endpoint wrapper service
 * Route: /
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-slate-900 mb-6">
            x402 Endpoint Wrapper
          </h1>
          <p className="text-2xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Monetize your APIs with micropayments on Base network. Wrap any HTTP endpoint with
            the x402 protocol in minutes.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link href="/register">Register Your API</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6">
              <a href="#how-it-works">Learn More</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Why Use x402 Wrapper?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>⚡ Instant Monetization</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Start charging for API calls immediately. No complex payment infrastructure
                  required. Just register your endpoint and set your price.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🔒 Secure Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Payments are verified and settled on-chain using USDC on Base network via
                  Coinbase&apos;s CDP Facilitator. Your API keys are encrypted with AES-256-GCM.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🚀 Zero Code Changes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Keep your existing API exactly as it is. We wrap it with x402 protocol,
                  handling all payment verification and forwarding.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            How It Works
          </h2>
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Register Your Endpoint</h3>
                <p className="text-slate-600">
                  Provide your API endpoint URL, authentication details, and set your price per
                  request. We test your endpoint to ensure it works correctly.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Get Your Wrapped URL</h3>
                <p className="text-slate-600">
                  Receive a new x402-enabled endpoint URL that you can share with clients. All
                  requests to this URL will require payment.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Clients Pay Per Request</h3>
                <p className="text-slate-600">
                  Clients use an x402-compatible library to make requests. They automatically sign
                  and include payment with each API call using USDC on Base.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                4
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Receive Payments</h3>
                <p className="text-slate-600">
                  Payments are verified via CDP Facilitator, then your API responds. Funds are
                  settled directly to your wallet address on Base network.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Details Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Technical Details
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>x402 Protocol</CardTitle>
                <CardDescription>HTTP 402 Payment Required</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-slate-600">
                  Uses HTTP 402 status code with structured payment requirements
                </p>
                <p className="text-slate-600">
                  Supports EIP-3009 for gasless USDC transfers
                </p>
                <p className="text-slate-600">
                  EIP-712 typed signatures for security
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Base Network</CardTitle>
                <CardDescription>Ethereum Layer 2</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-slate-600">
                  Fast and cheap transactions
                </p>
                <p className="text-slate-600">
                  USDC payments with 6 decimal precision
                </p>
                <p className="text-slate-600">
                  Chain ID: 8453 (Base Mainnet)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>CDP Facilitator</CardTitle>
                <CardDescription>Coinbase Developer Platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-slate-600">
                  Verifies payment signatures
                </p>
                <p className="text-slate-600">
                  Settles payments on-chain
                </p>
                <p className="text-slate-600">
                  Handles gas fees for payers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Enterprise-grade protection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-slate-600">
                  AES-256-GCM encryption for API keys
                </p>
                <p className="text-slate-600">
                  Payment verification before API access
                </p>
                <p className="text-slate-600">
                  No custody of funds
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">
            Ready to Monetize Your API?
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Join the future of API monetization with micropayments on Base network.
          </p>
          <Button asChild size="lg" className="text-lg px-8 py-6">
            <Link href="/register">Register Your Endpoint Now</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-slate-400">
            x402 Endpoint Wrapper Service • Built with Next.js and Coinbase CDP • Base Mainnet
          </p>
          <p className="text-slate-500 text-sm mt-2">
            For demonstration and educational purposes
          </p>
        </div>
      </footer>
    </div>
  );
}

/**
 * Registration Page
 *
 * Allows API providers to register their endpoints for x402 wrapping
 * Route: /register
 */

import Link from 'next/link';
import { RegistrationForm } from '@/components/RegistrationForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Register Your API Endpoint
          </h1>
          <p className="text-lg text-slate-600">
            Wrap your API with x402 protocol to enable micropayments on Base network
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <RegistrationForm />
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          <p>
            By registering, your API will be accessible via the x402 protocol using USDC on Base mainnet.
          </p>
          <p className="mt-2">
            Need help? Check out the{' '}
            <Link href="/" className="text-blue-600 hover:underline">
              documentation
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import { connectToDatabase } from './lib/db/connection';
import EndpointModel from './lib/db/models/endpoint';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function registerTestHello() {
  await connectToDatabase();
  
  const config = {
    providerId: 'test-hello',
    originalEndpoint: 'http://example.com/hello',
    httpMethod: 'GET' as const,
    price: 0.001, // $0.001
    walletAddress: '0xabf01df9428ead5418473a7c91244826a3af23b3',
    authMethod: 'none' as const,
    curlExample: 'curl http://example.com/hello',
    expectedResponse: { message: 'hello' },
    description: 'Simple hello world test endpoint for x402',
    mimeType: 'application/json' as const,
    maxTimeoutSeconds: 30,
    isActive: true
  };

  await EndpointModel.findOneAndUpdate(
    { providerId: 'test-hello' },
    config,
    { upsert: true, new: true }
  );

  console.log('✅ Test endpoint registered!');
  process.exit(0);
}

registerTestHello();

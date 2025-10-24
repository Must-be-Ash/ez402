import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { connectToDatabase } from './lib/db/connection';
import EndpointModel from './lib/db/models/endpoint';
import { EncryptionService } from './lib/services/encryption';

async function fixFirecrawlEndpoint() {
  console.log('\n🔧 Fixing Firecrawl endpoint authentication...\n');

  await connectToDatabase();

  const encryption = new EncryptionService();

  // Get the Firecrawl API key from environment
  const firecrawlApiKey = process.env.FIRECRAWL_API_KEY || 'fc-4ee0a7850b834fabb3b5c8d6e83cd855';

  console.log(`🔑 Using Firecrawl API key: ${firecrawlApiKey.substring(0, 15)}...`);

  // Encrypt the FULL authorization value (with "Bearer " prefix)
  const fullAuthValue = `Bearer ${firecrawlApiKey}`;
  const encryptedApiKey = encryption.encrypt(fullAuthValue);

  console.log(`✅ Encrypted API key with "Bearer " prefix\n`);

  // Update the endpoint
  const result = await EndpointModel.updateOne(
    { providerId: 'firecrawl_web_scraping_api_scrapes_single_pages_an' },
    {
      $set: {
        apiKey: encryptedApiKey,
        // Remove Authorization from customHeaders since authMethod will handle it
        customHeaders: {
          'Content-Type': 'application/json'
        }
      }
    }
  );

  if (result.matchedCount === 0) {
    console.log('❌ Firecrawl endpoint not found in database!');
    process.exit(1);
  }

  console.log('✅ Successfully updated Firecrawl endpoint');
  console.log('\n📋 Changes made:');
  console.log('  1. API key now includes "Bearer " prefix');
  console.log('  2. Removed Authorization from customHeaders (authMethod handles it)');
  console.log('\n📤 What will be sent to Firecrawl:');
  console.log(`   Authorization: Bearer ${firecrawlApiKey.substring(0, 20)}...`);
  console.log('\n✅ This matches Firecrawl\'s expected format!\n');

  // Verify by re-reading
  const updated = await EndpointModel.findOne({
    providerId: 'firecrawl_web_scraping_api_scrapes_single_pages_an'
  });

  if (updated) {
    const decrypted = updated.apiKey ? encryption.decrypt(updated.apiKey) : '';
    console.log('🔍 Verification:');
    console.log(`   Stored (decrypted): ${decrypted ? decrypted.substring(0, 30) + '...' : 'N/A'}`);
    console.log(`   Custom Headers: ${JSON.stringify(updated.customHeaders)}`);
    console.log(`   Auth Method: ${updated.authMethod}`);
    console.log(`   Auth Header Name: ${updated.authHeaderName}\n`);
  }

  console.log('✅ Done! Now try running your agent again.\n');
  process.exit(0);
}

fixFirecrawlEndpoint().catch((error) => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});

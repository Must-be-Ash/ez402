import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { connectToDatabase } from './lib/db/connection';
import EndpointModel from './lib/db/models/endpoint';
import { EncryptionService } from './lib/services/encryption';

async function checkFirecrawlEndpoint() {
  console.log('\n🔍 Checking Firecrawl endpoint configuration in MongoDB...\n');

  await connectToDatabase();

  // Find Firecrawl endpoint (case-insensitive search)
  const firecrawlEndpoint = await EndpointModel.findOne({
    providerId: { $regex: /firecrawl/i }
  });

  if (!firecrawlEndpoint) {
    console.log('❌ No Firecrawl endpoint found in database!');
    console.log('\nSearching for all endpoints...');

    const allEndpoints = await EndpointModel.find({});
    console.log(`\nFound ${allEndpoints.length} total endpoints:`);
    allEndpoints.forEach(ep => {
      console.log(`  - ${ep.providerId}`);
      console.log(`    ${ep.httpMethod} ${ep.originalEndpoint}`);
      console.log(`    Auth: ${ep.authMethod} (${ep.authHeaderName || ep.queryParamName || 'none'})`);
      console.log(`    API Key: ${ep.apiKey ? '✅ SET' : '❌ NOT SET'}\n`);
    });
    process.exit(1);
  }

  console.log('📋 Firecrawl Endpoint Configuration:\n');
  console.log(`Provider ID: ${firecrawlEndpoint.providerId}`);
  console.log(`Original Endpoint: ${firecrawlEndpoint.originalEndpoint}`);
  console.log(`HTTP Method: ${firecrawlEndpoint.httpMethod}`);
  console.log(`Price: $${firecrawlEndpoint.price}`);
  console.log(`Wallet Address: ${firecrawlEndpoint.walletAddress}`);

  console.log(`\n🔐 Authentication:`);
  console.log(`  Method: ${firecrawlEndpoint.authMethod}`);
  console.log(`  Header Name: ${firecrawlEndpoint.authHeaderName || 'N/A'}`);
  console.log(`  Query Param: ${firecrawlEndpoint.queryParamName || 'N/A'}`);
  console.log(`  API Key (encrypted): ${firecrawlEndpoint.apiKey ? '✅ SET (' + firecrawlEndpoint.apiKey.substring(0, 40) + '...)' : '❌ NOT SET'}`);

  if (firecrawlEndpoint.customHeaders) {
    console.log(`\n📝 Custom Headers:`, JSON.stringify(firecrawlEndpoint.customHeaders, null, 2));
  }

  console.log(`\n⚙️  Configuration:`);
  console.log(`  Active: ${firecrawlEndpoint.isActive ? '✅ Yes' : '❌ No'}`);
  console.log(`  Max Timeout: ${firecrawlEndpoint.maxTimeoutSeconds}s`);
  console.log(`  MIME Type: ${firecrawlEndpoint.mimeType}`);

  // Diagnosis
  console.log(`\n🔬 Diagnosis:`);

  if (!firecrawlEndpoint.apiKey) {
    console.log('❌ PROBLEM: API key is not set!');
    console.log('   Firecrawl will reject requests with 401 "Token missing"');
    console.log('\n💡 Solution: Register endpoint with FIRECRAWL_API_KEY');
  } else if (firecrawlEndpoint.authMethod === 'none') {
    console.log('❌ PROBLEM: authMethod is "none" but Firecrawl requires authentication!');
    console.log('   Should be: authMethod: "header", authHeaderName: "Authorization"');
  } else if (firecrawlEndpoint.authMethod === 'header' && !firecrawlEndpoint.authHeaderName) {
    console.log('❌ PROBLEM: authMethod is "header" but authHeaderName not set!');
    console.log('   Should be: "Authorization"');
  } else {
    console.log('✅ Auth configuration looks correct');

    // Decrypt and verify API key
    try {
      const encryption = new EncryptionService();
      const decryptedKey = encryption.decrypt(firecrawlEndpoint.apiKey);

      console.log(`   Decrypted API key: ${decryptedKey.substring(0, 15)}...${decryptedKey.substring(decryptedKey.length - 5)}`);

      // Check format
      if (decryptedKey.startsWith('fc-')) {
        console.log('   ✅ API key format is correct (starts with "fc-")');

        // Show what will be sent to Firecrawl
        console.log(`\n📤 What will be sent to Firecrawl:`);
        console.log(`   ${firecrawlEndpoint.authHeaderName}: ${decryptedKey.substring(0, 20)}...`);

      } else if (decryptedKey.startsWith('Bearer ')) {
        console.log('   ⚠️  WARNING: API key includes "Bearer " prefix!');
        console.log('      This might cause double "Bearer" in the header');
        console.log(`\n📤 What will be sent to Firecrawl:`);
        console.log(`   ${firecrawlEndpoint.authHeaderName}: ${decryptedKey}`);
        console.log('\n   If authHeaderName is "Authorization", this might work');
        console.log('   But if Firecrawl expects just the token, remove "Bearer "');

      } else {
        console.log('   ⚠️  WARNING: API key does not start with "fc-"');
        console.log('      Expected Firecrawl API key format: fc-xxx...xxx');
        console.log(`      Got: ${decryptedKey.substring(0, 20)}...`);

        console.log(`\n📤 What will be sent to Firecrawl:`);
        console.log(`   ${firecrawlEndpoint.authHeaderName}: ${decryptedKey.substring(0, 30)}...`);
      }

      // Check the expected header name
      console.log(`\n📖 Firecrawl API expects:`);
      console.log(`   Authorization: Bearer fc-xxx...xxx`);
      console.log(`\n📋 Your configuration will send:`);
      console.log(`   ${firecrawlEndpoint.authHeaderName}: ${decryptedKey.substring(0, 30)}...`);

      if (firecrawlEndpoint.authHeaderName !== 'Authorization') {
        console.log('\n   ❌ MISMATCH! Header name should be "Authorization"');
      } else if (!decryptedKey.startsWith('Bearer ')) {
        console.log('\n   ⚠️  Your API key should start with "Bearer fc-..."');
        console.log('       OR the authHeaderName should handle "Bearer" prefix');
      } else {
        console.log('\n   ✅ Header configuration looks correct!');
      }

    } catch (error) {
      console.log(`   ❌ Failed to decrypt API key: ${error}`);
    }
  }

  console.log('\n✅ Done\n');
  process.exit(0);
}

checkFirecrawlEndpoint().catch((error) => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { connectToDatabase } from './lib/db/connection';
import EndpointModel from './lib/db/models/endpoint';
import { EncryptionService } from './lib/services/encryption';

async function addFreepikEndpoint() {
  await connectToDatabase();
  
  const freepikApiKey = process.env.FREEPIK_API_KEY;
  
  if (!freepikApiKey) {
    console.log('❌ FREEPIK_API_KEY not found in .env.local');
    console.log('Please add your Freepik API key to .env.local');
    return;
  }
  
  console.log('🔑 Freepik API key found (first 20 chars):', freepikApiKey.substring(0, 20) + '...');
  
  // Encrypt the API key
  const encryption = new EncryptionService();
  const encryptedApiKey = encryption.encrypt(freepikApiKey);
  
  const freepikEndpoint = {
    providerId: 'freepik_ai_image_generator_using_mystic_model',
    name: 'Freepik AI Image Generator',
    description: 'Generate high-quality AI images using Freepik\'s Mystic model with x402 micropayment support',
    originalEndpoint: 'https://api.freepik.com/v1/x402/ai/mystic',
    httpMethod: 'POST',
    authMethod: 'header',
    authHeaderName: 'x-freepik-api-key',
    apiKey: encryptedApiKey,
    price: 0.05, // 5 cents per image generation
    requestBody: JSON.stringify({
      prompt: "A beautiful sunset over mountains",
      model: "realism",
      resolution: "1k",
      aspect_ratio: "square_1_1",
      creative_detailing: 33,
      engine: "automatic",
      fixed_generation: false,
      filter_nsfw: true
    }),
    expectedResponse: JSON.stringify({
      success: true,
      data: {
        task_id: "string",
        status: "string",
        generated: ["string"]
      }
    }),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  try {
    // Check if endpoint already exists
    const existingEndpoint = await EndpointModel.findOne({ 
      providerId: freepikEndpoint.providerId 
    });
    
    if (existingEndpoint) {
      console.log('⚠️ Endpoint already exists, updating...');
      const result = await EndpointModel.updateOne(
        { providerId: freepikEndpoint.providerId },
        { $set: freepikEndpoint }
      );
      
      if (result.matchedCount > 0) {
        console.log('✅ Successfully updated Freepik endpoint');
      } else {
        console.log('❌ Failed to update endpoint');
      }
    } else {
      const newEndpoint = new EndpointModel(freepikEndpoint);
      await newEndpoint.save();
      console.log('✅ Successfully added Freepik endpoint to database');
    }
    
    console.log('📋 Endpoint details:');
    console.log('  - Provider ID:', freepikEndpoint.providerId);
    console.log('  - Name:', freepikEndpoint.name);
    console.log('  - Endpoint:', freepikEndpoint.originalEndpoint);
    console.log('  - Method:', freepikEndpoint.httpMethod);
    console.log('  - Auth:', freepikEndpoint.authMethod, '->', freepikEndpoint.authHeaderName);
    console.log('  - Price:', freepikEndpoint.price, 'USDC');
    console.log('  - Encrypted API key length:', encryptedApiKey.length, 'characters');
    
  } catch (error) {
    console.error('❌ Error adding Freepik endpoint:', error);
  }
}

addFreepikEndpoint().catch(console.error);

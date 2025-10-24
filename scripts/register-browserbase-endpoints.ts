/**
 * Direct MongoDB Registration Script for Browserbase Endpoints
 *
 * Run with: tsx scripts/register-browserbase-endpoints.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { connectToDatabase } from '../lib/db/connection';
import EndpointModel from '../lib/db/models/endpoint';
import { generateProviderId } from '../lib/utils/generate-provider-id';
import MCPConfigModel from '../lib/db/models/mcp-config';
import { MCPGeneratorService } from '../lib/services/mcp-generator';

async function registerBrowserbaseEndpoints() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectToDatabase();
    console.log('✅ Connected to MongoDB');

    const walletAddress = '0xAbF01df9428EaD5418473A7c91244826A3Af23b3';

    // Endpoint 1: Form Scraper
    const scraperDescription = 'Scrape form structure from any website';
    const scraperId = generateProviderId(scraperDescription);

    console.log(`\n📝 Registering Form Scraper (${scraperId})...`);

    // Delete if exists
    const existingScraper = await EndpointModel.findOne({ providerId: scraperId });
    if (existingScraper) {
      console.log('⚠️  Form Scraper already exists, deleting and re-registering...');
      await EndpointModel.deleteOne({ providerId: scraperId });
    }

    {
      await EndpointModel.create({
        providerId: scraperId,
        originalEndpoint: 'http://localhost:3000/api/browserbase/scrape-form?url=PLACEHOLDER',
        httpMethod: 'GET',
        price: 0.01,
        walletAddress: walletAddress.toLowerCase(),
        authMethod: 'none',
        description: scraperDescription,
        mimeType: 'application/json',
        maxTimeoutSeconds: 120,
        isActive: true,
        customHeaders: {},
        curlExample: 'curl "http://localhost:3000/api/browserbase/scrape-form?url=https://example.com"',
        expectedResponse: {
          url: 'https://example.com',
          formStructure: { fields: [] },
          timestamp: '2025-01-01T00:00:00.000Z'
        }
      });
      console.log('✅ Form Scraper registered successfully');
    }

    // Endpoint 2: Form Filler
    const fillerDescription = 'Fill and submit forms on any website';
    const fillerId = generateProviderId(fillerDescription);

    console.log(`\n📝 Registering Form Filler (${fillerId})...`);

    const existingFiller = await EndpointModel.findOne({ providerId: fillerId });
    if (existingFiller) {
      console.log('⚠️  Form Filler already exists, deleting and re-registering...');
      await EndpointModel.deleteOne({ providerId: fillerId });
    }

    await EndpointModel.create({
      providerId: fillerId,
      originalEndpoint: 'http://localhost:3000/api/browserbase/fill-form',
      httpMethod: 'POST',
      price: 0.05,
      walletAddress: walletAddress.toLowerCase(),
      authMethod: 'none',
      description: fillerDescription,
      mimeType: 'application/json',
      maxTimeoutSeconds: 120,
      isActive: true,
      customHeaders: {},
      requestBody: {
        url: 'https://example.com',
        formData: { field: 'value' },
        submitForm: true,
        autoScrape: true
      },
      curlExample: 'curl -X POST http://localhost:3000/api/browserbase/fill-form -H "Content-Type: application/json" -d \'{"url":"https://example.com","formData":{}}\'',
      expectedResponse: {
        success: true,
        filledFields: [],
        submitted: false
      }
    });
    console.log('✅ Form Filler registered successfully');

    // Update MCP Configuration
    console.log('\n🔄 Updating MCP configuration...');
    const generator = new MCPGeneratorService();
    const tools = await generator.generateToolDefinitions();
    const toolIds = tools.map(t => t.name);

    const defaultServerId = 'ez402-mcp-main';
    await MCPConfigModel.updateOne(
      { serverId: defaultServerId },
      {
        serverId: defaultServerId,
        serverName: 'EZ402 MCP Server',
        transportType: 'http',
        registeredTools: toolIds,
        updatedAt: new Date()
      },
      { upsert: true }
    );

    console.log('✅ MCP config updated');
    console.log(`📋 Total registered tools: ${toolIds.length}`);

    console.log('\n🎉 Registration complete!');
    console.log('\n📍 Your endpoints are available at:');
    console.log(`   • http://localhost:3000/api/x402/${scraperId}`);
    console.log(`   • http://localhost:3000/api/x402/${fillerId}`);
    console.log('\n💡 These tools will now appear in your /chat page as MCP tools');

    process.exit(0);
  } catch (error) {
    console.error('❌ Registration failed:', error);
    process.exit(1);
  }
}

registerBrowserbaseEndpoints();

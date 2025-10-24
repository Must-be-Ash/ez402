/**
 * Demo Script: Delete Browserbase Endpoints
 *
 * Removes form scraping and form filling endpoints from MCP tools
 *
 * Run with: pnpm tsx scripts/demo-delete-browserbase.ts
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

async function deleteBrowserbaseEndpoints() {
  try {
    console.log('🗑️  DEMO: Deleting Browserbase Form Automation Endpoints');
    console.log('='.repeat(60));

    console.log('\n🔌 Connecting to MongoDB...');
    await connectToDatabase();
    console.log('✅ Connected to MongoDB\n');

    // Generate provider IDs (same logic as upload script)
    const scraperDescription = 'Scrape form structure from any website';
    const fillerDescription = 'Fill and submit forms on any website';
    const scraperId = generateProviderId(scraperDescription);
    const fillerId = generateProviderId(fillerDescription);

    console.log('🔍 Searching for Browserbase endpoints...');
    console.log(`   Form Scraper ID: ${scraperId}`);
    console.log(`   Form Filler ID: ${fillerId}\n`);

    // Delete Form Scraper
    console.log('🗑️  Deleting Form Scraper endpoint...');
    const scraperResult = await EndpointModel.deleteOne({ providerId: scraperId });
    if (scraperResult.deletedCount > 0) {
      console.log('   ✅ Form Scraper deleted');
    } else {
      console.log('   ⚠️  Form Scraper not found (already deleted or never existed)');
    }

    // Delete Form Filler
    console.log('🗑️  Deleting Form Filler endpoint...');
    const fillerResult = await EndpointModel.deleteOne({ providerId: fillerId });
    if (fillerResult.deletedCount > 0) {
      console.log('   ✅ Form Filler deleted');
    } else {
      console.log('   ⚠️  Form Filler not found (already deleted or never existed)');
    }

    console.log();

    // Update MCP Configuration
    console.log('🔄 Updating MCP configuration...');
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
    console.log(`   Total registered tools: ${toolIds.length}\n`);

    const totalDeleted = scraperResult.deletedCount + fillerResult.deletedCount;

    console.log('='.repeat(60));
    if (totalDeleted > 0) {
      console.log(`🎉 SUCCESS! Deleted ${totalDeleted} Browserbase endpoint(s)\n`);
      console.log('📍 The following endpoints are now removed:');
      if (scraperResult.deletedCount > 0) {
        console.log(`   ✗ GET  /api/x402/${scraperId}`);
      }
      if (fillerResult.deletedCount > 0) {
        console.log(`   ✗ POST /api/x402/${fillerId}`);
      }
      console.log('\n💡 These tools are NO LONGER available in your /chat page!');
      console.log('   Your LLM can no longer scrape or fill forms.');
    } else {
      console.log('⚠️  No endpoints were deleted (they may have already been removed)\n');
      console.log('💡 To add them back, run:');
      console.log('   pnpm tsx scripts/demo-upload-browserbase.ts');
    }
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Deletion failed:', error);
    process.exit(1);
  }
}

deleteBrowserbaseEndpoints();

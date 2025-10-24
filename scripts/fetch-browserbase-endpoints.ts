/**
 * Fetch Browserbase endpoint configurations from MongoDB
 *
 * Run with: tsx scripts/fetch-browserbase-endpoints.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { connectToDatabase } from '../lib/db/connection';
import EndpointModel from '../lib/db/models/endpoint';

async function fetchBrowserbaseEndpoints() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectToDatabase();
    console.log('✅ Connected to MongoDB');

    // Fetch the form scraper endpoint
    console.log('\n📝 Fetching Form Scraper endpoint...');
    const scraperEndpoints = await EndpointModel.find({
      description: { $regex: /scrape form/i }
    }).lean();

    // Fetch the form filler endpoint
    console.log('📝 Fetching Form Filler endpoint...');
    const fillerEndpoints = await EndpointModel.find({
      description: { $regex: /fill.*submit form/i }
    }).lean();

    if (scraperEndpoints.length === 0 && fillerEndpoints.length === 0) {
      console.log('❌ No Browserbase endpoints found');
      process.exit(1);
    }

    // Build markdown content
    let markdown = '# Browserbase Endpoints Configuration\n\n';
    markdown += 'This document contains the exact MongoDB configuration for the Browserbase form automation endpoints.\n\n';
    markdown += `**Generated**: ${new Date().toISOString()}\n\n`;
    markdown += '---\n\n';

    if (scraperEndpoints.length > 0) {
      markdown += '## Form Scraper Endpoint\n\n';
      scraperEndpoints.forEach((endpoint, index) => {
        if (index > 0) markdown += '\n---\n\n';
        markdown += '```json\n';
        markdown += JSON.stringify(endpoint, null, 2);
        markdown += '\n```\n\n';

        // Add readable summary
        markdown += '**Summary**:\n';
        markdown += `- **Provider ID**: \`${endpoint.providerId}\`\n`;
        markdown += `- **Description**: ${endpoint.description}\n`;
        markdown += `- **Endpoint**: \`${endpoint.originalEndpoint}\`\n`;
        markdown += `- **Method**: ${endpoint.httpMethod}\n`;
        markdown += `- **Price**: $${endpoint.price}\n`;
        markdown += `- **Wallet**: ${endpoint.walletAddress}\n`;
        markdown += `- **Auth Method**: ${endpoint.authMethod}\n`;
        markdown += `- **Active**: ${endpoint.isActive}\n`;
        markdown += `- **Max Timeout**: ${endpoint.maxTimeoutSeconds}s\n\n`;
      });
    }

    if (fillerEndpoints.length > 0) {
      markdown += '## Form Filler Endpoint\n\n';
      fillerEndpoints.forEach((endpoint, index) => {
        if (index > 0) markdown += '\n---\n\n';
        markdown += '```json\n';
        markdown += JSON.stringify(endpoint, null, 2);
        markdown += '\n```\n\n';

        // Add readable summary
        markdown += '**Summary**:\n';
        markdown += `- **Provider ID**: \`${endpoint.providerId}\`\n`;
        markdown += `- **Description**: ${endpoint.description}\n`;
        markdown += `- **Endpoint**: \`${endpoint.originalEndpoint}\`\n`;
        markdown += `- **Method**: ${endpoint.httpMethod}\n`;
        markdown += `- **Price**: $${endpoint.price}\n`;
        markdown += `- **Wallet**: ${endpoint.walletAddress}\n`;
        markdown += `- **Auth Method**: ${endpoint.authMethod}\n`;
        markdown += `- **Active**: ${endpoint.isActive}\n`;
        markdown += `- **Max Timeout**: ${endpoint.maxTimeoutSeconds}s\n\n`;
      });
    }

    // Add field details
    markdown += '---\n\n';
    markdown += '## Accessible URLs\n\n';

    if (scraperEndpoints.length > 0) {
      markdown += `**Form Scraper**: \`http://localhost:3000/api/x402/${scraperEndpoints[0].providerId}\`\n\n`;
    }
    if (fillerEndpoints.length > 0) {
      markdown += `**Form Filler**: \`http://localhost:3000/api/x402/${fillerEndpoints[0].providerId}\`\n\n`;
    }

    // Save to file
    const outputPath = path.resolve(process.cwd(), 'browserbase-endpoints-config.md');
    fs.writeFileSync(outputPath, markdown, 'utf8');

    console.log('\n✅ Endpoint configurations saved!');
    console.log(`📄 File: ${outputPath}`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Form Scraper endpoints found: ${scraperEndpoints.length}`);
    console.log(`   - Form Filler endpoints found: ${fillerEndpoints.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to fetch endpoints:', error);
    process.exit(1);
  }
}

fetchBrowserbaseEndpoints();

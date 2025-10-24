/**
 * Test script for Browserbase form filling endpoints
 *
 * This script tests the complete workflow:
 * 1. Scrapes the form to get available fields
 * 2. Fills the form with test data
 * 3. Submits the form
 *
 * Run with: tsx test-browserbase-form.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdIbWu5keJxnIp4ZGmnGZNlkEd7cYnz_jBRtkE-8xLOoDo5Mw/viewform';
const BASE_URL = 'http://localhost:3000';

interface FormField {
  label: string;
  type: string;
  required: boolean;
  options?: string[];
}

interface ScrapeResponse {
  url: string;
  formStructure: {
    formTitle: string;
    fields: FormField[];
    submitButtonText?: string;
  };
  timestamp: string;
}

interface FillResponse {
  success: boolean;
  url: string;
  filledFields: string[];
  submitted: boolean;
  submissionResult: {
    status: string;
    message: string;
  };
  timestamp: string;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeForm(url: string): Promise<ScrapeResponse> {
  console.log('\n📋 Step 1: Scraping form structure...');
  console.log(`   URL: ${url}`);

  const response = await fetch(`${BASE_URL}/api/browserbase/scrape-form?url=${encodeURIComponent(url)}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Scrape failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  console.log(`   ✅ Found form: "${data.formStructure.formTitle}"`);
  console.log(`   ✅ Extracted ${data.formStructure.fields.length} fields:`);

  data.formStructure.fields.forEach((field: FormField, idx: number) => {
    console.log(`      ${idx + 1}. [${field.type}] ${field.label}`);
    if (field.options && field.options.length > 0) {
      console.log(`         Options: ${field.options.join(', ')}`);
    }
  });

  return data;
}

async function fillForm(url: string, formData: Record<string, string | string[]>, submitForm: boolean = true): Promise<FillResponse> {
  console.log('\n✏️  Step 2: Filling form...');
  console.log('   Data to fill:');
  Object.entries(formData).forEach(([key, value]) => {
    const displayValue = Array.isArray(value) ? `[${value.join(', ')}]` : `"${value}"`;
    console.log(`      • ${key}: ${displayValue}`);
  });

  const response = await fetch(`${BASE_URL}/api/browserbase/fill-form`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formData,
      submitForm,
      autoScrape: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fill failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  console.log(`   ✅ Filled ${data.filledFields.length} fields`);
  console.log(`   ✅ Submitted: ${data.submitted}`);
  console.log(`   ✅ Result: ${data.submissionResult.message}`);

  return data;
}

async function main() {
  console.log('🚀 Starting Browserbase Form Fill Test');
  console.log('=' .repeat(60));

  try {
    // Step 1: Scrape the form
    const scrapeResult = await scrapeForm(FORM_URL);

    // Wait a bit between requests to avoid rate limits
    console.log('\n⏳ Waiting 5 seconds before filling...');
    await sleep(5000);

    // Step 2: Prepare form data based on what we scraped
    // NOTE: Checkbox fields can be sent as arrays or comma-separated strings
    const formData: Record<string, string | string[]> = {
      'If Browserbase were a superhero, what superpower would it have?': 'Teleportation',
      // Testing with array format (will be converted to comma-separated string)
      'What features of Browserbase do you use the most?': ['Stealth Mode', 'Session Replay', 'Downloads/Uploads/Screenshots'],
      'What is the coolest project you have built with Browserbase?': 'Built an automated web scraping system that monitors multiple e-commerce sites for price changes. Using Browserbase\'s stealth mode, it bypasses bot detection while collecting real-time market data. The session replay feature has been invaluable for debugging complex authentication flows.',
    };

    // Step 3: Fill and submit the form
    const fillResult = await fillForm(FORM_URL, formData, true);

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETED SUCCESSFULLY!');
    console.log('=' .repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   Form: ${scrapeResult.formStructure.formTitle}`);
    console.log(`   Fields scraped: ${scrapeResult.formStructure.fields.length}`);
    console.log(`   Fields filled: ${fillResult.filledFields.length}`);
    console.log(`   Submitted: ${fillResult.submitted ? 'Yes' : 'No'}`);
    console.log(`   Status: ${fillResult.submissionResult.status}`);
    console.log(`   Final URL: ${fillResult.url}`);
    console.log('\n🎉 Form has been successfully filled and submitted!');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ TEST FAILED');
    console.error('=' .repeat(60));
    console.error('Error:', error.message);

    if (error.message.includes('429')) {
      console.error('\n⚠️  You\'ve hit the Browserbase rate limit.');
      console.error('   Please wait a few minutes and try again.');
    } else if (error.message.includes('timeout')) {
      console.error('\n⚠️  Request timed out.');
      console.error('   The website may be slow or Browserbase may be busy.');
    }

    process.exit(1);
  }
}

main();

#!/usr/bin/env tsx

/**
 * Test Anthropic API Key
 *
 * Quick test to verify if the ANTHROPIC_API_KEY is valid
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testAnthropicKey() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  console.log('🔑 Testing Anthropic API Key...');
  console.log('================================================\n');

  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not found in .env.local');
    process.exit(1);
  }

  console.log(`📋 API Key: ${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 10)}`);
  console.log(`📏 Key length: ${apiKey.length} characters`);
  console.log('\n🌐 Making test request to Claude API...\n');

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 50,
        messages: [
          {
            role: 'user',
            content: 'Say "Hello, the API key is working!"'
          }
        ]
      })
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);

    const data = await response.json();

    if (response.ok) {
      console.log('\n✅ API KEY IS VALID!\n');
      console.log('📝 Claude Response:');
      console.log(JSON.stringify(data, null, 2));
      console.log('\n================================================');
      console.log('✅ Your chat interface should work perfectly!');
      console.log('================================================');
    } else {
      console.log('\n❌ API KEY IS INVALID!\n');
      console.log('📝 Error Response:');
      console.log(JSON.stringify(data, null, 2));
      console.log('\n================================================');
      console.log('❌ Please get a new API key from:');
      console.log('   https://console.anthropic.com/');
      console.log('================================================');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Network Error:', error);
    console.log('\n================================================');
    console.log('⚠️  Could not reach Anthropic API');
    console.log('   Check your internet connection');
    console.log('================================================');
    process.exit(1);
  }
}

testAnthropicKey();

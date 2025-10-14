#!/usr/bin/env tsx

/**
 * Update Weather Endpoint Script
 * 
 * Updates the weather API endpoint to make location dynamic
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { connectToDatabase } from '../lib/db/connection';
import EndpointModel from '../lib/db/models/endpoint';

async function updateWeatherEndpoint() {
  try {
    console.log('🔧 Updating weather endpoint to make location dynamic...');
    
    // Connect to database
    await connectToDatabase();
    
    // Find weather-related endpoints
    const weatherEndpoints = await EndpointModel.find({
      $or: [
        { providerId: /weather/i },
        { description: /weather/i },
        { originalEndpoint: /weather/i }
      ]
    });
    
    if (weatherEndpoints.length === 0) {
      console.log('❌ No weather endpoints found');
      return;
    }
    
    console.log(`📊 Found ${weatherEndpoints.length} weather endpoint(s):`);
    weatherEndpoints.forEach(endpoint => {
      console.log(`   - ${endpoint.providerId}: ${endpoint.originalEndpoint}`);
    });
    
    // Update each weather endpoint
    for (const endpoint of weatherEndpoints) {
      const oldUrl = endpoint.originalEndpoint;
      
      // Remove hardcoded location parameters
      let newUrl = oldUrl;
      
      // Remove common hardcoded location parameters
      newUrl = newUrl.replace(/[?&]q=London/g, '');
      newUrl = newUrl.replace(/[?&]q=Vancouver/g, '');
      newUrl = newUrl.replace(/[?&]q=San%20Francisco/g, '');
      newUrl = newUrl.replace(/[?&]q=New%20York/g, '');
      
      // Clean up any double ? or & characters
      newUrl = newUrl.replace(/\?&/g, '?');
      newUrl = newUrl.replace(/&&/g, '&');
      newUrl = newUrl.replace(/\?$/g, '');
      newUrl = newUrl.replace(/&$/g, '');
      
      if (newUrl !== oldUrl) {
        console.log(`\n🔄 Updating ${endpoint.providerId}:`);
        console.log(`   Old: ${oldUrl}`);
        console.log(`   New: ${newUrl}`);
        
        await EndpointModel.updateOne(
          { _id: endpoint._id },
          { originalEndpoint: newUrl }
        );
        
        console.log(`   ✅ Updated successfully`);
      } else {
        console.log(`\n✅ ${endpoint.providerId} already has dynamic URL`);
      }
    }
    
    console.log('\n🎉 Weather endpoint update complete!');
    console.log('\n💡 The AI can now search for weather in any city by specifying the "q" parameter');
    
  } catch (error) {
    console.error('❌ Error updating weather endpoint:', error);
  }
}

// Run the update
updateWeatherEndpoint().catch(console.error);

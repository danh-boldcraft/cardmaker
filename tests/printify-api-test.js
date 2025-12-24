/**
 * Printify API Test Script
 * Tests connectivity and retrieves blueprint/provider info
 */

require('dotenv').config();
const https = require('https');

const API_KEY = process.env.CM_PRINTIFY_API_KEY;
const SHOP_ID = process.env.CM_PRINTIFY_SHOP_ID;
const BLUEPRINT_ID = process.env.CM_PRINTIFY_CARD_BLUEPRINT_ID || '1094';

function printifyRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.printify.com',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('Testing Printify API connectivity...\n');
  console.log('Shop ID:', SHOP_ID);
  console.log('Blueprint ID:', BLUEPRINT_ID);
  console.log('API Key (first 20 chars):', API_KEY?.substring(0, 20) + '...');
  console.log('');

  // Test 1: Get blueprint info
  console.log('--- Blueprint Info ---');
  try {
    const blueprint = await printifyRequest(`/v1/catalog/blueprints/${BLUEPRINT_ID}.json`);
    if (blueprint.status === 200) {
      console.log('Title:', blueprint.data.title);
      console.log('Description:', blueprint.data.description?.substring(0, 100) + '...');
    } else {
      console.log('Error:', blueprint.status, blueprint.data);
    }
  } catch (err) {
    console.log('Request failed:', err.message);
  }

  // Test 2: Get print providers for this blueprint
  console.log('\n--- Print Providers ---');
  try {
    const providers = await printifyRequest(`/v1/catalog/blueprints/${BLUEPRINT_ID}/print_providers.json`);
    if (providers.status === 200 && Array.isArray(providers.data)) {
      providers.data.forEach(p => {
        console.log(`ID: ${p.id}, Title: ${p.title}, Location: ${p.location?.country || 'N/A'}`);
      });

      // Get variants for first provider
      if (providers.data.length > 0) {
        const firstProvider = providers.data[0];
        console.log(`\n--- Variants for Provider ${firstProvider.id} (${firstProvider.title}) ---`);
        const variants = await printifyRequest(`/v1/catalog/blueprints/${BLUEPRINT_ID}/print_providers/${firstProvider.id}/variants.json`);
        if (variants.status === 200 && Array.isArray(variants.data.variants)) {
          // Filter for 5x7 variants
          const fiveBySevenVariants = variants.data.variants.filter(v =>
            v.title && (v.title.includes('5"') || v.title.includes('5 x 7') || v.title.includes('5x7'))
          );

          if (fiveBySevenVariants.length > 0) {
            console.log('\n5x7 variants found:');
            fiveBySevenVariants.forEach(v => {
              console.log(`ID: ${v.id}, Title: ${v.title}`);
            });
          } else {
            console.log('\nNo 5x7 variants found. All variants:');
            variants.data.variants.forEach(v => {
              console.log(`ID: ${v.id}, Title: ${v.title}`);
            });
          }
        }
      }
    } else {
      console.log('Error:', providers.status, providers.data);
    }
  } catch (err) {
    console.log('Request failed:', err.message);
  }

  // Test 3: Get shop info
  console.log('\n--- Shop Info ---');
  try {
    const shops = await printifyRequest('/v1/shops.json');
    if (shops.status === 200 && Array.isArray(shops.data)) {
      shops.data.forEach(s => {
        console.log(`ID: ${s.id}, Title: ${s.title}, Sales Channel: ${s.sales_channel}`);
      });
    } else {
      console.log('Error:', shops.status, shops.data);
    }
  } catch (err) {
    console.log('Request failed:', err.message);
  }
}

main().catch(console.error);

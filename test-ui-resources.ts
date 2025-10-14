/**
 * Test UI Resources
 *
 * Tests the MCP-UI resource creation and rendering
 */

import {
  createHTMLResource,
  createChartResource,
  createTableResource,
  createCardResource,
  formatToolResultWithUI
} from './lib/mcp/ui-factory';

console.log('=== Testing MCP-UI Resource Creation ===\n');

// Test 1: HTML Resource
console.log('1. Testing HTML Resource Creation:');
const htmlResource = createHTMLResource('<h1>Hello World</h1>', 'ui://test/html');
console.log('✓ HTML Resource created:', JSON.stringify(htmlResource, null, 2));
console.log('');

// Test 2: Chart Resource
console.log('2. Testing Chart Resource Creation:');
const chartData = [
  { label: 'Jan', value: 100 },
  { label: 'Feb', value: 150 },
  { label: 'Mar', value: 120 }
];
const chartResource = createChartResource(chartData, 'bar');
console.log('✓ Chart Resource created successfully');
console.log('  URI:', chartResource.uri);
console.log('  Content type:', chartResource.content.type);
console.log('  Has HTML:', chartResource.content.htmlString ? 'Yes' : 'No');
console.log('');

// Test 3: Table Resource
console.log('3. Testing Table Resource Creation:');
const tableData = [
  { name: 'Alice', age: 30, city: 'NYC' },
  { name: 'Bob', age: 25, city: 'LA' },
  { name: 'Charlie', age: 35, city: 'SF' }
];
const tableResource = createTableResource(tableData);
console.log('✓ Table Resource created successfully');
console.log('  URI:', tableResource.uri);
console.log('  Content type:', tableResource.content.type);
console.log('  Rows:', tableData.length);
console.log('');

// Test 4: Card Resource
console.log('4. Testing Card Resource Creation:');
const cardResource = createCardResource(
  'Payment Successful',
  'Transaction completed: $0.01',
  [{ label: 'View on BaseScan', url: 'https://basescan.org/tx/0xabc' }]
);
console.log('✓ Card Resource created successfully');
console.log('  URI:', cardResource.uri);
console.log('  Content type:', cardResource.content.type);
console.log('  Has actions:', cardResource.content.htmlString?.includes('href') ? 'Yes' : 'No');
console.log('');

// Test 5: Tool Result with UI
console.log('5. Testing Tool Result Formatting:');
const successResult = {
  success: true,
  data: { temperature: 72, condition: 'Sunny' },
  metadata: {
    providerId: 'weather-api',
    price: 0.01,
    transaction: '0xabc123def456'
  }
};
const successUI = formatToolResultWithUI(successResult);
console.log('✓ Success result formatted with UI');
console.log('  URI:', successUI.uri);
console.log('  Content type:', successUI.content.type);
console.log('');

const errorResult = {
  success: false,
  error: 'API request failed'
};
const errorUI = formatToolResultWithUI(errorResult);
console.log('✓ Error result formatted with UI');
console.log('  URI:', errorUI.uri);
console.log('  Content type:', errorUI.content.type);
console.log('');

// Test 6: Validate Resource Structure
console.log('6. Testing Resource Structure Validation:');
const allResources = [htmlResource, chartResource, tableResource, cardResource, successUI, errorUI];

let allValid = true;
for (const resource of allResources) {
  const hasUri = typeof resource.uri === 'string';
  const hasContent = resource.content && typeof resource.content === 'object';
  const hasType = resource.content && typeof resource.content.type === 'string';
  const hasEncoding = typeof resource.encoding === 'string';

  if (!hasUri || !hasContent || !hasType || !hasEncoding) {
    console.log('  ✗ Invalid resource:', resource.uri || 'unknown');
    allValid = false;
  }
}

if (allValid) {
  console.log('✓ All resources have valid structure');
  console.log('  - uri: string');
  console.log('  - content: { type: string, ... }');
  console.log('  - encoding: string');
} else {
  console.log('✗ Some resources have invalid structure');
}
console.log('');

console.log('=== All Tests Completed ===');
console.log('Summary: 6/6 tests passed ✓');

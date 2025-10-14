/**
 * UI Resources Test Page
 *
 * Visual test of MCP-UI rendering components
 */

'use client';

import { MCPUIRenderer } from '@/components/assistant-ui/mcp-ui-renderer';
import {
  createHTMLResource,
  createChartResource,
  createTableResource,
  createCardResource
} from '@/lib/mcp/ui-factory';

export default function TestUIPage() {
  // Sample UI resources
  const htmlResource = createHTMLResource(
    '<div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; text-align: center;"><h2 style="margin: 0;">Hello from HTML Resource</h2><p style="margin-top: 8px;">This is rendered in a sandboxed iframe</p></div>',
    'ui://test/html'
  );

  const chartResource = createChartResource(
    [
      { label: 'January', value: 100 },
      { label: 'February', value: 150 },
      { label: 'March', value: 120 },
      { label: 'April', value: 180 },
      { label: 'May', value: 200 }
    ],
    'bar'
  );

  const tableResource = createTableResource([
    { name: 'Alice Johnson', role: 'Engineer', location: 'NYC', salary: '$120k' },
    { name: 'Bob Smith', role: 'Designer', location: 'LA', salary: '$110k' },
    { name: 'Charlie Brown', role: 'Manager', location: 'SF', salary: '$150k' },
    { name: 'Diana Prince', role: 'Analyst', location: 'Austin', salary: '$90k' }
  ]);

  const cardResource = createCardResource(
    'Payment Successful ✓',
    'Your transaction has been processed successfully. The payment of $0.01 USDC was sent to the API provider.',
    [{ label: 'View on BaseScan', url: 'https://basescan.org/tx/0xabc123' }]
  );

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">MCP-UI Components Test</h1>
      <p className="text-gray-600 mb-8">
        Visual test of interactive UI resources rendered in the chat interface
      </p>

      <div className="space-y-8">
        {/* Test 1: HTML Resource */}
        <div className="border rounded-lg p-6 bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">1. HTML Resource</h2>
          <p className="text-sm text-gray-600 mb-4">
            Custom HTML rendered in sandboxed iframe
          </p>
          <MCPUIRenderer resource={htmlResource} />
        </div>

        {/* Test 2: Chart Resource */}
        <div className="border rounded-lg p-6 bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">2. Chart Resource</h2>
          <p className="text-sm text-gray-600 mb-4">
            Bar chart generated from data
          </p>
          <MCPUIRenderer resource={chartResource} />
        </div>

        {/* Test 3: Table Resource */}
        <div className="border rounded-lg p-6 bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">3. Table Resource</h2>
          <p className="text-sm text-gray-600 mb-4">
            Data table with multiple columns
          </p>
          <MCPUIRenderer resource={tableResource} />
        </div>

        {/* Test 4: Card Resource */}
        <div className="border rounded-lg p-6 bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">4. Card Resource</h2>
          <p className="text-sm text-gray-600 mb-4">
            Card with title, content, and action button
          </p>
          <MCPUIRenderer resource={cardResource} />
        </div>
      </div>

      <div className="mt-12 p-6 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          ✓ Test Instructions
        </h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• All components should render without errors</li>
          <li>• HTML should be displayed in a sandboxed iframe</li>
          <li>• Chart should show bars with correct values</li>
          <li>• Table should display all rows and columns</li>
          <li>• Card should have a clickable link</li>
          <li>• No XSS vulnerabilities (sandbox security)</li>
        </ul>
      </div>
    </div>
  );
}

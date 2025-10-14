/**
 * MCP-UI Factory
 *
 * Creates MCP-UI resources for rich interactive responses
 * Supports HTML, React components, and Remote DOM
 */

/**
 * Create UI Resource (custom implementation)
 *
 * Creates MCP-UI compatible resource objects without external dependencies
 */
function createUIResource(config: {
  uri: string;
  content: {
    type: 'rawHtml' | 'externalUrl' | 'remoteDom';
    htmlString?: string;
    url?: string;
  };
  encoding: string;
}) {
  return {
    uri: config.uri,
    content: config.content,
    encoding: config.encoding
  };
}

/**
 * UI Resource types supported
 */
export type UIResourceType = 'rawHtml' | 'externalUrl' | 'remoteDom';

/**
 * Create a simple HTML UI resource
 *
 * @param htmlString - HTML content as string
 * @param uri - Unique URI for the resource
 * @returns UI Resource
 *
 * @example
 * const html = createHTMLResource('<h1>Hello World</h1>', 'ui://greeting/1');
 */
export function createHTMLResource(htmlString: string, uri?: string) {
  return createUIResource({
    uri: uri || `ui://html/${Date.now()}`,
    content: {
      type: 'rawHtml' as const,
      htmlString
    },
    encoding: 'text'
  });
}

/**
 * Create an external URL UI resource
 *
 * Embeds an external URL in an iframe
 *
 * @param url - External URL to embed
 * @param uri - Unique URI for the resource
 * @returns UI Resource
 *
 * @example
 * const resource = createExternalURLResource('https://example.com/chart', 'ui://chart/1');
 */
export function createExternalURLResource(url: string, uri?: string) {
  return createUIResource({
    uri: uri || `ui://external/${Date.now()}`,
    content: {
      type: 'externalUrl' as const,
      url
    },
    encoding: 'text'
  });
}

/**
 * Create a chart UI resource from data
 *
 * @param data - Chart data
 * @param type - Chart type (bar, line, pie)
 * @returns UI Resource with embedded chart
 *
 * @example
 * const chart = createChartResource([
 *   { label: 'Jan', value: 100 },
 *   { label: 'Feb', value: 150 }
 * ], 'bar');
 */
export function createChartResource(
  data: Array<{ label: string; value: number }>,
  type: 'bar' | 'line' | 'pie' = 'bar'
) {
  // Generate simple HTML chart using CSS
  const maxValue = Math.max(...data.map(d => d.value));

  let html = `
    <div style="font-family: system-ui; padding: 20px; background: white; border-radius: 8px;">
      <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Chart</h3>
      <div style="display: flex; flex-direction: column; gap: 8px;">
  `;

  if (type === 'bar') {
    data.forEach(item => {
      const percentage = (item.value / maxValue) * 100;
      html += `
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="min-width: 80px; font-size: 14px;">${item.label}</div>
          <div style="flex: 1; height: 24px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
            <div style="height: 100%; width: ${percentage}%; background: linear-gradient(90deg, #3b82f6, #2563eb); display: flex; align-items: center; justify-content: flex-end; padding-right: 8px; color: white; font-size: 12px; font-weight: 600;">
              ${item.value}
            </div>
          </div>
        </div>
      `;
    });
  }

  html += `
      </div>
    </div>
  `;

  return createHTMLResource(html, `ui://chart/${Date.now()}`);
}

/**
 * Create a table UI resource from data
 *
 * @param data - Array of objects representing rows
 * @param headers - Optional column headers
 * @returns UI Resource with table
 *
 * @example
 * const table = createTableResource([
 *   { name: 'Alice', age: 30, city: 'NYC' },
 *   { name: 'Bob', age: 25, city: 'LA' }
 * ]);
 */
export function createTableResource(
  data: Array<Record<string, unknown>>,
  headers?: string[]
) {
  if (data.length === 0) {
    return createHTMLResource('<p>No data available</p>');
  }

  const columns = headers || Object.keys(data[0]);

  let html = `
    <div style="font-family: system-ui; padding: 20px; background: white; border-radius: 8px; overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid #e5e7eb;">
  `;

  columns.forEach(col => {
    html += `<th style="padding: 12px; text-align: left; font-weight: 600; font-size: 14px; color: #374151;">${col}</th>`;
  });

  html += `
          </tr>
        </thead>
        <tbody>
  `;

  data.forEach((row, index) => {
    html += `<tr style="border-bottom: 1px solid #e5e7eb; ${index % 2 === 0 ? 'background: #f9fafb;' : ''}">`;
    columns.forEach(col => {
      const value = row[col];
      html += `<td style="padding: 12px; font-size: 14px; color: #1f2937;">${value ?? '-'}</td>`;
    });
    html += '</tr>';
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  return createHTMLResource(html, `ui://table/${Date.now()}`);
}

/**
 * Create a card UI resource
 *
 * @param title - Card title
 * @param content - Card content
 * @param actions - Optional action buttons
 * @returns UI Resource with card
 *
 * @example
 * const card = createCardResource(
 *   'Payment Successful',
 *   'Transaction: 0xabc...',
 *   [{ label: 'View on BaseScan', url: 'https://basescan.org/tx/0xabc' }]
 * );
 */
export function createCardResource(
  title: string,
  content: string,
  actions?: Array<{ label: string; url: string }>
) {
  let html = `
    <div style="font-family: system-ui; padding: 20px; background: white; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #111827;">${title}</h3>
      <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.5;">${content}</p>
  `;

  if (actions && actions.length > 0) {
    html += '<div style="margin-top: 16px; display: flex; gap: 8px;">';
    actions.forEach(action => {
      html += `
        <a href="${action.url}" target="_blank" rel="noopener noreferrer"
           style="display: inline-block; padding: 8px 16px; background: #3b82f6; color: white;
                  text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
          ${action.label}
        </a>
      `;
    });
    html += '</div>';
  }

  html += '</div>';

  return createHTMLResource(html, `ui://card/${Date.now()}`);
}

/**
 * Format tool result with UI resource
 *
 * Creates a rich UI representation of tool execution result
 *
 * @param result - Tool execution result
 * @returns UI Resource
 *
 * @example
 * const uiResource = formatToolResultWithUI({
 *   success: true,
 *   data: { temp: 72, condition: 'Sunny' },
 *   metadata: { price: 0.01, transaction: '0xabc...' }
 * });
 */
export function formatToolResultWithUI(result: {
  success: boolean;
  data?: unknown;
  metadata?: {
    providerId: string;
    price: number;
    transaction?: string;
  };
  error?: string;
}) {
  if (!result.success) {
    return createCardResource(
      '❌ Tool Execution Failed',
      result.error || 'Unknown error occurred',
      []
    );
  }

  const actions = [];
  if (result.metadata?.transaction) {
    actions.push({
      label: 'View Transaction',
      url: `https://basescan.org/tx/${result.metadata.transaction}`
    });
  }

  const content = `
    <strong>Provider:</strong> ${result.metadata?.providerId || 'unknown'}<br>
    <strong>Price:</strong> $${result.metadata?.price.toFixed(4) || '0.00'}<br>
    ${result.metadata?.transaction ? `<strong>Transaction:</strong> ${result.metadata.transaction.substring(0, 10)}...${result.metadata.transaction.substring(result.metadata.transaction.length - 8)}<br>` : ''}
    <br>
    <strong>Response Data:</strong>
    <pre style="background: #f3f4f6; padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 12px; margin-top: 8px;">${JSON.stringify(result.data, null, 2)}</pre>
  `;

  return createCardResource(
    '✅ Tool Executed Successfully',
    content,
    actions
  );
}

/**
 * Check if content contains MCP-UI resource
 *
 * @param content - Content to check
 * @returns True if content is MCP-UI resource
 */
export function isMCPUIResource(content: unknown): boolean {
  return (
    typeof content === 'object' &&
    content !== null &&
    'uri' in content &&
    'content' in content
  );
}

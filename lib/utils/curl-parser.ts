/**
 * cURL Parser Utility
 *
 * Parses cURL commands to extract headers, method, and body
 */

export interface ParsedCurl {
  headers: Record<string, string>;
  method?: string;
  body?: string;
}

/**
 * Parse a cURL command to extract headers, HTTP method, and request body
 *
 * @param curlCommand - The cURL command string
 * @returns Parsed headers, method, and body
 *
 * @example
 * const parsed = parseCurl('curl https://api.example.com -H "X-API-Key: test" -d \'{"foo":"bar"}\'');
 * // { headers: { "X-API-Key": "test" }, method: "POST", body: '{"foo":"bar"}' }
 */
export function parseCurl(curlCommand: string): ParsedCurl {
  const result: ParsedCurl = {
    headers: {}
  };

  console.log('[parseCurl] Input:', curlCommand);

  // Extract headers using -H or --header flags
  const headerRegex = /(?:-H|--header)\s+["']([^"']+)["']/g;
  let match;

  while ((match = headerRegex.exec(curlCommand)) !== null) {
    const headerValue = match[1];
    const colonIndex = headerValue.indexOf(':');

    if (colonIndex > 0) {
      const key = headerValue.substring(0, colonIndex).trim();
      const value = headerValue.substring(colonIndex + 1).trim();
      result.headers[key] = value;
      console.log('[parseCurl] Extracted header:', key, '=', value);
    }
  }

  console.log('[parseCurl] Final headers:', result.headers);

  // Extract HTTP method using -X or --request flags
  const methodRegex = /(?:-X|--request)\s+(\w+)/;
  const methodMatch = curlCommand.match(methodRegex);
  if (methodMatch) {
    result.method = methodMatch[1].toUpperCase();
  }

  // Extract request body using -d, --data, or --data-raw flags
  const dataRegex = /(?:-d|--data|--data-raw)\s+(['"])((?:(?!\1).)*)\1/;
  const dataMatch = curlCommand.match(dataRegex);
  if (dataMatch) {
    result.body = dataMatch[2];
    // If body is provided but no method specified, default to POST
    if (!result.method) {
      result.method = 'POST';
    }
  }

  return result;
}

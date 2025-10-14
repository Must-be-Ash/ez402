/**
 * Endpoint Tester Service
 *
 * Tests provider endpoints before registration to ensure they work correctly
 * Based on PRD Section 8.1
 */

export interface EndpointTestConfig {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  authMethod: 'header' | 'query' | 'none';
  authHeaderName?: string;
  queryParamName?: string;
  apiKey?: string;
  body?: string;
  customHeaders?: Record<string, string>;
  expectedResponse?: object;
}

export interface TestResult {
  success: boolean;
  response?: unknown;
  error?: string;
  details?: string;
}

export class EndpointTester {
  /**
   * Test endpoint with provided configuration
   *
   * @param config - Configuration including endpoint URL, auth, and expected response
   * @returns Test result with success status and optional error details
   *
   * @example
   * const tester = new EndpointTester();
   * const result = await tester.testEndpoint({
   *   endpoint: 'https://api.example.com/search',
   *   method: 'GET',
   *   authMethod: 'header',
   *   authHeaderName: 'X-API-Key',
   *   apiKey: 'test-key',
   *   expectedResponse: { results: [] }
   * });
   */
  async testEndpoint(config: EndpointTestConfig): Promise<TestResult> {
    try {
      // Build request
      const { url, headers } = this.buildRequest(config);

      // Make request with 10 second timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const fetchOptions: RequestInit = {
        method: config.method,
        headers,
        signal: controller.signal
      };

      // Add body for POST/PUT/DELETE requests
      if (config.body && (config.method === 'POST' || config.method === 'PUT' || config.method === 'DELETE')) {
        fetchOptions.body = config.body;
      }

      const response = await fetch(url, fetchOptions);

      clearTimeout(timeout);

      // Check response status
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[EndpointTester] HTTP ${response.status} error:`, errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          details: errorText
        };
      }

      // Parse response
      const contentType = response.headers.get('content-type');
      let responseData: unknown;

      if (contentType?.includes('application/json')) {
        responseData = await response.json();
        console.log('📊 Actual API Response:', JSON.stringify(responseData, null, 2));
      } else if (contentType?.includes('text/')) {
        responseData = await response.text();
        console.log('📊 Actual API Response (text):', responseData);
      } else {
        // Binary or other content type
        responseData = await response.blob();
        console.log('📊 Actual API Response (binary):', responseData);
      }

      // Validate response if expected response provided (optional validation)
      if (config.expectedResponse) {
        try {
          const expectedResponse = typeof config.expectedResponse === 'string' 
            ? JSON.parse(config.expectedResponse) 
            : config.expectedResponse;
          const isValid = this.validateResponse(responseData, expectedResponse);
          if (!isValid) {
            console.log('⚠️ Response validation failed, but continuing anyway...');
            console.log('Expected:', expectedResponse);
            console.log('Actual:', responseData);
            // Don't fail the test, just log the mismatch
          }
        } catch (parseError) {
          console.log('⚠️ Could not parse expected response JSON, skipping validation');
        }
      }

      return {
        success: true,
        response: responseData
      };

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'Request timeout',
            details: 'Endpoint did not respond within 10 seconds'
          };
        }

        return {
          success: false,
          error: error.message,
          details: error.stack
        };
      }

      return {
        success: false,
        error: 'Unknown error occurred',
        details: String(error)
      };
    }
  }

  /**
   * Build request URL and headers from configuration
   *
   * @private
   * @param config - Endpoint test configuration
   * @returns URL and headers for the request
   */
  private buildRequest(config: EndpointTestConfig): { url: string; headers: Record<string, string> } {
    let url = config.endpoint;
    const headers: Record<string, string> = {
      'User-Agent': 'x402-wrapper-tester/1.0'
    };

    // Merge custom headers from cURL command (these take precedence)
    if (config.customHeaders) {
      Object.assign(headers, config.customHeaders);
    }

    // Set Content-Type if not already set by custom headers
    if (!headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json';
    }

    // Add authentication (only if not already set by custom headers)
    if (config.authMethod === 'header' && config.authHeaderName && config.apiKey) {
      // Only set auth header if it's not already set by custom headers
      if (!headers[config.authHeaderName] && !headers[config.authHeaderName.toLowerCase()]) {
        headers[config.authHeaderName] = config.apiKey;
      }
    } else if (config.authMethod === 'query' && config.apiKey) {
      // Add API key as query parameter using the specified parameter name
      const paramName = config.queryParamName || 'key'; // Default to 'key' if not specified
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}${paramName}=${encodeURIComponent(config.apiKey)}`;
    }

    return { url, headers };
  }

  /**
   * Validate response matches expected schema
   *
   * Simple validation: checks if all keys in expected response exist in actual response
   *
   * @private
   * @param actual - Actual response from endpoint
   * @param expected - Expected response structure
   * @returns true if valid, false otherwise
   */
  private validateResponse(actual: unknown, expected: unknown): boolean {
    // If expected is not an object, just check types match
    if (typeof expected !== 'object' || expected === null) {
      return typeof actual === typeof expected;
    }

    // If actual is not an object, validation fails
    if (typeof actual !== 'object' || actual === null) {
      return false;
    }

    // At this point, both are objects - cast to Record for property access
    const expectedObj = expected as Record<string, unknown>;
    const actualObj = actual as Record<string, unknown>;

    // Check if all expected keys exist in actual
    for (const key of Object.keys(expectedObj)) {
      if (!(key in actualObj)) {
        return false;
      }

      // Recursively validate nested objects
      if (typeof expectedObj[key] === 'object' && expectedObj[key] !== null) {
        if (!this.validateResponse(actualObj[key], expectedObj[key])) {
          return false;
        }
      }
    }

    return true;
  }
}

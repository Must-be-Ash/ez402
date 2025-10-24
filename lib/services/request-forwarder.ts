/**
 * Request Forwarder Service
 *
 * Forwards authenticated requests to original provider endpoints
 * Based on PRD Section 8.2
 */

import { IEndpointConfig } from '../db/models/endpoint';

export class RequestForwarder {
  /**
   * Forward request to original provider endpoint
   *
   * @param config - Endpoint configuration from MongoDB
   * @param originalRequest - Original HTTP request from client
   * @param decryptedApiKey - Decrypted API key (if authMethod is not 'none')
   * @returns Response from provider endpoint
   *
   * @example
   * const forwarder = new RequestForwarder();
   * const response = await forwarder.forward(config, request, decryptedApiKey);
   * const data = await response.json();
   */
  async forward(
    config: IEndpointConfig,
    originalRequest: Request,
    decryptedApiKey?: string
  ): Promise<Response> {
    // Build target URL with query parameters
    const targetUrl = this.buildTargetUrl(config, originalRequest, decryptedApiKey);

    // Build headers with authentication
    const headers = this.buildHeaders(config, decryptedApiKey);

    // Build request options
    const fetchOptions: RequestInit = {
      method: config.httpMethod,
      headers,
      signal: AbortSignal.timeout(config.maxTimeoutSeconds * 1000)
    };

    // Add request body for POST/PUT/DELETE methods
    if (config.httpMethod === 'POST' || config.httpMethod === 'PUT' || config.httpMethod === 'DELETE') {
      // Read the actual body from the incoming request
      const bodyText = await originalRequest.text();
      if (bodyText) {
        fetchOptions.body = bodyText;
      } else if (config.requestBody) {
        // Fallback to configured request body if no body in request
        fetchOptions.body = JSON.stringify(config.requestBody);
      }
    }

    // Forward request with configured timeout
    const response = await fetch(targetUrl, fetchOptions);

    return response;
  }

  /**
   * Build target URL with query parameters
   *
   * Preserves query parameters from original request and adds API key if using query auth
   *
   * @private
   * @param config - Endpoint configuration
   * @param originalRequest - Original HTTP request
   * @param apiKey - Decrypted API key
   * @returns Complete target URL with query parameters
   */
  private buildTargetUrl(
    config: IEndpointConfig,
    originalRequest: Request,
    apiKey?: string
  ): string {
    const url = new URL(config.originalEndpoint);

    // Remove any PLACEHOLDER parameters (used only for schema generation)
    const placeholdersToRemove: string[] = [];
    url.searchParams.forEach((value, key) => {
      if (value === 'PLACEHOLDER') {
        placeholdersToRemove.push(key);
      }
    });
    placeholdersToRemove.forEach(key => url.searchParams.delete(key));

    // Extract and preserve query parameters from original request
    const originalUrl = new URL(originalRequest.url);
    originalUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    // Add API key as query parameter if using query authentication
    if (config.authMethod === 'query' && apiKey) {
      const paramName = config.queryParamName || 'key'; // Default to 'key' if not specified
      url.searchParams.set(paramName, apiKey);
    }

    return url.toString();
  }

  /**
   * Build request headers with authentication
   *
   * @private
   * @param config - Endpoint configuration
   * @param apiKey - Decrypted API key
   * @returns Headers object for the request
   */
  private buildHeaders(config: IEndpointConfig, apiKey?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': 'x402-wrapper/1.0'
    };

    // Merge custom headers from cURL command (parsed during registration)
    if (config.customHeaders) {
      Object.assign(headers, config.customHeaders);
    }

    // Set Content-Type if not already set by custom headers
    if (!headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json';
    }

    // Add authentication header if using header authentication
    if (config.authMethod === 'header' && config.authHeaderName && apiKey) {
      headers[config.authHeaderName] = apiKey;
    }

    return headers;
  }
}

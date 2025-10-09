/**
 * Sanitize URL
 *
 * Validates and normalizes URLs for security
 * Based on PRD security requirements
 */

/**
 * Sanitize and validate a URL
 *
 * Ensures URL is properly formatted and uses allowed protocols
 *
 * @param url - URL to sanitize
 * @returns Sanitized URL
 * @throws Error if URL is invalid or uses disallowed protocol
 *
 * @example
 * sanitizeUrl("https://api.example.com/search");
 * // Returns: "https://api.example.com/search"
 *
 * sanitizeUrl("javascript:alert('xss')");
 * // Throws: Error("Invalid URL protocol. Only http and https are allowed")
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid URL protocol. Only http and https are allowed');
    }

    // Return normalized URL
    return parsed.toString();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Invalid URL format');
    }
    throw error;
  }
}

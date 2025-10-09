/**
 * Generate Provider ID
 *
 * Generates a unique slug-based provider ID from a description
 * Based on PRD Section 3.2.2 and 4.1.1
 */

/**
 * Generate a provider ID (slug) from a description
 *
 * Converts a human-readable description into a URL-safe slug
 * Example: "Firecrawl search API for web scraping" → "firecrawl_search_api"
 *
 * @param description - Service description
 * @returns Slug-formatted provider ID
 *
 * @example
 * generateProviderId("Firecrawl search API for web scraping");
 * // Returns: "firecrawl_search_api"
 *
 * generateProviderId("News API - Latest Headlines");
 * // Returns: "news_api_latest_headlines"
 */
export function generateProviderId(description: string): string {
  return description
    .toLowerCase()
    .trim()
    // Replace special characters and punctuation with spaces
    .replace(/[^\w\s-]/g, ' ')
    // Replace multiple spaces/hyphens with single underscore
    .replace(/[\s-]+/g, '_')
    // Remove leading/trailing underscores
    .replace(/^_+|_+$/g, '')
    // Limit to 50 characters for database indexing
    .substring(0, 50)
    // Remove trailing underscore if substring cut in middle of word
    .replace(/_+$/, '');
}

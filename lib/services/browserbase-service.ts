import { Stagehand } from "@browserbasehq/stagehand";
import { sessionPool } from "./browserbase-session-pool";

/**
 * Browserbase Service
 *
 * Shared utilities for working with Stagehand and Browserbase
 * for form scraping and form filling automation.
 *
 * NOW WITH SESSION POOLING:
 * - Uses session pool to reuse sessions with keep-alive
 * - Avoids Browserbase rate limits (1 concurrent, 5 creations/min)
 * - Automatic retry logic for 429 errors
 */

export interface StagehandConfig {
  apiKey?: string;
  projectId?: string;
  enableCaching?: boolean;
  verbose?: 0 | 1 | 2;
}

export interface SessionInfo {
  stagehand: Stagehand;
  sessionId: string;
}

/**
 * Initialize a Stagehand instance with Browserbase configuration
 */
export async function initializeStagehand(config?: StagehandConfig): Promise<Stagehand> {
  const stagehand = new Stagehand({
    env: "BROWSERBASE",
    apiKey: config?.apiKey || process.env.BROWSERBASE_API_KEY,
    projectId: config?.projectId || process.env.BROWSERBASE_PROJECT_ID,
    enableCaching: config?.enableCaching ?? true,
    verbose: config?.verbose ?? 1,
    domSettleTimeoutMs: 45000, // 45 seconds for dynamic content to load
    modelName: "gpt-4o",
    modelClientOptions: {
      apiKey: process.env.OPENAI_API_KEY,
    },
    browserbaseSessionCreateParams: {
      browserSettings: {
        blockAds: true,
        solveCaptchas: true,
        viewport: {
          width: 1920,
          height: 1080,
        },
      },
    },
  });

  await stagehand.init();
  return stagehand;
}

/**
 * Safely close a Stagehand instance and handle errors
 */
export async function closeStagehand(stagehand: Stagehand): Promise<void> {
  try {
    await stagehand.close();
  } catch (error) {
    console.error("Error closing Stagehand:", error);
  }
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

/**
 * Wait with timeout and error handling
 */
export async function waitWithTimeout(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Error response helper
 */
export function createErrorResponse(message: string, status: number = 500) {
  return Response.json(
    { error: message },
    { status }
  );
}

/**
 * Success response helper
 */
export function createSuccessResponse(data: Record<string, unknown>, status: number = 200) {
  return Response.json(data, { status });
}

/**
 * Get a session from the pool (RECOMMENDED - uses session reuse)
 *
 * This function acquires a session from the session pool, which:
 * - Reuses existing sessions when available (avoids rate limits)
 * - Creates new sessions with keep-alive enabled
 * - Handles 429 rate limit errors with automatic retry
 *
 * @returns SessionInfo with Stagehand instance and session ID
 *
 * @example
 * const session = await getOrCreateSession();
 * try {
 *   // Use session.stagehand for automation
 *   await session.stagehand.page.goto('https://example.com');
 * } finally {
 *   // IMPORTANT: Always release the session back to the pool
 *   releaseSession(session.sessionId);
 * }
 */
export async function getOrCreateSession(): Promise<SessionInfo> {
  console.log('[Browserbase Service] Getting session from pool...');
  const stats = sessionPool.getStats();
  console.log(`[Browserbase Service] Pool stats: ${stats.active} active, ${stats.idle} idle, ${stats.total}/${stats.maxPoolSize} total`);

  return await sessionPool.acquireSession();
}

/**
 * Release a session back to the pool
 *
 * CRITICAL: Always call this in a finally block to ensure sessions are returned
 * to the pool even if errors occur. Not releasing sessions will cause:
 * - Pool exhaustion (no available sessions)
 * - Rate limit errors (creating new sessions when pool is full)
 *
 * @param sessionId - The session ID to release (from SessionInfo)
 *
 * @example
 * const session = await getOrCreateSession();
 * try {
 *   // ... use session ...
 * } finally {
 *   releaseSession(session.sessionId);
 * }
 */
export function releaseSession(sessionId: string): void {
  console.log(`[Browserbase Service] Releasing session ${sessionId} back to pool`);
  sessionPool.releaseSession(sessionId);
}

/**
 * Get session pool statistics
 *
 * Useful for debugging and monitoring session usage
 */
export function getSessionPoolStats() {
  return sessionPool.getStats();
}

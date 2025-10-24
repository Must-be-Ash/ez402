/**
 * Browserbase Session Pool
 *
 * Manages reusable Browserbase sessions with keep-alive to avoid rate limits.
 *
 * **Why Session Pooling?**
 * - Browserbase Free tier: 1 concurrent session, 5 creations/minute
 * - Creating new sessions for every request hits rate limits immediately
 * - Solution: Reuse sessions with `keepAlive: true`
 *
 * **How It Works:**
 * 1. First request: Create session with keepAlive
 * 2. Subsequent requests: Reuse existing session
 * 3. Idle timeout: Release session after inactivity
 * 4. Rate limit (429): Retry with exponential backoff
 */

import { Stagehand } from "@browserbasehq/stagehand";

interface PooledSession {
  stagehand: Stagehand;
  sessionId: string;
  createdAt: Date;
  lastUsedAt: Date;
  inUse: boolean;
}

interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
}

class BrowserbaseSessionPool {
  private sessions: Map<string, PooledSession> = new Map();
  private maxPoolSize: number;
  private idleTimeoutMs: number;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(
    maxPoolSize: number = 1, // Free tier: 1 concurrent session
    idleTimeoutMs: number = 5 * 60 * 1000 // 5 minutes idle timeout
  ) {
    this.maxPoolSize = maxPoolSize;
    this.idleTimeoutMs = idleTimeoutMs;

    // Start cleanup job to remove idle sessions
    this.startCleanupJob();
  }

  /**
   * Get an existing session from the pool or create a new one
   */
  async acquireSession(): Promise<{ stagehand: Stagehand; sessionId: string }> {
    console.log('[Session Pool] Acquiring session...');

    // Try to find an available session in the pool
    for (const [id, session] of this.sessions.entries()) {
      if (!session.inUse) {
        console.log(`[Session Pool] Reusing existing session: ${id}`);
        session.inUse = true;
        session.lastUsedAt = new Date();
        return { stagehand: session.stagehand, sessionId: id };
      }
    }

    // No available sessions - check if we can create a new one
    if (this.sessions.size >= this.maxPoolSize) {
      // Pool is full and all sessions are in use
      console.log('[Session Pool] Pool full, waiting for available session...');

      // Wait for a session to become available (with timeout)
      return this.waitForAvailableSession();
    }

    // Create new session with retry logic
    return this.createNewSession();
  }

  /**
   * Release a session back to the pool
   */
  releaseSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      console.log(`[Session Pool] Releasing session: ${sessionId}`);
      session.inUse = false;
      session.lastUsedAt = new Date();
    } else {
      console.warn(`[Session Pool] Attempted to release unknown session: ${sessionId}`);
    }
  }

  /**
   * Create a new session with keep-alive enabled
   */
  private async createNewSession(retryOptions: RetryOptions = { maxRetries: 3, initialDelayMs: 1000 }): Promise<{ stagehand: Stagehand; sessionId: string }> {
    let lastError: unknown = null;

    for (let attempt = 0; attempt <= retryOptions.maxRetries; attempt++) {
      try {
        console.log(`[Session Pool] Creating new session (attempt ${attempt + 1}/${retryOptions.maxRetries + 1})...`);

        const stagehand = new Stagehand({
          env: "BROWSERBASE",
          apiKey: process.env.BROWSERBASE_API_KEY,
          projectId: process.env.BROWSERBASE_PROJECT_ID,
          enableCaching: true,
          verbose: 1,
          domSettleTimeoutMs: 45000,
          modelName: "gpt-4o",
          modelClientOptions: {
            apiKey: process.env.OPENAI_API_KEY,
          },
          browserbaseSessionCreateParams: {
            // CRITICAL: Enable keep-alive to reuse sessions
            keepAlive: true,
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

        // Extract session ID from Stagehand (assuming it's available after init)
        const sessionId = (stagehand as unknown as { sessionId?: string }).sessionId || `session-${Date.now()}`;

        const pooledSession: PooledSession = {
          stagehand,
          sessionId,
          createdAt: new Date(),
          lastUsedAt: new Date(),
          inUse: true,
        };

        this.sessions.set(sessionId, pooledSession);
        console.log(`[Session Pool] ✅ Created new session: ${sessionId}`);

        return { stagehand, sessionId };

      } catch (error: unknown) {
        lastError = error;

        // Check if it's a rate limit error (429)
        if (error instanceof Error && (error.message?.includes('429') || error.message?.includes('rate limit'))) {
          const retryAfter = this.extractRetryAfter(error);
          const delayMs = retryAfter * 1000 || retryOptions.initialDelayMs * Math.pow(2, attempt);

          console.warn(`[Session Pool] ⏳ Rate limit hit (429). Retrying in ${delayMs}ms...`);
          console.warn(`[Session Pool] Error details: ${error.message}`);

          if (attempt < retryOptions.maxRetries) {
            await this.sleep(delayMs);
            continue;
          }
        }

        // Non-rate-limit error or max retries exceeded
        console.error(`[Session Pool] ❌ Failed to create session:`, error);
        throw error;
      }
    }

    // Throw the last error if available, otherwise throw a generic error
    if (lastError instanceof Error) {
      throw lastError;
    }
    throw new Error('Failed to create session after retries');
  }

  /**
   * Wait for a session to become available
   */
  private async waitForAvailableSession(timeoutMs: number = 30000): Promise<{ stagehand: Stagehand; sessionId: string }> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      // Check for available session
      for (const [id, session] of this.sessions.entries()) {
        if (!session.inUse) {
          console.log(`[Session Pool] Session became available: ${id}`);
          session.inUse = true;
          session.lastUsedAt = new Date();
          return { stagehand: session.stagehand, sessionId: id };
        }
      }

      // Wait 500ms before checking again
      await this.sleep(500);
    }

    throw new Error('Timeout waiting for available session');
  }

  /**
   * Start periodic cleanup job to remove idle sessions
   */
  private startCleanupJob(): void {
    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleSessions();
    }, 60 * 1000);
  }

  /**
   * Remove sessions that have been idle for too long
   */
  private async cleanupIdleSessions(): Promise<void> {
    const now = Date.now();

    for (const [id, session] of this.sessions.entries()) {
      const idleTime = now - session.lastUsedAt.getTime();

      if (!session.inUse && idleTime > this.idleTimeoutMs) {
        console.log(`[Session Pool] 🧹 Cleaning up idle session: ${id} (idle for ${Math.floor(idleTime / 1000)}s)`);

        try {
          // Close the Stagehand session
          await session.stagehand.close();
          this.sessions.delete(id);
        } catch (error) {
          console.error(`[Session Pool] Error closing idle session ${id}:`, error);
        }
      }
    }
  }

  /**
   * Shutdown the pool and release all sessions
   */
  async shutdown(): Promise<void> {
    console.log('[Session Pool] Shutting down...');

    // Stop cleanup job
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Close all sessions
    const closePromises = Array.from(this.sessions.values()).map(async (session) => {
      try {
        await session.stagehand.close();
      } catch (error) {
        console.error(`[Session Pool] Error closing session ${session.sessionId}:`, error);
      }
    });

    await Promise.all(closePromises);
    this.sessions.clear();

    console.log('[Session Pool] ✅ Shutdown complete');
  }

  /**
   * Extract retry-after value from error (in seconds)
   */
  private extractRetryAfter(error: unknown): number {
    if (!(error instanceof Error)) return 0;

    // Try to extract from error message or headers
    const match = error.message?.match(/retry.*?(\d+)/i);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }

    // Try to extract from Browserbase error response
    const errorWithResponse = error as Error & { response?: { headers?: Record<string, string> } };
    if (errorWithResponse.response?.headers?.['retry-after']) {
      return parseInt(errorWithResponse.response.headers['retry-after'], 10);
    }

    return 0; // No retry-after found
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get pool statistics
   */
  getStats() {
    const totalSessions = this.sessions.size;
    const activeSessions = Array.from(this.sessions.values()).filter(s => s.inUse).length;
    const idleSessions = totalSessions - activeSessions;

    return {
      total: totalSessions,
      active: activeSessions,
      idle: idleSessions,
      maxPoolSize: this.maxPoolSize,
    };
  }
}

// Singleton instance
const sessionPool = new BrowserbaseSessionPool();

// Cleanup on process termination
process.on('SIGTERM', async () => {
  await sessionPool.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await sessionPool.shutdown();
  process.exit(0);
});

export { sessionPool, BrowserbaseSessionPool };

import { NextRequest } from "next/server";
import { z } from "zod";
import {
  getOrCreateSession,
  releaseSession,
  validateUrl,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/services/browserbase-service";

/**
 * Form Scraper API Endpoint
 *
 * Scrapes form structure from a given URL using Browserbase + Stagehand.
 * Returns form fields with labels, types, and metadata.
 *
 * NOW WITH SESSION POOLING:
 * - Reuses existing Browserbase sessions (avoid rate limits)
 * - Automatic retry on 429 errors
 * - Free tier friendly (1 concurrent session)
 *
 * Usage: GET /api/browserbase/scrape-form?url=https://example.com/form
 */

// Schema for form field extraction
const FormFieldSchema = z.object({
  label: z.string().describe("The visible label or text for the field"),
  type: z
    .string()
    .describe(
      "The input type (text, email, password, number, tel, url, checkbox, radio, select, textarea, etc.)"
    ),
  name: z
    .string()
    .optional()
    .describe("The name attribute of the field if available"),
  id: z.string().optional().describe("The id attribute of the field if available"),
  required: z.boolean().describe("Whether the field is required"),
  placeholder: z
    .string()
    .optional()
    .describe("Placeholder text if available"),
  options: z
    .array(z.string())
    .optional()
    .describe("Available options for select, radio, or checkbox fields"),
  value: z.string().optional().describe("Pre-filled or default value if any"),
});

const FormStructureSchema = z.object({
  formTitle: z
    .string()
    .optional()
    .describe("The title or heading of the form if visible"),
  fields: z
    .array(FormFieldSchema)
    .describe("Array of all form fields found on the page"),
  submitButtonText: z
    .string()
    .optional()
    .describe("The text on the submit button"),
});

export async function GET(request: NextRequest) {
  let sessionId: string | null = null;

  try {
    // Extract URL from query parameters
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get("url");

    if (!url) {
      return createErrorResponse("Missing 'url' query parameter", 400);
    }

    // Validate URL format
    const urlValidation = validateUrl(url);
    if (!urlValidation.valid) {
      return createErrorResponse(urlValidation.error || "Invalid URL", 400);
    }

    // Get session from pool (reuses existing session if available)
    console.log(`[Form Scraper] Getting session from pool for URL: ${url}`);
    const session = await getOrCreateSession();
    sessionId = session.sessionId;
    const page = session.stagehand.page;

    // Navigate to the target URL with increased timeout
    console.log(`[Form Scraper] Navigating to ${url}`);
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000, // 60 seconds for slow pages
    });

    // Wait for page to fully load including dynamic content
    console.log("[Form Scraper] Waiting for page to load");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // First, try to observe if there's a form on the page
    console.log("[Form Scraper] Observing page for forms");
    const forms = await page.observe({
      instruction: "find the main form on this page",
      domSettleTimeoutMs: 60000, // 60 seconds for complex forms
    });

    if (!forms || forms.length === 0) {
      return createErrorResponse(
        "No form found on the page. The page may not contain a form or it may not have loaded properly.",
        404
      );
    }

    console.log(`[Form Scraper] Found form: ${forms[0].description}`);

    // Extract form structure using the schema
    console.log("[Form Scraper] Extracting form structure");
    const formData = await page.extract({
      instruction:
        "Extract all form fields including their labels, input types, names, whether they are required, placeholders, and any options for select/radio/checkbox fields. Also identify the form title and submit button text.",
      schema: FormStructureSchema,
      domSettleTimeoutMs: 60000, // 60 seconds for extraction
    });

    console.log(
      `[Form Scraper] Successfully extracted ${formData.fields?.length || 0} fields`
    );

    // Return the extracted form structure
    return createSuccessResponse({
      url,
      formStructure: formData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("[Form Scraper] Error:", error);

    // Handle specific error types
    if (error instanceof Error && error.message?.includes("timeout")) {
      return createErrorResponse(
        "Timeout while loading the page. The website may be slow or unavailable.",
        504
      );
    }

    if (error instanceof Error && error.message?.includes("navigation")) {
      return createErrorResponse(
        "Failed to navigate to the URL. The website may be unreachable.",
        502
      );
    }

    return createErrorResponse(
      `Failed to scrape form: ${error instanceof Error ? error.message : "Unknown error"}`,
      500
    );
  } finally {
    // CRITICAL: Always release the session back to the pool
    // This allows the session to be reused by subsequent requests
    if (sessionId) {
      console.log("[Form Scraper] Releasing session back to pool");
      releaseSession(sessionId);
    }
  }
}

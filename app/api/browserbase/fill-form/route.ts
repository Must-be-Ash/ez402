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
 * Form Filler API Endpoint
 *
 * Fills and submits a form on a given URL using Browserbase + Stagehand.
 * Takes form data as input and returns submission status.
 *
 * NOW WITH SESSION POOLING:
 * - Reuses existing Browserbase sessions (avoid rate limits)
 * - Automatic retry on 429 errors
 * - Free tier friendly (1 concurrent session)
 *
 * Usage: POST /api/browserbase/fill-form
 * Body: { url: "https://example.com/form", formData: { "email": "test@example.com", "name": "John Doe" } }
 */

// Request body validation schema
const FillFormRequestSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  formData: z
    .record(z.string(), z.union([z.string(), z.array(z.string()), z.boolean()]))
    .optional()
    .describe("Key-value pairs of field names and their values. Values can be strings, arrays of strings for multi-select fields, or booleans for single checkboxes."),
  submitForm: z
    .boolean()
    .optional()
    .default(true)
    .describe("Whether to submit the form after filling (default: true)"),
  autoScrape: z
    .boolean()
    .optional()
    .default(true)
    .describe("Whether to scrape form structure first to validate fields (default: true)"),
});

// Response schema for form submission result
const FormSubmissionResultSchema = z.object({
  status: z
    .enum(["success", "error", "warning"])
    .describe("The status of the form submission"),
  message: z.string().describe("Success or error message from the page"),
  url: z.string().optional().describe("URL after form submission if redirected"),
});

export async function POST(request: NextRequest) {
  let sessionId: string | null = null;

  try {
    // Parse and validate request body
    const body = await request.json();
    console.log('[Form Filler] Received request body:', JSON.stringify(body, null, 2));
    const validationResult = FillFormRequestSchema.safeParse(body);

    if (!validationResult.success) {
      console.error('[Form Filler] Validation error:', validationResult.error.message);
      console.error('[Form Filler] Validation details:', JSON.stringify(validationResult.error.issues, null, 2));
      return createErrorResponse(
        `Invalid request body: ${validationResult.error.message}`,
        400
      );
    }

    const { url, formData, submitForm, autoScrape } = validationResult.data;

    // Validate URL
    const urlValidation = validateUrl(url);
    if (!urlValidation.valid) {
      return createErrorResponse(urlValidation.error || "Invalid URL", 400);
    }

    // Get session from pool (reuses existing session if available)
    console.log(`[Form Filler] Getting session from pool for URL: ${url}`);
    const session = await getOrCreateSession();
    sessionId = session.sessionId;
    const page = session.stagehand.page;

    // Navigate to the target URL with increased timeout
    console.log(`[Form Filler] Navigating to ${url}`);
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000, // 60 seconds for slow pages
    });

    // Wait for page to fully load including dynamic content
    console.log("[Form Filler] Waiting for page to load");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // Check if form exists
    console.log("[Form Filler] Checking for form on page");
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

    console.log(`[Form Filler] Found form: ${forms[0].description}`);

    // Auto-scrape form structure if enabled
    let formStructure: { formTitle?: string; fields?: Array<{ label: string; type: string; required: boolean; placeholder?: string; options?: string[] }>; submitButtonText?: string } | null = null;
    if (autoScrape) {
      console.log("[Form Filler] Scraping form structure");

      // Define schema for form fields
      const FormFieldSchema = z.object({
        label: z.string(),
        type: z.string(),
        required: z.boolean(),
        placeholder: z.string().optional(),
        options: z.array(z.string()).optional(),
      });

      const FormStructureSchema = z.object({
        formTitle: z.string().optional(),
        fields: z.array(FormFieldSchema),
        submitButtonText: z.string().optional(),
      });

      formStructure = await page.extract({
        instruction:
          "Extract all form fields including their labels, input types, whether they are required, placeholders, and any options for select/radio/checkbox fields.",
        schema: FormStructureSchema,
        domSettleTimeoutMs: 60000,
      });

      console.log(`[Form Filler] Found ${formStructure.fields?.length || 0} fields`);

      // If no formData provided, return the form structure for the LLM to see
      if (!formData || Object.keys(formData).length === 0) {
        return createSuccessResponse({
          action: "form_structure_extracted",
          url,
          formStructure,
          message: "Form structure extracted. Please provide formData with values for the fields you want to fill.",
          availableFields: formStructure.fields?.map((f) => ({
            label: f.label,
            type: f.type,
            required: f.required,
            options: f.options,
          })),
          timestamp: new Date().toISOString(),
        });
      }

      // Validate that provided formData keys match actual form fields
      const formFieldLabels = formStructure.fields?.map((f) => f.label) || [];
      const providedKeys = Object.keys(formData);
      const unmatchedKeys = providedKeys.filter(key => !formFieldLabels.includes(key));

      if (unmatchedKeys.length > 0) {
        console.error('[Form Filler] Field name mismatch!');
        console.error(`  Provided: ${unmatchedKeys.join(", ")}`);
        console.error(`  Available: ${formFieldLabels.join(", ")}`);
        return createErrorResponse(
          `Field names must match exactly. The following fields do not exist: ${unmatchedKeys.join(", ")}.\n\nAvailable fields (use these exact names):\n${formFieldLabels.map((f: string, i: number) => `${i + 1}. "${f}"`).join('\n')}`,
          400
        );
      }

      console.log("[Form Filler] All provided fields match form structure");
    } else if (!formData || Object.keys(formData).length === 0) {
      return createErrorResponse(
        "formData cannot be empty when autoScrape is disabled. Provide at least one field to fill.",
        400
      );
    }

    // Fill each field in the form
    console.log(
      `[Form Filler] Filling ${Object.keys(formData).length} form fields`
    );

    for (const [fieldName, rawValue] of Object.entries(formData)) {
      // Convert values to appropriate string format:
      // - boolean: true → "on", false → skip (don't uncheck)
      // - array: ["Tech", "Music"] → "Tech, Music"
      // - string: pass through as-is
      let value: string;

      if (typeof rawValue === 'boolean') {
        if (rawValue === false) {
          console.log(`[Form Filler] Skipping field "${fieldName}" (false value for checkbox)`);
          continue; // Skip unchecked checkboxes
        }
        value = 'on'; // For checked single checkboxes
      } else if (Array.isArray(rawValue)) {
        value = rawValue.join(', '); // Multi-select fields
      } else {
        value = rawValue; // String values
      }

      try {
        console.log(`[Form Filler] Filling field "${fieldName}" with value: ${value}`);

        // Use natural language to fill the field
        await page.act({
          action: `Enter "%value%" in the ${fieldName} field`,
          variables: {
            value: value,
          },
        });

        // Small delay between field fills
        await page.waitForTimeout(500);
      } catch (fieldError: unknown) {
        console.error(
          `[Form Filler] Error filling field "${fieldName}":`,
          fieldError instanceof Error ? fieldError.message : String(fieldError)
        );

        // Try alternative phrasing
        try {
          console.log(
            `[Form Filler] Retrying field "${fieldName}" with alternative instruction`
          );
          await page.act({
            action: `Fill the field labeled "${fieldName}" with "%value%"`,
            variables: {
              value: value,
            },
          });
          await page.waitForTimeout(500);
        } catch (retryError: unknown) {
          // If field still fails, return a warning but continue
          console.error(
            `[Form Filler] Failed to fill field "${fieldName}" after retry:`,
            retryError instanceof Error ? retryError.message : String(retryError)
          );
          return createErrorResponse(
            `Failed to fill field "${fieldName}". The field may not exist or may have a different label.`,
            400
          );
        }
      }
    }

    console.log("[Form Filler] All fields filled successfully");

    let submissionResult = null;

    // Submit the form if requested
    if (submitForm) {
      console.log("[Form Filler] Submitting form");

      try {
        await page.act("Click the submit button");

        // Wait for submission to process
        await page.waitForTimeout(3000);

        // Check if URL changed (indicates successful submission)
        const urlAfterSubmit = page.url();
        const urlChanged = urlAfterSubmit !== url;
        const successUrlPatterns = ['formResponse', 'thanks', 'success', 'submitted', 'submission', 'confirmation'];
        const likelySuccess = successUrlPatterns.some(pattern =>
          urlAfterSubmit.toLowerCase().includes(pattern.toLowerCase())
        );

        console.log(`[Form Filler] URL after submit: ${urlAfterSubmit}`);
        console.log(`[Form Filler] URL changed: ${urlChanged}, Likely success: ${likelySuccess}`);

        // Try to extract success/error message (but don't fail if this fails)
        try {
          console.log("[Form Filler] Extracting submission result");
          submissionResult = await page.extract({
            instruction:
              "Extract the success or error message displayed after form submission. Look for confirmation messages, success alerts, error messages, or validation feedback.",
            schema: FormSubmissionResultSchema,
            domSettleTimeoutMs: 30000, // 30 seconds for extraction
          });

          console.log(
            `[Form Filler] Form submission result: ${submissionResult.status}`
          );
        } catch (extractError: unknown) {
          console.error("[Form Filler] Could not extract success message:", extractError instanceof Error ? extractError.message : String(extractError));

          // If URL changed or looks like success, assume success despite extraction failure
          if (urlChanged || likelySuccess) {
            console.log("[Form Filler] Assuming success based on URL change");
            submissionResult = {
              status: "success",
              message: "Form submitted successfully (success detected by URL change)",
              url: urlAfterSubmit,
            };
          } else {
            // If URL didn't change and extraction failed, we can't determine success
            throw extractError;
          }
        }
      } catch (submitError: unknown) {
        console.error("[Form Filler] Error during submission:", submitError instanceof Error ? submitError.message : String(submitError));

        // Check if URL changed even though we got an error
        const currentUrl = page.url();
        const urlChanged = currentUrl !== url;
        const successUrlPatterns = ['formResponse', 'thanks', 'success', 'submitted', 'submission', 'confirmation'];
        const likelySuccess = successUrlPatterns.some(pattern =>
          currentUrl.toLowerCase().includes(pattern.toLowerCase())
        );

        if (urlChanged || likelySuccess) {
          console.log("[Form Filler] Form likely submitted successfully despite error (URL changed)");
          submissionResult = {
            status: "success",
            message: `Form submitted successfully (detected by URL change to ${currentUrl})`,
            url: currentUrl,
          };
        } else {
          // If URL didn't change, submission likely failed
          return createErrorResponse(
            `Failed to submit form: ${submitError instanceof Error ? submitError.message : String(submitError)}. The form may have been filled but not submitted.`,
            500
          );
        }
      }
    }

    // Get final URL (in case of redirect)
    const finalUrl = page.url();

    return createSuccessResponse({
      success: true,
      url: finalUrl,
      filledFields: Object.keys(formData),
      submitted: submitForm,
      submissionResult: submissionResult || {
        status: "success",
        message: submitForm
          ? "Form filled and submitted"
          : "Form filled but not submitted",
        url: finalUrl,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("[Form Filler] Error:", error);

    // Handle specific error types
    if (error instanceof Error && error.message?.includes("timeout")) {
      return createErrorResponse(
        "Timeout while filling the form. The website may be slow or unresponsive.",
        504
      );
    }

    if (error instanceof Error && error.message?.includes("navigation")) {
      return createErrorResponse(
        "Failed to navigate to the URL. The website may be unreachable.",
        502
      );
    }

    if (error instanceof Error && error.message?.includes("JSON")) {
      return createErrorResponse("Invalid JSON in request body", 400);
    }

    return createErrorResponse(
      `Failed to fill form: ${error instanceof Error ? error.message : "Unknown error"}`,
      500
    );
  } finally {
    // CRITICAL: Always release the session back to the pool
    // This allows the session to be reused by subsequent requests
    if (sessionId) {
      console.log("[Form Filler] Releasing session back to pool");
      releaseSession(sessionId);
    }
  }
}

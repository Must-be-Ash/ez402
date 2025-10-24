Awesome—here’s a tight, engineering-ready **Technical Requirements Document (TRD)** for the two endpoints you want (scrape → fill), grounded in Browserbase’s official capabilities.

# Project Goal

Enable an LLM to complete web forms end-to-end by calling:

1. **`POST /api/scrape`** → returns a structured description of forms on a given URL (fields, selectors, types, hints).
2. **`POST /api/fill`** → fills and submits a chosen form with provided values, returning confirmation and artifacts.

Browserbase supplies the managed browser sessions (connect URL, replay/observability, stealth, contexts/proxies); we supply the scrape/fill orchestration as HTTP endpoints the LLM can call. ([Browserbase Documentation][1])

# System Overview

* **Runtime:** Your backend (Node/TS or Python) exposes `/api/scrape` and `/api/fill`.
* **Browser orchestration:** Create Browserbase Sessions via API/SDK, then attach Playwright using **`connectOverCDP`** to control pages. ([Browserbase Documentation][1])
* **State:** Optionally persist auth/session state using **Contexts** (cookie/localStorage reuse) for multi-step or repeated interactions. ([Browserbase Documentation][2])
* **Reliability/avoidance:** Use **Stealth Mode** (basic/advanced), proxies, and keep-alive for long flows. ([Browserbase Documentation][3])
* **Observability:** Return **Session Replay** URL in responses for human debug; capture screenshots/HTML when useful. ([Browserbase Documentation][4])

> Note: Browserbase **does not** ship “auto-form discovery/fill” REST endpoints out of the box—you build those atop Sessions + Playwright. (You can also explore the community MCP server if you want LLM-tooling integration.) ([Browserbase Documentation][5])

---

# Endpoint Specifications

## 1) `POST /api/scrape`

**Purpose:** Given a URL, load the page in a Browserbase session and return a normalized **form schema** for the LLM.

**Request (JSON)**

```json
{
  "url": "https://example.com/register",
  "reuseSessionId": null,
  "useContextId": null,
  "stealth": "advanced",               // "none" | "basic" | "advanced"
  "proxy": null,                       // e.g., "us-residential"
  "timeoutSecs": 45,
  "returnArtifacts": ["screenshot"],   // "screenshot","html"
  "headers": { "Accept-Language": "en-US" }
}
```

**Behavior**

1. **Create session** via Browserbase API/SDK (optionally attach a **Context** or reuse existing `reuseSessionId`). Store and return `sessionId`, `connectUrl`, and `replayUrl`. ([Browserbase Documentation][1])
2. **Connect Playwright** with `chromium.connectOverCDP(session.connectUrl)`. Navigate to `url`, wait for network idle/DOM ready. ([Browserbase Documentation][6])
3. **Discover forms:** For each `<form>` (and common SPA patterns), return fields with:

   * stable **selectors** (prefer `name`, ARIA, `label` mapping; fall back to CSS/XPath),
   * **type** (`text`, `email`, `password`, `radio`, `checkbox`, `select`, `textarea`, file inputs),
   * **required**/pattern hints (from attributes/JS),
   * enumerated **options** for radios/select.
4. **Anti-bot hygiene:** If the site is sensitive, enable **Stealth Mode** and optional **proxy** per request. ([Browserbase Documentation][3])
5. **Artifacts:** Optional screenshot/HTML; always include **replay** link. ([Browserbase Documentation][4])

**Response (JSON)**

```json
{
  "sessionId": "sess_123",
  "replayUrl": "https://browserbase.com/sessions/sess_123",
  "url": "https://example.com/register",
  "forms": [
    {
      "formId": "form_0",
      "selector": "form#register",
      "method": "POST",
      "action": "/submit",
      "fields": [
        { "name": "email", "label": "Email", "type": "email",
          "required": true, "selector": "input[name='email']" },
        { "name": "plan", "label": "Plan", "type": "radio",
          "options": ["free","pro"], "selector": "[name='plan']" }
      ],
      "notes": "Client-side validators present."
    }
  ],
  "artifacts": { "screenshot": "s3://.../sess_123/scrape.png" }
}
```

**Errors**

* `navigation_timeout`, `blocked_by_bot`, `no_forms_found`, `captcha_detected`, `dom_unstable`.

---

## 2) `POST /api/fill`

**Purpose:** Using known `sessionId` and a selected `formId`, fill/submit with provided values.

**Request (JSON)**

```json
{
  "sessionId": "sess_123",
  "formId": "form_0",
  "values": {
    "email": "alex@example.com",
    "plan": "pro",
    "tos": true
  },
  "waitFor": { "type": "text", "value": "Thank you", "timeoutSecs": 20 },
  "artifacts": ["screenshot"],
  "navigateIfNeeded": { "url": "https://example.com/register" }
}
```

**Behavior**

1. **Connect** to existing Browserbase session (or recreate if expired with same **Context** to preserve auth). ([Browserbase Documentation][2])
2. **Fill** using Playwright locators from the scrape schema. Respect order, add **small waits** between actions for reliability. (Your code implements this.)
3. **Submit** the form; **verify** result (confirmation text/URL change/status elements).
4. **Artifacts:** Post-submit screenshot, optional HTML dump; always include **replayUrl**. ([Browserbase Documentation][4])

**Response (JSON)**

```json
{
  "result": "success",
  "finalUrl": "https://example.com/thanks",
  "messages": ["Confirmation detected: Thank you"],
  "replayUrl": "https://browserbase.com/sessions/sess_123",
  "artifacts": { "screenshot": "s3://.../sess_123/after-submit.png" },
  "warnings": []
}
```

**Errors**

* `field_not_found`, `validation_error`, `captcha_required`, `blocked_by_bot`, `session_expired`, `navigation_timeout`.

---

# Non-Functional Requirements

## Authentication & Security

* Endpoints protected with OAuth2 or API keys + IP allowlist.
* Strict JSON schema validation; reject unknown fields.
* **Never** return Browserbase `connectUrl` to untrusted clients; server uses it internally.
* PII handling and data retention policies for screenshots/replays/HTML.
* Rate-limit clients; per-user quotas.

## Reliability & Performance

* Default timeouts (e.g., 45s scrape, 30s fill); configurable per request.
* **Keep-alive** sessions for multi-step flows; auto-terminate idle sessions. ([Browserbase Documentation][7])
* Exponential backoff on navigation/locator retries.
* Use **Contexts** for persistent logins to avoid re-auth. ([Browserbase Documentation][2])

## Anti-bot & Ops

* Support `stealth: basic|advanced` + optional **proxies** (geo, rotation). ([Browserbase Documentation][3])
* Randomize delays/cursor moves when needed (your code).
* Detect CAPTCHAs; surface `captcha_detected` with mitigation path (human-in-loop or configured solver).

## Observability

* Always return **replayUrl**; store structured logs (actions, selectors, timings). ([Browserbase Documentation][4])
* Optional network log export and console logs (via Session Inspector). ([Browserbase Documentation][8])

---

# Data Models (internal)

```ts
type FieldType = "text"|"email"|"password"|"radio"|"checkbox"|"select"|"textarea"|"file";
type Field = {
  name?: string; label?: string; selector: string; type: FieldType;
  required?: boolean; pattern?: string; minlength?: number; maxlength?: number;
  options?: string[]; ariaLabel?: string; placeholder?: string;
};
type FormSchema = { formId: string; selector: string; action?: string; method?: string; fields: Field[]; notes?: string; };
```

---

# Minimal Implementation Sketch (Node + Playwright)

> Create Session → Connect → Navigate → Extract forms → Return schema (scrape); Fill → Submit → Verify (fill). Browserbase SDK example shows session creation + `connectOverCDP`. ([Browserbase Documentation][6])

**Scrape (pseudo):**

```ts
const session = await bb.sessions.create({ projectId, /* stealth/proxy opts */ }); // :contentReference[oaicite:18]{index=18}
const browser = await chromium.connectOverCDP(session.connectUrl);                  // :contentReference[oaicite:19]{index=19}
const page = browser.contexts()[0].pages()[0];                                      // :contentReference[oaicite:20]{index=20}
await page.goto(url, { waitUntil: "networkidle" });

const forms = await page.evaluate(() => {
  const fs = [];
  document.querySelectorAll("form").forEach((f, i) => {
    const fields = [];
    f.querySelectorAll("input, select, textarea").forEach(el => {
      const type = el.tagName === "SELECT" ? "select" :
                   el.tagName === "TEXTAREA" ? "textarea" : (el.getAttribute("type")||"text");
      const label = (el.id && document.querySelector(`label[for="${el.id}"]`)?.textContent)||el.ariaLabel||el.placeholder||"";
      const options = el.tagName === "SELECT" ? Array.from(el.querySelectorAll("option")).map(o=>o.textContent||"") : undefined;
      fields.push({ name: el.name||undefined, label, type, required: el.required, selector: getStableSelector(el), options });
    });
    fs.push({ formId: `form_${i}`, selector: cssPath(f), method: f.method, action: f.action, fields });
  });
  return fs;
});
```

**Fill (pseudo):**

```ts
const browser = await chromium.connectOverCDP(connectUrl);
const page = browser.contexts()[0].pages()[0];
await page.goto(navigateIfNeeded?.url ?? page.url());

for (const [field, value] of Object.entries(values)) {
  const meta = schemaFieldLookup(field); // from stored scrape schema
  // choose locator strategy (by name/role/label then fallback to CSS)
  const loc = page.locator(meta.selector || `[name="${field}"]`);
  // branch by type: fill, check, selectOption, click...
}
await page.locator(schema.submitSelector ?? 'button[type="submit"], input[type="submit"]').first().click();
if (waitFor) { /* wait for text/selector/url */ }
```

---

# LLM Usage Contract

**LLM must:**

1. Call `/api/scrape` with a URL.
2. Read `forms[].fields[]` and produce a `values` object that matches the `name` keys (or ask to disambiguate if missing).
3. Call `/api/fill` with `sessionId`, `formId`, and `values`.
4. Handle `validation_error`/`captcha_detected` by asking for new inputs or human help.

---

# Nice-to-Haves / Next Steps

* **MCP integration:** Optionally expose these endpoints as MCP tools so your LLM can call them natively (there’s a community MCP server for Browserbase you can study/adapt). ([GitHub][9])
* **Uploads:** Support file inputs using Playwright’s `setInputFiles` (useful for KYC/uploads flows). ([Browserbase Documentation][10])
* **Long-running tasks:** Keep sessions alive across disconnects when orchestrations are multi-step. ([Browserbase Documentation][7])
* **Auth workflows:** Persist login state using **Contexts** so scrape/fill can assume authenticated pages. ([Browserbase Documentation][2])
* **Scraping playbooks:** For list/detail pagination, reuse the same session and throttle appropriately; Browserbase documents scraping best practices. ([Browserbase Documentation][11])

---

## Bottom line

* **You will build** `/api/scrape` and `/api/fill`.
* Browserbase provides the **sessions/connect URL**, **stealth/proxies**, **contexts**, and **session replay** you’ll rely on for reliability and debugging. ([Browserbase Documentation][1])

If you want, I can deliver a starter repo (Express or FastAPI) that includes both endpoints, JSON schemas, and Playwright wiring to Browserbase.

[1]: https://docs.browserbase.com/reference/api/create-a-session?utm_source=chatgpt.com "Create a Session"
[2]: https://docs.browserbase.com/features/contexts?utm_source=chatgpt.com "Contexts"
[3]: https://docs.browserbase.com/features/stealth-mode?utm_source=chatgpt.com "Stealth Mode"
[4]: https://docs.browserbase.com/features/session-replay?utm_source=chatgpt.com "Session Replay"
[5]: https://docs.browserbase.com/reference/api/overview?utm_source=chatgpt.com "Overview - Browserbase Documentation"
[6]: https://docs.browserbase.com/reference/sdk/nodejs?utm_source=chatgpt.com "Node.js SDK - Browserbase Documentation"
[7]: https://docs.browserbase.com/guides/long-running-sessions?utm_source=chatgpt.com "Long Running Sessions"
[8]: https://docs.browserbase.com/features/session-inspector?utm_source=chatgpt.com "Session Inspector"
[9]: https://github.com/browserbase/mcp-server-browserbase?utm_source=chatgpt.com "browserbase/mcp-server-browserbase: Allow LLMs to ..."
[10]: https://docs.browserbase.com/features/uploads?utm_source=chatgpt.com "Uploads"
[11]: https://docs.browserbase.com/use-cases/scraping-website?utm_source=chatgpt.com "Web Scraping"

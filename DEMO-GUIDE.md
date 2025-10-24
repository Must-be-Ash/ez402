# Browserbase Form Automation Demo Guide

This guide walks through demonstrating the Browserbase form automation capabilities using the upload/delete scripts.

## Demo Flow

### Part 1: Show "Before" State (No Form Tools)

**1. Delete Browserbase endpoints** to show the initial state without form automation:

```bash
pnpm tsx scripts/demo-delete-browserbase.ts
```

**Expected Output**:
```
🗑️  DEMO: Deleting Browserbase Form Automation Endpoints
============================================================

🔌 Connecting to MongoDB...
✅ Connected to MongoDB

🔍 Searching for Browserbase endpoints...
   Form Scraper ID: scrape_form_structure_from_any_website
   Form Filler ID: fill_and_submit_forms_on_any_website

🗑️  Deleting Form Scraper endpoint...
   ✅ Form Scraper deleted
🗑️  Deleting Form Filler endpoint...
   ✅ Form Filler deleted

🔄 Updating MCP configuration...
✅ MCP config updated
   Total registered tools: X

============================================================
🎉 SUCCESS! Deleted 2 Browserbase endpoint(s)

📍 The following endpoints are now removed:
   ✗ GET  /api/x402/scrape_form_structure_from_any_website
   ✗ POST /api/x402/fill_and_submit_forms_on_any_website

💡 These tools are NO LONGER available in your /chat page!
   Your LLM can no longer scrape or fill forms.
============================================================
```

**2. Navigate to `/chat` page** and show that:
- Form scraping tool is NOT available
- Form filling tool is NOT available
- LLM cannot scrape or fill forms

**3. Try asking the LLM**: "Can you scrape the form at https://example.com?"
- LLM should respond that it doesn't have the capability to scrape forms

---

### Part 2: Show "After" State (With Form Tools)

**4. Upload Browserbase endpoints** to add form automation tools:

```bash
pnpm tsx scripts/demo-upload-browserbase.ts
```

**Expected Output**:
```
🚀 DEMO: Uploading Browserbase Form Automation Endpoints
============================================================

🔌 Connecting to MongoDB...
✅ Connected to MongoDB

📝 Registering Endpoint 1: Form Scraper
   Provider ID: scrape_form_structure_from_any_website
   ✅ Form Scraper registered

📝 Registering Endpoint 2: Form Filler
   Provider ID: fill_and_submit_forms_on_any_website
   ✅ Form Filler registered

🔄 Updating MCP configuration...
✅ MCP config updated
   Total registered tools: X

============================================================
🎉 SUCCESS! Browserbase endpoints are now live!

📍 Your endpoints are accessible at:
   • GET  /api/x402/scrape_form_structure_from_any_website
   • POST /api/x402/fill_and_submit_forms_on_any_website

💡 These tools are now available in your /chat page!
   You can now ask your LLM to:
   - "Scrape the form at https://example.com"
   - "Fill and submit the form at https://example.com"
============================================================
```

**5. Refresh the `/chat` page** (hard refresh: Cmd+Shift+R or Ctrl+Shift+R)

**6. Verify tools are now available**:
- Check that form scraping tool appears in available tools
- Check that form filling tool appears in available tools

**7. Demonstrate form scraping**:
```
You: "Scrape the form at https://your-form-demo-site.vercel.app"
```
- LLM should use the `scrape_form_structure_from_any_website` tool
- Show the extracted form structure (fields, types, options)

**8. Demonstrate form filling**:
```
You: "Fill and submit the form at https://your-form-demo-site.vercel.app with appropriate test data"
```
- LLM should:
  1. First scrape the form to understand its structure
  2. Then fill the form with appropriate values
  3. Submit the form
  4. Return the confirmation URL

**9. Show the submitted form**:
- Visit the confirmation URL returned by the LLM
- Show the completed form data

---

## Demo Script (What to Say)

### Part 1: Before
> "Right now, our LLM in the /chat page doesn't have the ability to interact with web forms. Let me demonstrate this by first removing any form automation tools..."
>
> [Run delete script]
>
> "As you can see, the form scraping and filling endpoints have been removed. If I go to the /chat page and ask the LLM to scrape a form, it won't have the capability to do so."
>
> [Show /chat page, try asking LLM to scrape a form]
>
> "The LLM correctly responds that it doesn't have the tools to scrape or fill forms."

### Part 2: After
> "Now, let's add the Browserbase form automation capabilities by registering two new endpoints as MCP tools..."
>
> [Run upload script]
>
> "We've just registered two new endpoints:
> 1. A form scraper that can extract form structure from any website
> 2. A form filler that can intelligently fill and submit forms
>
> These endpoints use Browserbase - a cloud browser automation platform - combined with Stagehand, which uses AI to understand and interact with forms using natural language.
>
> Now if I refresh the /chat page and ask the LLM to scrape a form..."
>
> [Refresh /chat, ask LLM to scrape form]
>
> "The LLM now uses the form scraping tool and successfully extracts the form structure. It can see all the fields, their types, and available options."
>
> "Now let's ask it to actually fill and submit the form..."
>
> [Ask LLM to fill the form]
>
> "The LLM intelligently:
> 1. First scraped the form to understand its structure
> 2. Mapped appropriate values to each field
> 3. Filled the form with those values
> 4. Submitted it
> 5. And gave us back a unique confirmation URL
>
> If we visit that URL..."
>
> [Visit confirmation URL]
>
> "We can see the completed form data. This demonstrates how we can monetize browser automation capabilities through the x402 protocol - turning complex Browserbase operations into simple, pay-per-use API endpoints that any LLM can consume."

---

## Quick Reference

### Delete endpoints (show "before" state):
```bash
pnpm tsx scripts/demo-delete-browserbase.ts
```

### Upload endpoints (show "after" state):
```bash
pnpm tsx scripts/demo-upload-browserbase.ts
```

### Check current endpoints:
```bash
pnpm tsx scripts/fetch-browserbase-endpoints.ts
```
(This generates `browserbase-endpoints-config.md` with current configuration)

---

## Troubleshooting

### Tools not appearing in /chat after upload
- **Solution**: Hard refresh the page (Cmd+Shift+R or Ctrl+Shift+R)
- The MCP tools are loaded when the page loads, so a refresh is needed

### Delete script says "not found"
- **Solution**: This is normal if endpoints were already deleted
- You can safely run the upload script to add them

### Upload script says "already exists"
- **Solution**: The script will automatically re-register the endpoints
- This is safe to do and won't cause duplicates

---

## Demo URLs

**Form Demo Site**: TBD (deploy form-demo-site first)

**Local Development**:
- Main app: http://localhost:3000
- Chat page: http://localhost:3000/chat
- Register page: http://localhost:3000/register

**x402 Endpoints**:
- Form Scraper: http://localhost:3000/api/x402/scrape_form_structure_from_any_website
- Form Filler: http://localhost:3000/api/x402/fill_and_submit_forms_on_any_website

**Original Endpoints** (not x402 wrapped):
- Form Scraper: http://localhost:3000/api/browserbase/scrape-form?url=YOUR_URL
- Form Filler: http://localhost:3000/api/browserbase/fill-form

# Browserbase Endpoints Registration Guide

This guide contains all the information you need to register your two Browserbase-powered form automation endpoints.

Navigate to: `http://localhost:3000/register`

---

## Endpoint 1: Form Scraper

### Basic Information
- **Description**: `Scrape form structure from any website`
- **Original Endpoint**: `http://localhost:3000/api/browserbase/scrape-form`
- **HTTP Method**: `GET`
- **Price (USD)**: `0.01`
- **Wallet Address**: `0xAbF01df9428EaD5418473A7c91244826A3Af23b3`
- **Max Timeout (seconds)**: `120`

### Authentication
- **Auth Method**: `none`
- **API Key**: *(leave empty)*

### Testing Information

**cURL Example**:
```bash
curl "http://localhost:3000/api/browserbase/scrape-form?url=https://www.roboform.com/filling-test-all-fields"
```

**Expected Response**:
```json
{
  "url": "https://www.roboform.com/filling-test-all-fields",
  "formStructure": {
    "formTitle": "Form Filler: Test Form - All Fields",
    "fields": [
      {
        "label": "First Name",
        "type": "text",
        "required": false
      }
    ]
  },
  "timestamp": "2025-10-23T03:00:00.000Z"
}
```

### x402 Metadata (Optional)
- **MIME Type**: `application/json`
- **Output Schema**: *(leave empty or use auto-generated)*

---

## Endpoint 2: Form Filler

### Basic Information
- **Description**: `Fill and submit forms on any website`
- **Original Endpoint**: `http://localhost:3000/api/browserbase/fill-form`
- **HTTP Method**: `POST`
- **Price (USD)**: `0.05`
- **Wallet Address**: `0xAbF01df9428EaD5418473A7c91244826A3Af23b3`
- **Max Timeout (seconds)**: `120`

### Authentication
- **Auth Method**: `none`
- **API Key**: *(leave empty)*

### Testing Information

**cURL Example**:
```bash
curl -X POST http://localhost:3000/api/browserbase/fill-form \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.roboform.com/filling-test-all-fields","formData":{"First Name":"John","Last Name":"Doe","E-mail":"test@example.com"},"submitForm":false}'
```

**Expected Response**:
```json
{
  "success": true,
  "url": "https://www.roboform.com/filling-test-all-fields",
  "filledFields": ["First Name", "Last Name", "E-mail"],
  "submitted": false,
  "submissionResult": {
    "status": "success",
    "message": "Form filled but not submitted"
  },
  "timestamp": "2025-10-23T03:05:31.448Z"
}
```

### x402 Metadata (Optional)
- **MIME Type**: `application/json`
- **Output Schema**: *(leave empty or use auto-generated)*

---
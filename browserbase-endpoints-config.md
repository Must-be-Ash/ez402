# Browserbase Endpoints Configuration

This document contains the exact MongoDB configuration for the Browserbase form automation endpoints.

**Generated**: 2025-10-23T21:36:07.582Z

---

## Form Scraper Endpoint

```json
{
  "_id": "68f9c4abfd0cb690cf19a48d",
  "providerId": "scrape_form_structure_from_any_website",
  "originalEndpoint": "http://localhost:3000/api/browserbase/scrape-form?url=PLACEHOLDER",
  "httpMethod": "GET",
  "price": 0.01,
  "walletAddress": "0xabf01df9428ead5418473a7c91244826a3af23b3",
  "authMethod": "none",
  "queryParamName": "key",
  "curlExample": "curl \"http://localhost:3000/api/browserbase/scrape-form?url=https://example.com\"",
  "expectedResponse": {
    "url": "https://example.com",
    "formStructure": {
      "fields": []
    },
    "timestamp": "2025-01-01T00:00:00.000Z"
  },
  "description": "Scrape form structure from any website",
  "mimeType": "application/json",
  "maxTimeoutSeconds": 120,
  "isActive": true,
  "totalRequests": 0,
  "totalRevenue": 0,
  "createdAt": "2025-10-23T06:01:15.434Z",
  "updatedAt": "2025-10-23T06:01:15.434Z",
  "__v": 0
}
```

**Summary**:
- **Provider ID**: `scrape_form_structure_from_any_website`
- **Description**: Scrape form structure from any website
- **Endpoint**: `http://localhost:3000/api/browserbase/scrape-form?url=PLACEHOLDER`
- **Method**: GET
- **Price**: $0.01
- **Wallet**: 0xabf01df9428ead5418473a7c91244826a3af23b3
- **Auth Method**: none
- **Active**: true
- **Max Timeout**: 120s

## Form Filler Endpoint

```json
{
  "_id": "68f9c4abfd0cb690cf19a494",
  "providerId": "fill_and_submit_forms_on_any_website",
  "originalEndpoint": "http://localhost:3000/api/browserbase/fill-form",
  "httpMethod": "POST",
  "requestBody": {
    "url": "https://example.com",
    "formData": {
      "field": "value"
    },
    "submitForm": true,
    "autoScrape": true
  },
  "price": 0.05,
  "walletAddress": "0xabf01df9428ead5418473a7c91244826a3af23b3",
  "authMethod": "none",
  "queryParamName": "key",
  "curlExample": "curl -X POST http://localhost:3000/api/browserbase/fill-form -H \"Content-Type: application/json\" -d '{\"url\":\"https://example.com\",\"formData\":{}}'",
  "expectedResponse": {
    "success": true,
    "filledFields": [],
    "submitted": false
  },
  "description": "Fill and submit forms on any website",
  "mimeType": "application/json",
  "maxTimeoutSeconds": 120,
  "isActive": true,
  "totalRequests": 0,
  "totalRevenue": 0,
  "createdAt": "2025-10-23T06:01:15.499Z",
  "updatedAt": "2025-10-23T06:01:15.499Z",
  "__v": 0
}
```

**Summary**:
- **Provider ID**: `fill_and_submit_forms_on_any_website`
- **Description**: Fill and submit forms on any website
- **Endpoint**: `http://localhost:3000/api/browserbase/fill-form`
- **Method**: POST
- **Price**: $0.05
- **Wallet**: 0xabf01df9428ead5418473a7c91244826a3af23b3
- **Auth Method**: none
- **Active**: true
- **Max Timeout**: 120s

---

## Accessible URLs

**Form Scraper**: `http://localhost:3000/api/x402/scrape_form_structure_from_any_website`

**Form Filler**: `http://localhost:3000/api/x402/fill_and_submit_forms_on_any_website`


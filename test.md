# Test Data for x402 Wrapper Registration Form

Use this data to test the registration form at http://localhost:3000/register

## Basic Information

### Service Description
```
Anthropic Claude API - generates AI responses using Claude models
```

### Your API Endpoint
```
https://api.anthropic.com/v1/messages
```

### HTTP Method
```
POST
```

### Request Body (JSON)
```json
{"model":"claude-sonnet-4-20250514","max_tokens":4000,"messages":[{"role":"user","content":"Hello"}]}
```

### Price per Request (USDC)
```
0.01
```

### Receiving Wallet Address
```
0xAbF01df9428EaD5418473A7c91244826A3Af23b3
```

---

## Authentication

### Authentication Method
```
header
```

### Authentication Header Name
```
x-api-key
```

### API Key
```
sk-ant-api03-...REDACTED...
```

---

## Request/Response Specification

### Example cURL Command
```
curl https://api.anthropic.com/v1/messages -H "x-api-key: YOUR_KEY" -H "anthropic-version: 2023-06-01" -H "content-type: application/json" -d '{"model":"claude-sonnet-4-20250514","max_tokens":4000,"messages":[{"role":"user","content":"Hello"}]}'
```

### Expected JSON Response
```json
{"id":"msg_01XFDUDYJgAACzvnptvVoYEL","type":"message","role":"assistant","content":[{"type":"text","text":"Hello! How can I help you today?"}],"model":"claude-sonnet-4-20250514","stop_reason":"end_turn","usage":{"input_tokens":10,"output_tokens":13}}
```

---

## x402 Metadata

### Response MIME Type
```
application/json
```

### Output Schema (Optional)
```json
{"type":"object","properties":{"id":{"type":"string"},"type":{"type":"string"},"role":{"type":"string"},"content":{"type":"array"},"model":{"type":"string"},"stop_reason":{"type":"string"},"usage":{"type":"object"}}}
```

### Maximum Timeout (seconds)
```
60
```

---

## Quick Copy-Paste Format

For easy copy-pasting into the form:

| Field | Value |
|-------|-------|
| Service Description | `Anthropic Claude API - generates AI responses using Claude models` |
| Your API Endpoint | `https://api.anthropic.com/v1/messages` |
| HTTP Method | `POST` |
| Request Body | `{"model":"claude-sonnet-4-20250514","max_tokens":4000,"messages":[{"role":"user","content":"Hello"}]}` |
| Price per Request | `0.01` |
| Receiving Wallet Address | `0xAbF01df9428EaD5418473A7c91244826A3Af23b3` |
| Authentication Method | `header` |
| Authentication Header Name | `x-api-key` |
| API Key | `sk-ant-api03-...REDACTED...` |
| Maximum Timeout | `60` |

---

## Notes

- ✅ All required fields are included
- ✅ Using your Anthropic API key from prompt-panda project
- ✅ Using your wallet address from prompt-panda .env
- ✅ API key will be encrypted with AES-256-GCM before storage
- ⚠️ Remember to click "Test Endpoint" button before registering
- 📝 The form requires a successful test before allowing registration

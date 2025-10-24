# Form Demo Site - Technical Specification

## Project Overview

**Purpose**: Standalone Next.js form site for demonstrating Browserbase form automation capabilities. LLMs will fill the form via our x402 endpoints, and users can view completed submissions via unique URLs.

**Key Features**:
- Single form page with LLM-friendly questions
- Unique confirmation URLs for each submission
- Dynamic slug pages to view all submitted forms
- MongoDB storage for form submissions
- No authentication required

**Tech Stack**:
- Next.js 15.x (App Router)
- MongoDB + Mongoose
- TypeScript
- Tailwind CSS
- Deployed separately from ez402 repo

---

## Database Schema

**IMPORTANT**: This project uses a **NEW MongoDB database called `forms`** to avoid conflicts with the existing ez402 `test` database (which contains `test.endpoints` and `test.mcp_configs` collections).

**MongoDB Connection String Format**:
```
mongodb+srv://username:password@cluster.mongodb.net/forms?retryWrites=true&w=majority
```
Note the `/forms` database name in the connection string.

### Collection: `submissions`

Full path: `forms.submissions`

```typescript
{
  _id: ObjectId,
  submissionId: string,          // Unique slug (e.g., "abc123xyz")
  submittedAt: Date,
  formData: {
    name: string,
    email: string,
    favoriteColor: string,        // Radio: Red, Blue, Green, Yellow
    interests: string[],           // Checkbox: Technology, Music, Sports, Art, Travel
    experienceLevel: string,       // Select: Beginner, Intermediate, Advanced, Expert
    feedback: string,              // Textarea
    newsletter: boolean,           // Checkbox: Subscribe to newsletter
  },
  ipAddress?: string,              // Optional: Track submission source
}
```

---

## Implementation Checklist

### Phase 1: Project Setup
- [ ] Create new Next.js project with TypeScript and Tailwind CSS
  ```bash
  npx create-next-app@latest form-demo-site --typescript --tailwind --app
  ```
- [ ] Install dependencies
  ```bash
  pnpm add mongoose nanoid zod
  pnpm add -D @types/node
  ```
- [ ] Set up `.env.local` with MongoDB URI
  ```
  MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/forms?retryWrites=true&w=majority
  NEXT_PUBLIC_BASE_URL=http://localhost:3000
  ```
  **IMPORTANT**: The connection string MUST include `/forms` as the database name to avoid conflicts with the existing `test` database
- [ ] Create `.gitignore` entry for `.env.local`
- [ ] Initialize git repository

### Phase 2: Database Setup
- [ ] Create `/lib/db/connection.ts` - MongoDB connection helper with caching
  - Ensure connection uses the `forms` database (from MONGODB_URI)
- [ ] Create `/lib/db/models/form-submission.ts` - Mongoose schema with:
  - Collection name: `submissions` (will create `forms.submissions` in MongoDB)
  - `submissionId` (unique, indexed)
  - `submittedAt` (indexed for sorting)
  - `formData` object with all form fields
- [ ] Create `/lib/utils/generate-id.ts` - Generate unique submission IDs using `nanoid(10)`

### Phase 3: Form Page (/)
- [ ] Create `/app/page.tsx` - Main form page
- [ ] Design form with clear labels for LLM understanding:
  - Text input: "Your Full Name"
  - Email input: "Your Email Address"
  - Radio group: "What is your favorite color?" (Red, Blue, Green, Yellow)
  - Checkbox group: "Select your interests" (Technology, Music, Sports, Art, Travel)
  - Select dropdown: "What is your experience level?" (Beginner, Intermediate, Advanced, Expert)
  - Textarea: "Tell us about yourself or provide feedback"
  - Single checkbox: "Subscribe to our newsletter"
- [ ] Add Tailwind styling:
  - Clean, centered form layout (max-w-2xl)
  - Clear field labels with proper spacing
  - Styled input fields, radio buttons, checkboxes
  - Primary action button for submit
- [ ] Add client-side form validation:
  - Required: name, email, favoriteColor, experienceLevel
  - Email format validation
  - At least one interest must be selected
- [ ] Implement form submission handler:
  - Prevent default form submission
  - Show loading state during submission
  - Redirect to confirmation page on success
  - Display error toast/message on failure

### Phase 4: Form Submission API
- [ ] Create `/app/api/submit/route.ts` - POST endpoint for form submission
- [ ] Implement Zod validation schema for form data
  ```typescript
  const FormDataSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    favoriteColor: z.enum(['Red', 'Blue', 'Green', 'Yellow']),
    interests: z.array(z.string()).min(1),
    experienceLevel: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
    feedback: z.string(),
    newsletter: z.boolean(),
  });
  ```
- [ ] Generate unique `submissionId` using nanoid
- [ ] Save submission to MongoDB with timestamp
- [ ] Return JSON response with submissionId
  ```json
  {
    "success": true,
    "submissionId": "abc123xyz",
    "confirmationUrl": "http://localhost:3000/submission/abc123xyz"
  }
  ```
- [ ] Add error handling for duplicate IDs (retry with new ID)
- [ ] Add error handling for database connection failures

### Phase 5: Confirmation Page (/submission/[id])
- [ ] Create `/app/submission/[id]/page.tsx` - Dynamic route for viewing submissions
- [ ] Fetch submission data from MongoDB by `submissionId`
- [ ] Return 404 page if submission not found
- [ ] Display success message at top:
  - "Thank you! Your form has been successfully submitted."
  - Submission timestamp
  - Unique submission ID
- [ ] Display all submitted form data in a clean, readable format:
  - Use definition list (`<dl>`) or card layout
  - Format arrays (interests) as comma-separated or bullet list
  - Format boolean (newsletter) as "Yes" or "No"
  - Display feedback in a larger text area/box
- [ ] Add Tailwind styling:
  - Centered layout (max-w-3xl)
  - Card/section for each field group
  - Distinct styling for labels vs values
  - Success badge/indicator at top
- [ ] Add "Submit Another Form" button linking back to `/`
- [ ] Add social share buttons (optional):
  - Copy link to clipboard button
  - Share on Twitter/LinkedIn (optional)

### Phase 6: Recent Submissions Page (/submissions)
- [ ] Create `/app/submissions/page.tsx` - List all recent submissions
- [ ] Fetch last 50 submissions from MongoDB, sorted by `submittedAt` desc
- [ ] Display as a table or card grid:
  - Submission ID (linked to detail page)
  - Name
  - Email
  - Submitted timestamp (relative time, e.g., "2 hours ago")
- [ ] Add pagination if more than 50 submissions
- [ ] Add Tailwind styling:
  - Responsive table or grid layout
  - Hover effects on rows/cards
  - Link styling for submission IDs
- [ ] Add search/filter functionality (optional):
  - Filter by date range
  - Search by name or email

### Phase 7: Error Handling & Edge Cases
- [ ] Create custom 404 page (`/app/not-found.tsx`)
- [ ] Create custom error page (`/app/error.tsx`)
- [ ] Add loading states for all async operations
- [ ] Implement rate limiting on `/api/submit` (optional but recommended):
  - Max 10 submissions per IP per hour
  - Return 429 status if exceeded
- [ ] Add input sanitization to prevent XSS
- [ ] Test with malformed data submissions
- [ ] Test MongoDB connection failures

### Phase 8: UI/UX Polish
- [ ] Add page titles and meta tags for SEO
  - Form page: "Demo Form - Fill with AI"
  - Confirmation: "Submission Confirmed - [ID]"
  - Submissions list: "Recent Submissions"
- [ ] Add favicon
- [ ] Add loading spinners/skeletons for async data
- [ ] Add smooth transitions/animations (optional)
- [ ] Make form mobile-responsive
- [ ] Test on mobile devices
- [ ] Add form field focus states and keyboard navigation
- [ ] Add aria-labels for accessibility

### Phase 9: Integration Testing
- [ ] Test manual form submission via browser
- [ ] Create test script to submit form programmatically
- [ ] Test Browserbase form scraping on form page:
  - Verify all fields are detected correctly
  - Verify field types are identified (radio, checkbox, select, text)
  - Verify options are extracted for multi-choice fields
- [ ] Test Browserbase form filling:
  - Submit form with all required fields
  - Verify submission redirects to confirmation page
  - Verify data is saved correctly in MongoDB
  - Verify confirmation page displays correct data
- [ ] Test edge cases:
  - Empty interests array (should fail validation)
  - Invalid email format (should fail validation)
  - Missing required fields (should fail validation)
  - Duplicate submission IDs (should retry)

### Phase 10: Deployment
- [ ] Set up production MongoDB database (MongoDB Atlas)
  - Create new database called `forms` (separate from existing `test` database)
  - Update MONGODB_URI connection string to include `/forms` database name
- [ ] Deploy to Vercel:
  - Connect GitHub repository
  - Add environment variables (`MONGODB_URI` with `/forms` database, `NEXT_PUBLIC_BASE_URL`)
  - Configure custom domain (optional)
- [ ] Test production deployment:
  - Submit form manually
  - Verify confirmation URLs use production domain
  - Test all pages (form, confirmation, submissions list)
- [ ] Update ez402 test scripts with production URL
- [ ] Add production URL to ez402 documentation

### Phase 11: Documentation
- [ ] Create README.md with:
  - Project description
  - Setup instructions
  - Environment variables
  - API endpoints documentation
  - Form field specifications
- [ ] Document form field names and types for ez402 integration:
  ```
  Fields:
  - "Your Full Name" (text, required)
  - "Your Email Address" (email, required)
  - "What is your favorite color?" (radio, required)
    Options: Red, Blue, Green, Yellow
  - "Select your interests" (checkbox, min 1 required)
    Options: Technology, Music, Sports, Art, Travel
  - "What is your experience level?" (select, required)
    Options: Beginner, Intermediate, Advanced, Expert
  - "Tell us about yourself or provide feedback" (textarea, optional)
  - "Subscribe to our newsletter" (checkbox, optional)
  ```
- [ ] Add example cURL request for API submission
- [ ] Add example response payloads

---

## File Structure

```
form-demo-site/
├── app/
│   ├── page.tsx                      # Form page
│   ├── layout.tsx                    # Root layout
│   ├── globals.css                   # Tailwind styles
│   ├── api/
│   │   └── submit/
│   │       └── route.ts              # Form submission endpoint
│   ├── submission/
│   │   └── [id]/
│   │       └── page.tsx              # Individual submission view
│   ├── submissions/
│   │   └── page.tsx                  # All submissions list
│   ├── not-found.tsx                 # 404 page
│   └── error.tsx                     # Error page
├── lib/
│   ├── db/
│   │   ├── connection.ts             # MongoDB connection
│   │   └── models/
│   │       └── form-submission.ts    # Mongoose model
│   └── utils/
│       └── generate-id.ts            # Submission ID generator
├── .env.local                        # Environment variables
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── README.md
```

---

## API Endpoints

### POST /api/submit

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "favoriteColor": "Blue",
  "interests": ["Technology", "Music"],
  "experienceLevel": "Intermediate",
  "feedback": "This is a great form!",
  "newsletter": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "submissionId": "abc123xyz",
  "confirmationUrl": "https://form-demo.vercel.app/submission/abc123xyz"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Invalid form data",
  "details": [
    "Email is required",
    "At least one interest must be selected"
  ]
}
```

---

## Next Steps After Completion

1. Update ez402 Browserbase test scripts to use new form URL
2. Register new form URL in ez402 test suite
3. Create demo video showing:
   - Manual form submission
   - LLM-powered form filling via ez402
   - Viewing confirmation page
4. Add form URL to ez402 documentation as demo example

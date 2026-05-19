# AI Maturity Self-Assessment — Design Spec

**Date:** 2026-03-28
**Project:** CLO Exchange Conference AI Enablement Self-Assessment

---

## Overview

A public-facing web application that allows L&D leaders to complete a short AI maturity self-assessment. The tool is designed for use both live at a conference (via QR code) and post-session as a shared link. Responses are stored in Google Sheets. Results are shown immediately with a benchmark comparison against all respondents including the current submission.

---

## Architecture

**Stack:** Next.js (App Router) deployed to Vercel
**Data store:** Google Sheets (via Google Sheets API, service account credentials)
**API layer:** Two Vercel serverless functions (Next.js API routes)
**Hosting:** Vercel (free tier sufficient for ~100 responses)

### Startup Guard

Implement as a per-request check at the top of each handler (not a module-level singleton). If either `GOOGLE_SERVICE_ACCOUNT_JSON` or `GOOGLE_SHEET_ID` is missing, or if `GOOGLE_SERVICE_ACCOUNT_JSON` fails to parse as JSON, return HTTP 500 with `{ "error": "Server misconfiguration" }` and log the cause server-side.

### Sheet Tab Name

The Google Sheet must have a tab named exactly **`Sheet1`**. This name must not be changed. All API range strings use this tab name (e.g., `Sheet1!A:A`). If a configurable tab name is needed in future, it can be added as a `GOOGLE_SHEET_TAB` environment variable — for now, `Sheet1` is hardcoded.

### API Routes

---

**`POST /api/submit`**

**Request payload:**
```json
{
  "company_name": "Acme Corp",
  "title": "Chief Learning Officer",
  "company_size": "51–200",
  "q1": 2,
  "q2": 3,
  "q3": 1,
  "q4": 2,
  "q5": 2
}
```

> Note: The range separators in `company_size` values use the en-dash character (U+2013: –), not a hyphen-minus (U+002D: -). Copy these exact strings from this spec into code rather than typing them.

**Behavior (in order):**
1. Validate the payload (see Validation Rules). On failure: return HTTP 400 `{ "error": "Missing or invalid field: <field_name>" }`.
2. Compute `total_score` (sum of q1–q5) and `maturity_tier` server-side. If the computed score is outside 5–15, return HTTP 500 `{ "error": "Score computation error", "code": "SCORE_OUT_OF_RANGE" }` and log the anomaly server-side. Note: this guard is mathematically unreachable if validation in step 1 succeeded (since each qi ∈ {1,2,3} constrains the sum to 5–15). Keep it as a defensive canary — it will catch future refactors that accidentally break the scoring contract, even though it cannot fire under normal conditions.
3. Append a row to Google Sheets using the `append` API with range `Sheet1!A:K`, `valueInputOption: "RAW"`, and `insertDataOption: "INSERT_ROWS"`. Append values in the column order A–K as defined in the Data Model section. If this fails: return HTTP 500 `{ "error": "Failed to save response", "code": "SHEET_WRITE_ERROR" }`. The `append` API call is attempted once — no internal retry. In the event of a network partition between Vercel and Google, a phantom write is theoretically possible and undetectable; this risk is accepted given the low-stakes context. The "retry is safe" claim holds for all normally observable failure modes.
4. Read range `Sheet1!K2:K` to get all `maturity_tier` values from data rows (row 2 onward; skips the header). Filter out empty cells. Unrecognized `maturity_tier` values (not one of `earlyStage`, `developing`, `advanced`) are silently ignored with a server-side log warning. If zero recognized values remain after filtering (e.g., on the very first submission before any prior data), return `{ "earlyStage": 0, "developing": 0, "advanced": 0 }` as the benchmark — do not attempt percentage calculation. Compute the benchmark distribution for all other cases. If this read fails: return HTTP 200 with `benchmark: null`. The row is already written — returning 500 here would prompt a retry that could write a duplicate row.

**Success response (HTTP 200):**
```json
{
  "score": 11,
  "tier": "developing",
  "benchmark": {
    "earlyStage": 22.2,
    "developing": 55.6,
    "advanced": 22.2
  }
}
```

**Partial success — benchmark read failed (HTTP 200):**
```json
{
  "score": 11,
  "tier": "developing",
  "benchmark": null
}
```

**Tier keys (`earlyStage`, `developing`, `advanced`) are stable internal identifiers. They never change even if display names are updated. Display names live in the frontend config only.**

---

**`GET /api/benchmark`** *(available for future use; not called by the main flow)*

Reads range `Sheet1!K2:K`, filters empty cells, ignores unrecognized values (same rules as `POST /api/submit` step 4), and returns aggregate tier distribution.

**Success response (HTTP 200):**
```json
{
  "earlyStage": 22.2,
  "developing": 55.6,
  "advanced": 22.2
}
```

Values are percentages (floats, same rounding rules as `POST /api/submit`). If the sheet has zero data rows, returns `{ "earlyStage": 0, "developing": 0, "advanced": 0 }`.

**Error (HTTP 500):** `{ "error": "Failed to read benchmark data" }` — fixed string, no `code` field. This endpoint is not called by the main UI.

---

### Validation Rules (for `POST /api/submit`)

All string fields are trimmed of whitespace before validation. A whitespace-only string fails the non-empty check.

Fields are validated in this order: `company_name`, `title`, `company_size`, `q1`, `q2`, `q3`, `q4`, `q5`. The first failure short-circuits validation and returns HTTP 400.

| Field | UI Label | Required | Valid values | Max length |
|---|---|---|---|---|
| company_name | Company Name | yes | Non-empty string (after trim) | 255 chars |
| title | Your Title | yes | Non-empty string (after trim) | 255 chars |
| company_size | Company Size | yes | One of: `"1–50"`, `"51–200"`, `"201–1000"`, `"1000+"` (en-dash, U+2013) | — |
| q1 | Question 1 | yes | Integer 1, 2, or 3 | — |
| q2 | Question 2 | yes | Integer 1, 2, or 3 | — |
| q3 | Question 3 | yes | Integer 1, 2, or 3 | — |
| q4 | Question 4 | yes | Integer 1, 2, or 3 | — |
| q5 | Question 5 | yes | Integer 1, 2, or 3 | — |

UI labels are display-only. API field names and Google Sheets column names use the snake_case/lowercase identifiers in this table.

---

### UI Error Handling

- **`SHEET_WRITE_ERROR` (HTTP 500):** Show inline error — "Something went wrong saving your results. Please try again." — with a retry button. On retry, the client re-sends the original payload from memory without re-navigating.
- **`SCORE_OUT_OF_RANGE` (HTTP 500):** Replace the score/tier display area with a dash (—) to avoid layout shift. Hide the benchmark chart area entirely. Show — "Something went wrong calculating your score." — without a retry button. The client-computed score is not shown because the server has flagged the computation as invalid.
- **Any HTTP 500 without a recognized `code` field** (e.g., uncaught exception, misconfiguration): Treat as `SHEET_WRITE_ERROR` — show the retry button, since the write may or may not have occurred.
- **`benchmark: null` (HTTP 200):** Show score and tier normally. Replace the benchmark chart with "Benchmark data temporarily unavailable." No retry needed — data is safely stored.
- **Score/tier divergence:** The server is authoritative. If the API returns a score or tier that differs from the client-side computation, the UI silently updates to the server's values and logs a warning to the browser console.
- **Request timeout (10 seconds):** If `POST /api/submit` does not respond within 10 seconds, treat as `SHEET_WRITE_ERROR` and show the retry button. Use a single `AbortController` instance per request. Set a `setTimeout` of 10 seconds that calls `abort()`. If the user taps "Start Over" before the timeout fires, cancel the timeout timer, abort the controller, and navigate to Step 1 without showing any error state — "Start Over" always wins regardless of timing. Any response that arrives after abortion is ignored.
- **"Start Over" post-response:** If the API call has already resolved (success or error) and the user taps "Start Over", reset all client state and navigate to Step 1. No `AbortController` interaction needed.

---

### Rate Limiting

No rate limiting is implemented. This is an intentional tradeoff — acceptable given the short-lived conference context (~100 expected responses) and low-value data. The endpoint is public and unauthenticated; this is acknowledged.

---

### Environment Variables

| Variable | Format | Notes |
|---|---|---|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Stringified JSON | Full service account credentials JSON. In Vercel, paste the raw JSON string. Verify it parses cleanly with `JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)` before deploying. |
| `GOOGLE_SHEET_ID` | String | The sheet ID from the Google Sheets URL (the alphanumeric string between `/d/` and `/edit`) |

---

## Infrastructure Prerequisites

Before deploying, the following must be set up manually:

1. Create a Google Sheet. Rename the first tab to exactly `Sheet1` if it is not already named that. In row 1, add the following values in columns A through K respectively:
   `timestamp`, `company_name`, `title`, `company_size`, `q1`, `q2`, `q3`, `q4`, `q5`, `total_score`, `maturity_tier`
2. Create a Google Cloud project with the Google Sheets API enabled, then create a service account within that project.
3. Share the Google Sheet with the service account's email address (Editor access). Google Sheets does not support append-only access natively; Editor is the minimum required permission. This is acceptable for a low-stakes conference tool.
4. Store the service account JSON and sheet ID as Vercel environment variables (see above).

---

## Data Model

**Google Sheets tab: `Sheet1` — columns A through K:**

| Column | Field | Type | Notes |
|---|---|---|---|
| A | timestamp | ISO datetime string | Format: `YYYY-MM-DDTHH:mm:ssZ` (UTC). Server-side on submit. |
| B | company_name | string | Max 255 chars |
| C | title | string | Max 255 chars |
| D | company_size | string | One of: `1–50`, `51–200`, `201–1000`, `1000+` (en-dash) |
| E | q1 | integer (1–3) | |
| F | q2 | integer (1–3) | |
| G | q3 | integer (1–3) | |
| H | q4 | integer (1–3) | |
| I | q5 | integer (1–3) | |
| J | total_score | integer (5–15) | Denormalized — computed from q1–q5. q1–q5 are source of truth. |
| K | maturity_tier | string | Denormalized — stored as internal key: `earlyStage`, `developing`, or `advanced`. |

Row 1 is the header row and is never counted as a data row. Data starts at row 2. The sheet is considered empty if it contains only row 1 or is entirely blank.

---

## Scoring Model

- Each of the 5 questions has 3 answer options worth 1, 2, or 3 points respectively
- Total score range: **5–15** (minimum 5 because all questions are required before submission)
- Maturity tiers (non-overlapping):
  - **Early Stage** (internal key: `earlyStage`) — score 5–8
  - **Developing** (internal key: `developing`) — score 9–11
  - **Advanced** (internal key: `advanced`) — score 12–15
- Tier assignment: `score <= 8` → `earlyStage`, `score <= 11` → `developing`, `score >= 12` → `advanced`
- Tier display names, next-step copy, and question/answer content are placeholders pending final copy from the client. They live in a frontend config file and can be updated without touching the API.

**Benchmark percentage rounding:**
- Values are floats rounded to one decimal place
- After rounding, compute `correction = 100 - sum(roundedValues)` and apply it by adding `correction` to the largest bucket's value
- Tiebreaker: if two or more buckets share the largest value, apply the correction to the first in this order: `earlyStage`, `developing`, `advanced`
- After applying the correction, re-apply one-decimal rounding to the corrected bucket using `Math.round(value * 10) / 10` to prevent floating-point precision artifacts (e.g., `22.200000000000003`)
- Serialize all three final values using `.toFixed(1)` before including them in the API response

> Note: Question weighting is uniform in v1. Per-question weighting can be added later via a config object.

---

## User Flow

### Step 1 — Intake Form
- Fields: Company Name (text), Your Title (text), Company Size (dropdown: `1–50`, `51–200`, `201–1000`, `1000+`)
- All fields required; validation runs on submit attempt, not on blur
- Data held in client state — not submitted to the API until Step 3

### Step 2 — Assessment (5 screens)
- One question per screen
- Progress indicator (e.g., "Question 2 of 5")
- 3 radio button options per question
- The "Next" button is disabled until an answer is selected for the current question
- All answers (intake and assessment) are preserved in client state throughout the session
- Back navigation from any question preserves all previously selected answers
- Back navigation from Question 1 returns to the Intake Form with all intake data preserved
- Editing intake fields after returning from the assessment does not invalidate or clear previously selected question answers
- Re-entering the Intake Form does not clear previously entered question answers

### Step 3 — Results Page
After the user selects an answer on Question 5 and taps the final "Submit" button:

1. Score and tier are computed client-side immediately and displayed (perceived performance, non-blocking)
2. `POST /api/submit` is called with a 10-second timeout via `AbortController`
3. While waiting: the benchmark chart area shows a loading state. The "Start Over" button is visible and enabled at all times on the Results page, including during this loading state.
4. On success: benchmark chart renders with the user's tier highlighted
5. On partial success (`benchmark: null`): "Benchmark data temporarily unavailable." is shown instead of the chart
6. On error:
   - `SCORE_OUT_OF_RANGE`: replace score/tier with a dash (—), hide the benchmark chart area entirely, show error message, no retry button
   - All other errors: keep client-computed score/tier displayed, show error message with retry button; benchmark chart area remains in loading state until a successful retry
7. If the server returns a score/tier different from the client's calculation: UI silently updates to server values

**Results page content:**
- Maturity tier display name and total score (e.g., "Developing — 11/15")
- Recommended next steps paragraph (tier-specific, placeholder copy until finalized)
- Benchmark distribution bar chart — % of respondents in each tier (including the current submission), with the user's tier highlighted
- A "Start Over" button (always visible and enabled) that resets all client state and navigates to Step 1 (cancels any in-flight request via `AbortController` if applicable)

---

## QR Code

One-time post-deployment step:

- Script location: `scripts/generate-qr.js`
- Usage: `node scripts/generate-qr.js https://your-deployed-url.vercel.app`
- If no URL argument is provided, the script exits with a non-zero code and prints usage instructions
- Output: `qr-code.png` in the project root (overwritten silently if it already exists)
- `qr-code.png` is added to `.gitignore` — it is not committed to the repo
- This script runs locally only; it does not run on Vercel. The `qrcode` npm package is therefore a devDependency — correct and intentional.
- The engineer's responsibility ends at generating the file. Delivery to the client (slides, print materials) is the client's responsibility.

---

## Out of Scope

- Email capture or results delivery by email
- Admin dashboard or results viewer (Google Sheets serves this purpose)
- Authentication or access control
- Per-question weighting (deferred — uniform weighting in v1)
- Question/answer content (placeholders used in build; client provides final copy)
- Tier display name changes requiring API or sheet schema changes (internal keys are stable; only frontend config needs updating)

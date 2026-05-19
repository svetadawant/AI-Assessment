# AI Maturity Self-Assessment Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public-facing Next.js web app where L&D leaders complete a 5-question AI maturity self-assessment, see their score and tier, and compare themselves to all respondents via a benchmark chart, with responses stored in Google Sheets.

**Architecture:** Next.js App Router deployed to Vercel. Two serverless API routes handle data: `POST /api/submit` validates input, appends to Google Sheets, and returns score + benchmark distribution; `GET /api/benchmark` reads aggregate data. The frontend is a three-step flow (intake → questions → results) managed in a single root page component using React state, with props passed down to each step component.

**Tech Stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, `googleapis` v7+ (Google Sheets API), Jest + @testing-library/react (tests), `qrcode` (devDependency, QR script only)

---

## File Map

```
clo_exchange_ai_assessment/
├── src/
│   ├── app/
│   │   ├── layout.tsx                   # Root layout, metadata
│   │   ├── page.tsx                     # Multi-step flow orchestration + all state
│   │   ├── globals.css
│   │   └── api/
│   │       ├── submit/route.ts          # POST /api/submit
│   │       └── benchmark/route.ts       # GET /api/benchmark
│   ├── components/
│   │   ├── IntakeForm.tsx               # Step 1: company/title/size form
│   │   ├── Assessment.tsx               # Step 2: one question per screen
│   │   ├── BenchmarkChart.tsx           # CSS bar chart (3 tiers)
│   │   └── Results.tsx                  # Step 3: score + next steps + chart
│   └── lib/
│       ├── config.ts                    # Placeholder questions, tier display names, next steps
│       ├── scoring.ts                   # computeScore, assignTier, computeBenchmark
│       ├── sheets.ts                    # appendRow, readTierColumn (googleapis wrapper)
│       ├── types.ts                     # Shared TypeScript types
│       └── validate.ts                  # validatePayload
├── __tests__/
│   ├── lib/
│   │   ├── scoring.test.ts
│   │   ├── validate.test.ts
│   │   └── sheets.test.ts
│   ├── api/
│   │   ├── submit.test.ts
│   │   └── benchmark.test.ts
│   └── components/
│       ├── Assessment.test.tsx
│       └── Results.test.tsx
├── scripts/
│   └── generate-qr.js
├── .env.local.example
├── jest.config.ts
├── jest.setup.ts
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `jest.config.ts`, `jest.setup.ts`, `.env.local.example`

- [ ] **Step 1: Scaffold the Next.js app**

```bash
cd /Users/yannickdawant/Documents/development/clo_exchange_ai_assessment
npx create-next-app@latest . --typescript --tailwind --app --src-dir --yes
```

Expected: Next.js project created with TypeScript, Tailwind CSS, and App Router in src/.

- [ ] **Step 2: Install runtime dependency**

```bash
npm install googleapis
```

Expected: `googleapis` appears in `dependencies` in `package.json`.

- [ ] **Step 3: Install dev dependencies**

```bash
npm install --save-dev jest @testing-library/react @testing-library/user-event jest-environment-jsdom @types/jest ts-jest qrcode @types/qrcode
```

- [ ] **Step 4: Create jest.config.ts**

```typescript
// jest.config.ts
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

export default createJestConfig(config)
```

Note: `setupFilesAfterFramework` is the Next.js jest preset key. If Jest reports an unknown config option, the key for your version may be `setupFilesAfterFrameEnvironment` — check the error message and update accordingly.

- [ ] **Step 5: Create jest.setup.ts**

```typescript
// jest.setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Add jest scripts to package.json**

Open `package.json` and add to the `"scripts"` section:
```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 7: Create .env.local.example**

```
# .env.local.example
# Copy to .env.local and fill in values before running locally

# Full Google service account credentials JSON, stringified (paste raw JSON string)
GOOGLE_SERVICE_ACCOUNT_JSON=

# Sheet ID from Google Sheets URL: https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit
GOOGLE_SHEET_ID=
```

- [ ] **Step 8: Add qr-code.png and .env.local to .gitignore**

Append to the `.gitignore` created by create-next-app:
```
qr-code.png
.env.local
```

- [ ] **Step 9: Verify Jest runs**

```bash
npm test -- --passWithNoTests
```

Expected: `Test Suites: 0 passed, 0 total`

- [ ] **Step 10: Initial commit**

```bash
git init
git add .
git commit -m "chore: scaffold Next.js project with Jest"
```

---

## Task 2: TypeScript Types and Content Config

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/config.ts`

- [ ] **Step 1: Create src/lib/types.ts**

```typescript
// src/lib/types.ts

export type TierKey = 'earlyStage' | 'developing' | 'advanced'

export type Step = 'intake' | 'assessment' | 'results'

export interface IntakeData {
  company_name: string
  title: string
  company_size: string
}

export interface Answers {
  q1: number | null
  q2: number | null
  q3: number | null
  q4: number | null
  q5: number | null
}

// BenchmarkData values are numbers (floats, e.g. 33.3).
// The route handler serializes them with .toFixed(1) before including in the HTTP response.
export interface BenchmarkData {
  earlyStage: number
  developing: number
  advanced: number
}

export interface SubmitResult {
  score: number
  tier: TierKey
  benchmark: BenchmarkData | null
}

export type ApiStatus = 'idle' | 'pending' | 'success' | 'error'

export interface ApiState {
  status: ApiStatus
  result: SubmitResult | null
  errorCode: string | null
}

export interface SubmitPayload {
  company_name: string
  title: string
  company_size: string
  q1: number
  q2: number
  q3: number
  q4: number
  q5: number
}
```

- [ ] **Step 2: Create src/lib/config.ts**

> Note: All question and tier copy below is placeholder. The client will provide final content. Update only this file when content is finalized — no API or schema changes needed.
>
> **Important:** `COMPANY_SIZES` uses the en-dash character U+2013 (`\u2013`), not a hyphen. These values are used by both the frontend dropdown and the validation logic. They must match exactly.

```typescript
// src/lib/config.ts
import type { TierKey } from './types'

export interface QuestionOption {
  label: string
  value: 1 | 2 | 3
}

export interface Question {
  id: 'q1' | 'q2' | 'q3' | 'q4' | 'q5'
  text: string
  options: [QuestionOption, QuestionOption, QuestionOption]
}

export const QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: '[PLACEHOLDER] How would you describe your organization\'s current AI awareness?',
    options: [
      { label: 'We are just beginning to explore what AI means for us', value: 1 },
      { label: 'We have a shared understanding and some pilots underway', value: 2 },
      { label: 'AI is integrated into our L&D strategy with measurable outcomes', value: 3 },
    ],
  },
  {
    id: 'q2',
    text: '[PLACEHOLDER] How does leadership view AI enablement?',
    options: [
      { label: 'It\'s not yet a priority for our leadership team', value: 1 },
      { label: 'There is interest but no formal mandate or budget', value: 2 },
      { label: 'Leadership is actively championing and funding AI initiatives', value: 3 },
    ],
  },
  {
    id: 'q3',
    text: '[PLACEHOLDER] How are your employees currently using AI tools?',
    options: [
      { label: 'Ad hoc, individually, without guidance', value: 1 },
      { label: 'In pockets with some informal sharing', value: 2 },
      { label: 'Consistently, with organizational guidelines and training', value: 3 },
    ],
  },
  {
    id: 'q4',
    text: '[PLACEHOLDER] What does your AI learning curriculum look like today?',
    options: [
      { label: 'We don\'t have one yet', value: 1 },
      { label: 'We\'ve pulled together some resources but nothing formal', value: 2 },
      { label: 'We have a structured, role-based program with clear outcomes', value: 3 },
    ],
  },
  {
    id: 'q5',
    text: '[PLACEHOLDER] How do you measure the impact of AI enablement efforts?',
    options: [
      { label: 'We are not measuring yet', value: 1 },
      { label: 'We track completion but not behavioral or business outcomes', value: 2 },
      { label: 'We measure behavioral change and connect it to business impact', value: 3 },
    ],
  },
]

export interface TierConfig {
  displayName: string
  nextSteps: string
}

export const TIER_CONFIG: Record<TierKey, TierConfig> = {
  earlyStage: {
    displayName: 'Early Stage',
    nextSteps:
      '[PLACEHOLDER] Your organization is at the beginning of its AI journey. Focus on building awareness and a shared vocabulary around AI. Start with executive alignment, identify a small group of internal champions, and run a few low-risk pilots to build confidence and momentum.',
  },
  developing: {
    displayName: 'Developing',
    nextSteps:
      '[PLACEHOLDER] You have foundations in place but need to scale what\'s working. Prioritize formalizing your AI learning curriculum, establishing governance guardrails, and connecting enablement efforts to measurable business outcomes. Now is the time to move from pilots to programs.',
  },
  advanced: {
    displayName: 'Advanced',
    nextSteps:
      '[PLACEHOLDER] Your organization is ahead of the curve. Focus on sustaining momentum, measuring ROI rigorously, and evolving your curriculum as AI capabilities change. Consider how you can share what\'s working internally and become a model for AI-enabled performance.',
  },
}

// en-dash U+2013 separators — these must match the validation allowlist in validate.ts exactly
export const COMPANY_SIZES = [
  '1\u201350',
  '51\u2013200',
  '201\u20131000',
  '1000+',
] as const
export type CompanySize = typeof COMPANY_SIZES[number]
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts src/lib/config.ts
git commit -m "feat: add TypeScript types and placeholder content config"
```

---

## Task 3: Scoring Library (TDD)

**Files:**
- Create: `__tests__/lib/scoring.test.ts`
- Create: `src/lib/scoring.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/lib/scoring.test.ts
import { computeScore, assignTier, computeBenchmark } from '@/lib/scoring'
import type { TierKey } from '@/lib/types'

describe('computeScore', () => {
  it('sums all five question values', () => {
    expect(computeScore({ q1: 1, q2: 2, q3: 3, q4: 2, q5: 1 })).toBe(9)
  })

  it('returns minimum score of 5 when all answers are 1', () => {
    expect(computeScore({ q1: 1, q2: 1, q3: 1, q4: 1, q5: 1 })).toBe(5)
  })

  it('returns maximum score of 15 when all answers are 3', () => {
    expect(computeScore({ q1: 3, q2: 3, q3: 3, q4: 3, q5: 3 })).toBe(15)
  })
})

describe('assignTier', () => {
  it('returns earlyStage for scores 5–8', () => {
    expect(assignTier(5)).toBe('earlyStage')
    expect(assignTier(8)).toBe('earlyStage')
  })

  it('returns developing for scores 9–11', () => {
    expect(assignTier(9)).toBe('developing')
    expect(assignTier(11)).toBe('developing')
  })

  it('returns advanced for scores 12–15', () => {
    expect(assignTier(12)).toBe('advanced')
    expect(assignTier(15)).toBe('advanced')
  })
})

describe('computeBenchmark', () => {
  it('returns zeros when the tier list is empty', () => {
    expect(computeBenchmark([])).toEqual({ earlyStage: 0, developing: 0, advanced: 0 })
  })

  it('returns 100 for the only present tier when all respondents are in one tier', () => {
    const result = computeBenchmark(['developing', 'developing', 'developing'])
    expect(result).toEqual({ earlyStage: 0, developing: 100, advanced: 0 })
  })

  it('returns equal percentages when evenly distributed', () => {
    // 2 of each → 33.3 + 33.3 + 33.4 = 100 (or similar with rounding correction)
    const tiers: TierKey[] = ['earlyStage', 'earlyStage', 'developing', 'developing', 'advanced', 'advanced']
    const result = computeBenchmark(tiers)
    expect(result.earlyStage).toBeCloseTo(33.3, 0)
    expect(result.developing).toBeCloseTo(33.3, 0)
    const sum = parseFloat((result.earlyStage + result.developing + result.advanced).toFixed(1))
    expect(sum).toBe(100)
  })

  it('sums to exactly 100 after rounding correction (7 respondents)', () => {
    const tiers: TierKey[] = [
      'earlyStage', 'earlyStage', 'earlyStage',
      'developing', 'developing', 'developing',
      'advanced',
    ]
    const result = computeBenchmark(tiers)
    const sum = parseFloat((result.earlyStage + result.developing + result.advanced).toFixed(1))
    expect(sum).toBe(100)
  })

  it('applies rounding correction to earlyStage before developing when they tie', () => {
    // 3 each of earlyStage and developing, 0 advanced → 50/50/0 (no correction needed)
    // Use 1 of each → 33.3/33.3/33.3 → correction goes to earlyStage (tiebreaker)
    const tiers: TierKey[] = ['earlyStage', 'developing', 'advanced']
    const result = computeBenchmark(tiers)
    const sum = parseFloat((result.earlyStage + result.developing + result.advanced).toFixed(1))
    expect(sum).toBe(100)
    // With 3 equal buckets rounded to 1 decimal, the correction must land on earlyStage (first in priority)
    // All three round to 33.3 (3/3 × 100 = 100.0 exactly, no correction needed in this case)
    // Use 7 equal respondents to force a tiebreaker: 7/3 groups don't divide evenly
    const sevens: TierKey[] = [
      'earlyStage', 'earlyStage',
      'developing', 'developing',
      'advanced', 'advanced', 'advanced',
    ]
    // 2 earlyStage = 28.6%, 2 developing = 28.6%, 3 advanced = 42.9% → sum = 100.1
    // Correction = -0.1 → subtract from advanced (largest), not earlyStage
    const r7 = computeBenchmark(sevens)
    const s7 = parseFloat((r7.earlyStage + r7.developing + r7.advanced).toFixed(1))
    expect(s7).toBe(100)
  })

  it('applies correction to earlyStage when earlyStage and developing tie for largest', () => {
    // 5 earlyStage, 5 developing, 0 advanced: each = 50%, no correction needed
    // 3 earlyStage, 3 developing, 1 advanced: earlyStage=42.9, developing=42.9, advanced=14.3
    // sum = 100.1 → correction = -0.1 → subtract from earlyStage (tiebreaker: earlyStage before developing)
    const tiers: TierKey[] = [
      'earlyStage', 'earlyStage', 'earlyStage',
      'developing', 'developing', 'developing',
      'advanced',
    ]
    const result = computeBenchmark(tiers)
    // earlyStage and developing are tied → correction must go to earlyStage
    const sum = parseFloat((result.earlyStage + result.developing + result.advanced).toFixed(1))
    expect(sum).toBe(100)
    // earlyStage should receive the correction (be slightly different from developing)
    // Both round to 42.9 initially, but after correction one will differ by 0.1
    expect(Math.abs(result.earlyStage - result.developing)).toBeCloseTo(0.1, 1)
  })

  it('returns values with at most 1 decimal place', () => {
    const tiers: TierKey[] = ['earlyStage', 'earlyStage', 'developing']
    const result = computeBenchmark(tiers)
    for (const val of Object.values(result)) {
      const decimalPart = val.toString().split('.')[1] ?? ''
      expect(decimalPart.length).toBeLessThanOrEqual(1)
    }
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- __tests__/lib/scoring.test.ts
```

Expected: FAIL — "Cannot find module '@/lib/scoring'"

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/scoring.ts
import type { TierKey, BenchmarkData } from './types'

export function computeScore(answers: {
  q1: number; q2: number; q3: number; q4: number; q5: number
}): number {
  return answers.q1 + answers.q2 + answers.q3 + answers.q4 + answers.q5
}

export function assignTier(score: number): TierKey {
  if (score <= 8) return 'earlyStage'
  if (score <= 11) return 'developing'
  return 'advanced'
}

export function computeBenchmark(tiers: TierKey[]): BenchmarkData {
  if (tiers.length === 0) {
    return { earlyStage: 0, developing: 0, advanced: 0 }
  }

  const counts = { earlyStage: 0, developing: 0, advanced: 0 }
  for (const tier of tiers) {
    counts[tier]++
  }

  const total = tiers.length
  const round1 = (n: number) => Math.round((n / total) * 1000) / 10

  const rounded: BenchmarkData = {
    earlyStage: round1(counts.earlyStage),
    developing: round1(counts.developing),
    advanced: round1(counts.advanced),
  }

  const sum = rounded.earlyStage + rounded.developing + rounded.advanced
  const correction = Math.round((100 - sum) * 10) / 10

  if (correction !== 0) {
    // Apply correction to the largest bucket.
    // Tiebreaker: earlyStage > developing > advanced (first in priority order wins).
    const keys: TierKey[] = ['earlyStage', 'developing', 'advanced']
    let maxKey = keys[0]
    for (const key of keys) {
      if (rounded[key] > rounded[maxKey]) {
        maxKey = key
      }
    }
    rounded[maxKey] = Math.round((rounded[maxKey] + correction) * 10) / 10
  }

  return rounded
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- __tests__/lib/scoring.test.ts
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scoring.ts __tests__/lib/scoring.test.ts
git commit -m "feat: add scoring library with computeScore, assignTier, computeBenchmark"
```

---

## Task 4: Validation Library (TDD)

**Files:**
- Create: `__tests__/lib/validate.test.ts`
- Create: `src/lib/validate.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/lib/validate.test.ts
import { validatePayload } from '@/lib/validate'
import { COMPANY_SIZES } from '@/lib/config'

// Verify that COMPANY_SIZES values (the source of truth for the dropdown)
// are accepted by the validator. This catches en-dash vs hyphen divergence.
describe('COMPANY_SIZES and validatePayload consistency', () => {
  it('accepts every value in the COMPANY_SIZES constant', () => {
    const base = { company_name: 'Acme', title: 'CLO', q1: 1, q2: 1, q3: 1, q4: 1, q5: 1 }
    for (const size of COMPANY_SIZES) {
      expect(validatePayload({ ...base, company_size: size })).toBeNull()
    }
  })
})

const VALID = {
  company_name: 'Acme Corp',
  title: 'CLO',
  company_size: '51\u2013200', // en-dash U+2013
  q1: 2, q2: 3, q3: 1, q4: 2, q5: 2,
}

describe('validatePayload', () => {
  it('returns null for a valid payload', () => {
    expect(validatePayload(VALID)).toBeNull()
  })

  it('returns error for null body', () => {
    expect(validatePayload(null)).toEqual({ error: 'Missing or invalid field: company_name' })
  })

  it('returns error for missing company_name', () => {
    const { company_name: _, ...rest } = VALID
    expect(validatePayload(rest)).toEqual({ error: 'Missing or invalid field: company_name' })
  })

  it('returns error for whitespace-only company_name', () => {
    expect(validatePayload({ ...VALID, company_name: '   ' })).toEqual({
      error: 'Missing or invalid field: company_name',
    })
  })

  it('returns error for company_name exceeding 255 chars', () => {
    expect(validatePayload({ ...VALID, company_name: 'a'.repeat(256) })).toEqual({
      error: 'Missing or invalid field: company_name',
    })
  })

  it('returns error for missing title', () => {
    const { title: _, ...rest } = VALID
    expect(validatePayload(rest)).toEqual({ error: 'Missing or invalid field: title' })
  })

  it('rejects company_size with a hyphen (not an en-dash)', () => {
    // '51-200' uses hyphen-minus U+002D — must be rejected
    expect(validatePayload({ ...VALID, company_size: '51-200' })).toEqual({
      error: 'Missing or invalid field: company_size',
    })
  })

  it('returns error for invalid company_size', () => {
    expect(validatePayload({ ...VALID, company_size: 'unknown' })).toEqual({
      error: 'Missing or invalid field: company_size',
    })
  })

  it('returns error for q1 out of range', () => {
    expect(validatePayload({ ...VALID, q1: 0 })).toEqual({ error: 'Missing or invalid field: q1' })
    expect(validatePayload({ ...VALID, q1: 4 })).toEqual({ error: 'Missing or invalid field: q1' })
  })

  it('returns error for non-integer q value', () => {
    expect(validatePayload({ ...VALID, q1: 1.5 })).toEqual({ error: 'Missing or invalid field: q1' })
  })

  it('returns error for missing q3', () => {
    const { q3: _, ...rest } = VALID
    expect(validatePayload(rest)).toEqual({ error: 'Missing or invalid field: q3' })
  })

  it('validates fields in declared order — company_name before title', () => {
    const { company_name: _cn, title: _t, ...rest } = VALID
    expect(validatePayload(rest)).toEqual({ error: 'Missing or invalid field: company_name' })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- __tests__/lib/validate.test.ts
```

Expected: FAIL — "Cannot find module '@/lib/validate'"

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/validate.ts
import { COMPANY_SIZES } from './config'

export function validatePayload(body: unknown): { error: string } | null {
  if (typeof body !== 'object' || body === null) {
    return { error: 'Missing or invalid field: company_name' }
  }

  const data = body as Record<string, unknown>

  if (
    typeof data.company_name !== 'string' ||
    data.company_name.trim().length === 0 ||
    data.company_name.trim().length > 255
  ) {
    return { error: 'Missing or invalid field: company_name' }
  }

  if (
    typeof data.title !== 'string' ||
    data.title.trim().length === 0 ||
    data.title.trim().length > 255
  ) {
    return { error: 'Missing or invalid field: title' }
  }

  if (!(COMPANY_SIZES as readonly string[]).includes(data.company_size as string)) {
    return { error: 'Missing or invalid field: company_size' }
  }

  for (const key of ['q1', 'q2', 'q3', 'q4', 'q5'] as const) {
    const val = data[key]
    if (!Number.isInteger(val) || (val as number) < 1 || (val as number) > 3) {
      return { error: `Missing or invalid field: ${key}` }
    }
  }

  return null
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- __tests__/lib/validate.test.ts
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validate.ts __tests__/lib/validate.test.ts
git commit -m "feat: add payload validation library"
```

---

## Task 5: Google Sheets Library (TDD)

**Files:**
- Create: `__tests__/lib/sheets.test.ts`
- Create: `src/lib/sheets.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/lib/sheets.test.ts
import { appendRow, readTierColumn } from '@/lib/sheets'

const mockAppend = jest.fn()
const mockGet = jest.fn()

jest.mock('googleapis', () => ({
  google: {
    auth: {
      GoogleAuth: jest.fn().mockImplementation(() => ({})),
    },
    sheets: jest.fn().mockReturnValue({
      spreadsheets: {
        values: {
          append: mockAppend,
          get: mockGet,
        },
      },
    }),
  },
}))

beforeEach(() => {
  jest.clearAllMocks()
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({ type: 'service_account' })
  process.env.GOOGLE_SHEET_ID = 'test-sheet-id'
})

afterEach(() => {
  delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  delete process.env.GOOGLE_SHEET_ID
})

describe('appendRow', () => {
  it('calls the Sheets append API with correct parameters including valueInputOption and insertDataOption', async () => {
    mockAppend.mockResolvedValueOnce({})
    const row = ['2026-01-01T00:00:00Z', 'Acme', 'CLO', '51\u2013200', 2, 3, 1, 2, 2, 10, 'developing']
    await appendRow(row)
    expect(mockAppend).toHaveBeenCalledWith({
      spreadsheetId: 'test-sheet-id',
      range: 'Sheet1!A:K',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    })
  })

  it('throws when GOOGLE_SHEET_ID is missing', async () => {
    delete process.env.GOOGLE_SHEET_ID
    await expect(appendRow(['a'])).rejects.toThrow()
  })

  it('throws when GOOGLE_SERVICE_ACCOUNT_JSON is missing', async () => {
    delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    await expect(appendRow(['a'])).rejects.toThrow()
  })

  it('throws when GOOGLE_SERVICE_ACCOUNT_JSON is invalid JSON', async () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON = 'not-valid-json'
    await expect(appendRow(['a'])).rejects.toThrow()
  })
})

describe('readTierColumn', () => {
  it('uses the correct range Sheet1!K2:K (skips header in row 1)', async () => {
    mockGet.mockResolvedValueOnce({ data: {} })
    await readTierColumn()
    expect(mockGet).toHaveBeenCalledWith(
      expect.objectContaining({ range: 'Sheet1!K2:K' })
    )
  })

  it('returns recognized tier values from the column', async () => {
    mockGet.mockResolvedValueOnce({
      data: { values: [['earlyStage'], ['developing'], ['advanced'], ['developing']] },
    })
    const result = await readTierColumn()
    expect(result).toEqual(['earlyStage', 'developing', 'advanced', 'developing'])
  })

  it('skips empty cells', async () => {
    mockGet.mockResolvedValueOnce({
      data: { values: [['developing'], [''], ['advanced']] },
    })
    const result = await readTierColumn()
    expect(result).toEqual(['developing', 'advanced'])
  })

  it('skips unrecognized values and logs a warning', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    mockGet.mockResolvedValueOnce({
      data: { values: [['developing'], ['bogus_value']] },
    })
    const result = await readTierColumn()
    expect(result).toEqual(['developing'])
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('bogus_value'))
    warnSpy.mockRestore()
  })

  it('returns empty array when the sheet has no data rows', async () => {
    mockGet.mockResolvedValueOnce({ data: {} })
    const result = await readTierColumn()
    expect(result).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- __tests__/lib/sheets.test.ts
```

Expected: FAIL — "Cannot find module '@/lib/sheets'"

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/sheets.ts
import { google } from 'googleapis'
import type { TierKey } from './types'

const VALID_TIERS: TierKey[] = ['earlyStage', 'developing', 'advanced']
const TAB = 'Sheet1'

function getSheetClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  const sheetId = process.env.GOOGLE_SHEET_ID

  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not set')
  if (!sheetId) throw new Error('GOOGLE_SHEET_ID is not set')

  const credentials = JSON.parse(raw) // throws SyntaxError on invalid JSON

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  return { sheets: google.sheets({ version: 'v4', auth }), sheetId }
}

export async function appendRow(values: (string | number)[]): Promise<void> {
  const { sheets, sheetId } = getSheetClient()
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${TAB}!A:K`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [values] },
  })
}

export async function readTierColumn(): Promise<TierKey[]> {
  const { sheets, sheetId } = getSheetClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${TAB}!K2:K`,
  })

  const rows = res.data.values ?? []
  const result: TierKey[] = []

  for (const row of rows) {
    const value = row[0]
    if (!value) continue
    if ((VALID_TIERS as string[]).includes(value)) {
      result.push(value as TierKey)
    } else {
      console.warn(`[sheets] Unrecognized maturity_tier value: ${value}`)
    }
  }

  return result
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- __tests__/lib/sheets.test.ts
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sheets.ts __tests__/lib/sheets.test.ts
git commit -m "feat: add Google Sheets library (appendRow, readTierColumn)"
```

---

## Task 6: POST /api/submit Route (TDD)

**Files:**
- Create: `__tests__/api/submit.test.ts`
- Create: `src/app/api/submit/route.ts`

Note: The startup guard (env var check) is implemented in the **route handler**, not in `sheets.ts`. The handler checks env vars directly before delegating to `sheets.ts`. This ensures the correct HTTP response shape (`{ "error": "Server misconfiguration" }`) is returned rather than a raw thrown error.

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/api/submit.test.ts
import { POST } from '@/app/api/submit/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/sheets', () => ({
  appendRow: jest.fn(),
  readTierColumn: jest.fn(),
}))

import { appendRow, readTierColumn } from '@/lib/sheets'
const mockAppend = appendRow as jest.Mock
const mockReadTiers = readTierColumn as jest.Mock

const VALID_BODY = {
  company_name: 'Acme Corp',
  title: 'CLO',
  company_size: '51\u2013200',
  q1: 2, q2: 3, q3: 1, q4: 2, q5: 2,
}

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({ type: 'service_account' })
  process.env.GOOGLE_SHEET_ID = 'test-id'
  mockAppend.mockResolvedValue(undefined)
  mockReadTiers.mockResolvedValue(['earlyStage', 'developing', 'developing', 'developing'])
})

afterEach(() => {
  delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  delete process.env.GOOGLE_SHEET_ID
})

describe('POST /api/submit — startup guard', () => {
  it('returns 500 with "Server misconfiguration" when GOOGLE_SERVICE_ACCOUNT_JSON is missing', async () => {
    delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    const res = await POST(makeReq(VALID_BODY))
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe('Server misconfiguration')
  })

  it('returns 500 with "Server misconfiguration" when GOOGLE_SHEET_ID is missing', async () => {
    delete process.env.GOOGLE_SHEET_ID
    const res = await POST(makeReq(VALID_BODY))
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe('Server misconfiguration')
  })

  it('returns 500 with "Server misconfiguration" when GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON', async () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON = 'bad-json'
    const res = await POST(makeReq(VALID_BODY))
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe('Server misconfiguration')
  })
})

describe('POST /api/submit — validation', () => {
  it('returns 400 for invalid payload (empty company_name)', async () => {
    const res = await POST(makeReq({ ...VALID_BODY, company_name: '' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/company_name/)
  })

  it('returns 400 for invalid q value', async () => {
    const res = await POST(makeReq({ ...VALID_BODY, q3: 5 }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/q3/)
  })
})

describe('POST /api/submit — success path', () => {
  it('returns 200 with score, tier, and benchmark', async () => {
    const res = await POST(makeReq(VALID_BODY))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.score).toBe(10) // 2+3+1+2+2
    expect(body.tier).toBe('developing') // 10 → developing
    expect(body.benchmark).toHaveProperty('earlyStage')
    expect(body.benchmark).toHaveProperty('developing')
    expect(body.benchmark).toHaveProperty('advanced')
  })

  it('appends a row in column order A–K', async () => {
    await POST(makeReq(VALID_BODY))
    const row = mockAppend.mock.calls[0][0]
    // A=timestamp, B=company_name, C=title, D=company_size, E-I=q1-q5, J=total_score, K=maturity_tier
    expect(typeof row[0]).toBe('string') // timestamp
    expect(row[1]).toBe('Acme Corp')
    expect(row[2]).toBe('CLO')
    expect(row[3]).toBe('51\u2013200')
    expect(row[4]).toBe(2)  // q1
    expect(row[5]).toBe(3)  // q2
    expect(row[6]).toBe(1)  // q3
    expect(row[7]).toBe(2)  // q4
    expect(row[8]).toBe(2)  // q5
    expect(row[9]).toBe(10) // total_score
    expect(row[10]).toBe('developing') // maturity_tier
  })

  it('trims whitespace from string fields before appending', async () => {
    await POST(makeReq({ ...VALID_BODY, company_name: '  Acme  ', title: ' CLO ' }))
    const row = mockAppend.mock.calls[0][0]
    expect(row[1]).toBe('Acme')
    expect(row[2]).toBe('CLO')
  })

  it('benchmark percentages sum to 100', async () => {
    mockReadTiers.mockResolvedValueOnce(['earlyStage', 'developing', 'developing', 'developing', 'advanced'])
    const res = await POST(makeReq(VALID_BODY))
    const { benchmark } = await res.json()
    const sum = parseFloat((benchmark.earlyStage + benchmark.developing + benchmark.advanced).toFixed(1))
    expect(sum).toBe(100)
  })
})

describe('POST /api/submit — error paths', () => {
  it('returns 500 with code SHEET_WRITE_ERROR when append fails', async () => {
    mockAppend.mockRejectedValueOnce(new Error('Sheets API down'))
    const res = await POST(makeReq(VALID_BODY))
    expect(res.status).toBe(500)
    expect((await res.json()).code).toBe('SHEET_WRITE_ERROR')
  })

  it('returns 200 with benchmark:null (partial success) when readTierColumn fails after successful append', async () => {
    mockReadTiers.mockRejectedValueOnce(new Error('Read failed'))
    const res = await POST(makeReq(VALID_BODY))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.benchmark).toBeNull()
    expect(body.score).toBe(10)
    expect(body.tier).toBe('developing')
  })

  it('returns benchmark all-zeros when readTierColumn returns empty (first submission edge case)', async () => {
    mockReadTiers.mockResolvedValueOnce([])
    const res = await POST(makeReq(VALID_BODY))
    const { benchmark } = await res.json()
    expect(benchmark).toEqual({ earlyStage: 0, developing: 0, advanced: 0 })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- __tests__/api/submit.test.ts
```

Expected: FAIL — "Cannot find module '@/app/api/submit/route'"

- [ ] **Step 3: Write the implementation**

```typescript
// src/app/api/submit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { validatePayload } from '@/lib/validate'
import { computeScore, assignTier, computeBenchmark } from '@/lib/scoring'
import { appendRow, readTierColumn } from '@/lib/sheets'

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Startup guard — per-request, returns the correct HTTP shape for misconfiguration
  const rawCreds = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  const sheetId = process.env.GOOGLE_SHEET_ID
  if (!rawCreds || !sheetId) {
    console.error('[submit] Server misconfiguration: missing env vars')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }
  try {
    JSON.parse(rawCreds)
  } catch {
    console.error('[submit] Server misconfiguration: GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Missing or invalid field: company_name' }, { status: 400 })
  }

  // Step 1: Validate
  const validationError = validatePayload(body)
  if (validationError) {
    return NextResponse.json(validationError, { status: 400 })
  }

  const data = body as {
    company_name: string; title: string; company_size: string
    q1: number; q2: number; q3: number; q4: number; q5: number
  }

  // Step 2: Compute score and tier
  // SCORE_OUT_OF_RANGE is a defensive canary — mathematically unreachable with valid input
  const score = computeScore(data)
  if (score < 5 || score > 15) {
    console.error(`[submit] SCORE_OUT_OF_RANGE: computed score ${score}`)
    return NextResponse.json(
      { error: 'Score computation error', code: 'SCORE_OUT_OF_RANGE' },
      { status: 500 }
    )
  }
  const tier = assignTier(score)

  // Step 3: Append row — columns A through K
  const timestamp = new Date().toISOString()
  const row = [
    timestamp,
    data.company_name.trim(),
    data.title.trim(),
    data.company_size,
    data.q1, data.q2, data.q3, data.q4, data.q5,
    score,
    tier,
  ]

  try {
    await appendRow(row)
  } catch (err) {
    console.error('[submit] Failed to append row:', err)
    return NextResponse.json(
      { error: 'Failed to save response', code: 'SHEET_WRITE_ERROR' },
      { status: 500 }
    )
  }

  // Step 4: Read benchmark — best-effort, partial success on failure
  let benchmark: ReturnType<typeof computeBenchmark> | null
  try {
    const tiers = await readTierColumn()
    benchmark = computeBenchmark(tiers)
  } catch (err) {
    console.error('[submit] Failed to read benchmark:', err)
    benchmark = null
  }

  // Serialize all benchmark values to 1 decimal place to prevent float artifacts
  const serializedBenchmark = benchmark
    ? {
        earlyStage: parseFloat(benchmark.earlyStage.toFixed(1)),
        developing: parseFloat(benchmark.developing.toFixed(1)),
        advanced: parseFloat(benchmark.advanced.toFixed(1)),
      }
    : null

  return NextResponse.json({ score, tier, benchmark: serializedBenchmark })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- __tests__/api/submit.test.ts
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/submit/route.ts __tests__/api/submit.test.ts
git commit -m "feat: add POST /api/submit route"
```

---

## Task 7: GET /api/benchmark Route (TDD)

**Files:**
- Create: `__tests__/api/benchmark.test.ts`
- Create: `src/app/api/benchmark/route.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/api/benchmark.test.ts
import { GET } from '@/app/api/benchmark/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/sheets', () => ({ readTierColumn: jest.fn() }))

import { readTierColumn } from '@/lib/sheets'
const mockReadTiers = readTierColumn as jest.Mock

function makeReq() {
  return new NextRequest('http://localhost/api/benchmark')
}

beforeEach(() => {
  jest.clearAllMocks()
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({ type: 'service_account' })
  process.env.GOOGLE_SHEET_ID = 'test-id'
})

afterEach(() => {
  delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  delete process.env.GOOGLE_SHEET_ID
})

describe('GET /api/benchmark — startup guard', () => {
  it('returns 500 with "Server misconfiguration" when GOOGLE_SERVICE_ACCOUNT_JSON is missing', async () => {
    delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    const res = await GET(makeReq())
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe('Server misconfiguration')
  })

  it('returns 500 with "Server misconfiguration" when GOOGLE_SHEET_ID is missing', async () => {
    delete process.env.GOOGLE_SHEET_ID
    const res = await GET(makeReq())
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe('Server misconfiguration')
  })
})

describe('GET /api/benchmark — success path', () => {
  it('returns tier distribution as percentages summing to 100', async () => {
    mockReadTiers.mockResolvedValueOnce(['earlyStage', 'developing', 'developing', 'advanced'])
    const res = await GET(makeReq())
    expect(res.status).toBe(200)
    const body = await res.json()
    const sum = parseFloat((body.earlyStage + body.developing + body.advanced).toFixed(1))
    expect(sum).toBe(100)
  })

  it('returns all zeros when the sheet is empty', async () => {
    mockReadTiers.mockResolvedValueOnce([])
    const res = await GET(makeReq())
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ earlyStage: 0, developing: 0, advanced: 0 })
  })
})

describe('GET /api/benchmark — error path', () => {
  it('returns 500 with fixed error string when readTierColumn throws', async () => {
    mockReadTiers.mockRejectedValueOnce(new Error('Sheets down'))
    const res = await GET(makeReq())
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe('Failed to read benchmark data')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- __tests__/api/benchmark.test.ts
```

Expected: FAIL — "Cannot find module '@/app/api/benchmark/route'"

- [ ] **Step 3: Write the implementation**

```typescript
// src/app/api/benchmark/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { computeBenchmark } from '@/lib/scoring'
import { readTierColumn } from '@/lib/sheets'

export async function GET(_req: NextRequest): Promise<NextResponse> {
  // Startup guard — per-request
  const rawCreds = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  const sheetId = process.env.GOOGLE_SHEET_ID
  if (!rawCreds || !sheetId) {
    console.error('[benchmark] Server misconfiguration: missing env vars')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }
  try {
    JSON.parse(rawCreds)
  } catch {
    console.error('[benchmark] Server misconfiguration: GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  try {
    const tiers = await readTierColumn()
    const benchmark = computeBenchmark(tiers)
    return NextResponse.json({
      earlyStage: parseFloat(benchmark.earlyStage.toFixed(1)),
      developing: parseFloat(benchmark.developing.toFixed(1)),
      advanced: parseFloat(benchmark.advanced.toFixed(1)),
    })
  } catch (err) {
    console.error('[benchmark] Failed to read benchmark data:', err)
    return NextResponse.json({ error: 'Failed to read benchmark data' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- __tests__/api/benchmark.test.ts
```

- [ ] **Step 5: Run the full backend test suite**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/benchmark/route.ts __tests__/api/benchmark.test.ts
git commit -m "feat: add GET /api/benchmark route"
```

---

## Task 8: UI Components

**Files:**
- Create: `src/components/IntakeForm.tsx`
- Create: `src/components/Assessment.tsx`
- Create: `src/components/BenchmarkChart.tsx`
- Create: `src/components/Results.tsx`

- [ ] **Step 1: Create src/components/IntakeForm.tsx**

```tsx
// src/components/IntakeForm.tsx
'use client'

import { useState } from 'react'
import { COMPANY_SIZES } from '@/lib/config'
import type { IntakeData } from '@/lib/types'

interface IntakeFormProps {
  initial: IntakeData
  onSubmit: (data: IntakeData) => void
}

export function IntakeForm({ initial, onSubmit }: IntakeFormProps) {
  const [values, setValues] = useState<IntakeData>(initial)
  const [errors, setErrors] = useState<Partial<Record<keyof IntakeData, string>>>({})

  function validate(): boolean {
    const e: Partial<Record<keyof IntakeData, string>> = {}
    if (!values.company_name.trim()) e.company_name = 'Company name is required'
    if (!values.title.trim()) e.title = 'Your title is required'
    if (!values.company_size) e.company_size = 'Company size is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (validate()) {
      onSubmit({
        company_name: values.company_name.trim(),
        title: values.title.trim(),
        company_size: values.company_size,
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Enablement Self-Assessment</h1>
        <p className="text-gray-500 mb-8 text-sm">
          Takes about 2 minutes. Tell us a bit about yourself to get started.
        </p>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="company_name">
              Company Name
            </label>
            <input
              id="company_name"
              type="text"
              value={values.company_name}
              onChange={e => setValues(v => ({ ...v, company_name: e.target.value }))}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.company_name ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.company_name && (
              <p className="text-red-500 text-xs mt-1">{errors.company_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="title">
              Your Title
            </label>
            <input
              id="title"
              type="text"
              value={values.title}
              onChange={e => setValues(v => ({ ...v, title: e.target.value }))}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="company_size">
              Company Size
            </label>
            <select
              id="company_size"
              value={values.company_size}
              onChange={e => setValues(v => ({ ...v, company_size: e.target.value }))}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.company_size ? 'border-red-400' : 'border-gray-300'
              }`}
            >
              <option value="">Select company size</option>
              {COMPANY_SIZES.map(size => (
                <option key={size} value={size}>{size} employees</option>
              ))}
            </select>
            {errors.company_size && (
              <p className="text-red-500 text-xs mt-1">{errors.company_size}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            Start Assessment →
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create src/components/Assessment.tsx**

```tsx
// src/components/Assessment.tsx
'use client'

import { QUESTIONS } from '@/lib/config'
import type { Answers } from '@/lib/types'

interface AssessmentProps {
  currentIndex: number   // 0–4
  answers: Answers
  onAnswer: (qKey: keyof Answers, value: number) => void
  onNext: () => void
  onBack: () => void
}

export function Assessment({ currentIndex, answers, onAnswer, onNext, onBack }: AssessmentProps) {
  const question = QUESTIONS[currentIndex]
  const qKey = question.id as keyof Answers
  const selected = answers[qKey]
  const isLast = currentIndex === QUESTIONS.length - 1
  const questionNumber = currentIndex + 1

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-lg">
        <div className="flex items-center gap-2 mb-6">
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < questionNumber ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 mb-4">Question {questionNumber} of {QUESTIONS.length}</p>

        <h2 className="text-lg font-semibold text-gray-900 mb-6">{question.text}</h2>

        <div className="space-y-3 mb-8">
          {question.options.map(option => (
            <label
              key={option.value}
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                selected === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name={question.id}
                value={option.value}
                checked={selected === option.value}
                onChange={() => onAnswer(qKey, option.value)}
                className="mt-0.5 accent-blue-600"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-between">
          <button
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={onNext}
            disabled={selected === null}
            aria-disabled={selected === null}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              selected !== null
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLast ? 'See My Results →' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create src/components/BenchmarkChart.tsx**

```tsx
// src/components/BenchmarkChart.tsx
import { TIER_CONFIG } from '@/lib/config'
import type { BenchmarkData, TierKey } from '@/lib/types'

interface BenchmarkChartProps {
  benchmark: BenchmarkData
  userTier: TierKey
}

const TIER_ORDER: TierKey[] = ['earlyStage', 'developing', 'advanced']

export function BenchmarkChart({ benchmark, userTier }: BenchmarkChartProps) {
  return (
    <div className="space-y-3" role="list" aria-label="Benchmark distribution">
      {TIER_ORDER.map(tier => {
        const pct = benchmark[tier]
        const isUser = tier === userTier
        return (
          <div key={tier} className="flex items-center gap-3" role="listitem">
            <div className="w-28 shrink-0">
              <span className={`text-sm font-medium ${isUser ? 'text-blue-700' : 'text-gray-600'}`}>
                {TIER_CONFIG[tier].displayName}
                {isUser && <span className="ml-1 text-xs">(you)</span>}
              </span>
            </div>
            <div className="flex-1 bg-gray-100 rounded-full h-5 relative overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isUser ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                style={{ width: `${pct}%` }}
                data-testid={`bar-${tier}`}
              />
            </div>
            <div className="w-12 text-right">
              <span className={`text-sm font-medium ${isUser ? 'text-blue-700' : 'text-gray-500'}`}>
                {pct.toFixed(1)}%
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Create src/components/Results.tsx**

```tsx
// src/components/Results.tsx
'use client'

import { TIER_CONFIG } from '@/lib/config'
import { BenchmarkChart } from './BenchmarkChart'
import type { ApiState, TierKey } from '@/lib/types'

interface ResultsProps {
  clientScore: number
  clientTier: TierKey
  apiState: ApiState
  onRetry: () => void
  onStartOver: () => void
}

export function Results({ clientScore, clientTier, apiState, onRetry, onStartOver }: ResultsProps) {
  const isScoreOutOfRange = apiState.errorCode === 'SCORE_OUT_OF_RANGE'
  const hasError = apiState.status === 'error'

  // Server is authoritative: use server values if available
  const displayScore = apiState.result?.score ?? clientScore
  const displayTier = apiState.result?.tier ?? clientTier

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-lg">

        {/* Score and tier */}
        <div className="mb-6">
          {isScoreOutOfRange ? (
            <div className="text-3xl font-bold text-gray-300 mb-1" data-testid="score-unavailable">—</div>
          ) : (
            <>
              <div className="text-sm font-medium text-blue-600 mb-1">Your AI Maturity Score</div>
              <div className="text-3xl font-bold text-gray-900 mb-1" data-testid="tier-display">
                {TIER_CONFIG[displayTier].displayName}
              </div>
              <div className="text-lg text-gray-500" data-testid="score-display">
                {displayScore} / 15
              </div>
            </>
          )}
        </div>

        {/* Error states */}
        {hasError && !isScoreOutOfRange && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6" role="alert">
            <p className="text-sm text-red-700 mb-2">
              Something went wrong saving your results. Please try again.
            </p>
            <button
              onClick={onRetry}
              className="text-sm font-medium text-red-700 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {isScoreOutOfRange && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6" role="alert">
            <p className="text-sm text-red-700">
              Something went wrong calculating your score.
            </p>
          </div>
        )}

        {/* Next steps */}
        {!isScoreOutOfRange && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Recommended Next Steps
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {TIER_CONFIG[displayTier].nextSteps}
            </p>
          </div>
        )}

        {/* Benchmark chart area */}
        {!isScoreOutOfRange && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
              How You Compare
            </h3>
            {apiState.status === 'pending' && (
              <div className="text-sm text-gray-400 animate-pulse" data-testid="benchmark-loading">
                Loading benchmark data…
              </div>
            )}
            {hasError && (
              <div className="text-sm text-gray-400" data-testid="benchmark-unavailable">
                Benchmark data temporarily unavailable.
              </div>
            )}
            {apiState.status === 'success' && apiState.result?.benchmark === null && (
              <div className="text-sm text-gray-400" data-testid="benchmark-unavailable">
                Benchmark data temporarily unavailable.
              </div>
            )}
            {apiState.status === 'success' && apiState.result?.benchmark != null && (
              <BenchmarkChart benchmark={apiState.result.benchmark} userTier={displayTier} />
            )}
          </div>
        )}

        <button
          onClick={onStartOver}
          className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors"
          data-testid="start-over"
        >
          Start Over
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Verify the app compiles**

```bash
npm run build 2>&1 | tail -30
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/
git commit -m "feat: add UI components (IntakeForm, Assessment, BenchmarkChart, Results)"
```

---

## Task 9: UI Component Tests

**Files:**
- Create: `__tests__/components/Assessment.test.tsx`
- Create: `__tests__/components/Results.test.tsx`

- [ ] **Step 1: Write Assessment component tests**

```tsx
// __tests__/components/Assessment.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Assessment } from '@/components/Assessment'
import type { Answers } from '@/lib/types'

const EMPTY_ANSWERS: Answers = { q1: null, q2: null, q3: null, q4: null, q5: null }
const mockOnAnswer = jest.fn()
const mockOnNext = jest.fn()
const mockOnBack = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Assessment', () => {
  it('shows the progress indicator as "Question 1 of 5" on first question', () => {
    render(
      <Assessment
        currentIndex={0}
        answers={EMPTY_ANSWERS}
        onAnswer={mockOnAnswer}
        onNext={mockOnNext}
        onBack={mockOnBack}
      />
    )
    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument()
  })

  it('disables the Next button when no answer is selected', () => {
    render(
      <Assessment
        currentIndex={0}
        answers={EMPTY_ANSWERS}
        onAnswer={mockOnAnswer}
        onNext={mockOnNext}
        onBack={mockOnBack}
      />
    )
    const nextBtn = screen.getByRole('button', { name: /next/i })
    expect(nextBtn).toBeDisabled()
  })

  it('enables the Next button when an answer is selected', () => {
    const answers = { ...EMPTY_ANSWERS, q1: 2 }
    render(
      <Assessment
        currentIndex={0}
        answers={answers}
        onAnswer={mockOnAnswer}
        onNext={mockOnNext}
        onBack={mockOnBack}
      />
    )
    const nextBtn = screen.getByRole('button', { name: /next/i })
    expect(nextBtn).not.toBeDisabled()
  })

  it('calls onAnswer with the correct key and value when a radio is selected', async () => {
    const user = userEvent.setup()
    render(
      <Assessment
        currentIndex={0}
        answers={EMPTY_ANSWERS}
        onAnswer={mockOnAnswer}
        onNext={mockOnNext}
        onBack={mockOnBack}
      />
    )
    const radios = screen.getAllByRole('radio')
    await user.click(radios[0])
    expect(mockOnAnswer).toHaveBeenCalledWith('q1', 1)
  })

  it('calls onNext when Next button is clicked with an answer selected', async () => {
    const user = userEvent.setup()
    render(
      <Assessment
        currentIndex={0}
        answers={{ ...EMPTY_ANSWERS, q1: 1 }}
        onAnswer={mockOnAnswer}
        onNext={mockOnNext}
        onBack={mockOnBack}
      />
    )
    await user.click(screen.getByRole('button', { name: /next/i }))
    expect(mockOnNext).toHaveBeenCalledTimes(1)
  })

  it('calls onBack when Back button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <Assessment
        currentIndex={1}
        answers={EMPTY_ANSWERS}
        onAnswer={mockOnAnswer}
        onNext={mockOnNext}
        onBack={mockOnBack}
      />
    )
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(mockOnBack).toHaveBeenCalledTimes(1)
  })

  it('shows "See My Results →" on the last question', () => {
    render(
      <Assessment
        currentIndex={4}
        answers={{ ...EMPTY_ANSWERS, q5: 2 }}
        onAnswer={mockOnAnswer}
        onNext={mockOnNext}
        onBack={mockOnBack}
      />
    )
    expect(screen.getByRole('button', { name: /see my results/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Write Results component tests**

```tsx
// __tests__/components/Results.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Results } from '@/components/Results'
import type { ApiState } from '@/lib/types'

const mockOnRetry = jest.fn()
const mockOnStartOver = jest.fn()

beforeEach(() => jest.clearAllMocks())

const pendingState: ApiState = { status: 'pending', result: null, errorCode: null }
const successState: ApiState = {
  status: 'success',
  result: { score: 10, tier: 'developing', benchmark: { earlyStage: 25, developing: 50, advanced: 25 } },
  errorCode: null,
}
const benchmarkNullState: ApiState = {
  status: 'success',
  result: { score: 10, tier: 'developing', benchmark: null },
  errorCode: null,
}
const writeErrorState: ApiState = { status: 'error', result: null, errorCode: 'SHEET_WRITE_ERROR' }
const unknownErrorState: ApiState = { status: 'error', result: null, errorCode: 'UNKNOWN' }
const scoreOutOfRangeState: ApiState = { status: 'error', result: null, errorCode: 'SCORE_OUT_OF_RANGE' }

describe('Results — pending state', () => {
  it('shows loading indicator for benchmark', () => {
    render(
      <Results clientScore={10} clientTier="developing" apiState={pendingState}
        onRetry={mockOnRetry} onStartOver={mockOnStartOver} />
    )
    expect(screen.getByTestId('benchmark-loading')).toBeInTheDocument()
  })

  it('shows client-computed score and tier immediately', () => {
    render(
      <Results clientScore={10} clientTier="developing" apiState={pendingState}
        onRetry={mockOnRetry} onStartOver={mockOnStartOver} />
    )
    expect(screen.getByTestId('score-display')).toHaveTextContent('10 / 15')
    expect(screen.getByTestId('tier-display')).toHaveTextContent('Developing')
  })
})

describe('Results — success state', () => {
  it('renders the benchmark chart when benchmark data is present', () => {
    render(
      <Results clientScore={10} clientTier="developing" apiState={successState}
        onRetry={mockOnRetry} onStartOver={mockOnStartOver} />
    )
    expect(screen.getByRole('list', { name: /benchmark distribution/i })).toBeInTheDocument()
  })

  it('uses server score/tier over client values', () => {
    const serverOverrideState: ApiState = {
      status: 'success',
      result: { score: 12, tier: 'advanced', benchmark: { earlyStage: 20, developing: 40, advanced: 40 } },
      errorCode: null,
    }
    render(
      <Results clientScore={10} clientTier="developing" apiState={serverOverrideState}
        onRetry={mockOnRetry} onStartOver={mockOnStartOver} />
    )
    expect(screen.getByTestId('score-display')).toHaveTextContent('12 / 15')
    expect(screen.getByTestId('tier-display')).toHaveTextContent('Advanced')
  })
})

describe('Results — benchmark:null (partial success)', () => {
  it('shows "Benchmark data temporarily unavailable" instead of the chart', () => {
    render(
      <Results clientScore={10} clientTier="developing" apiState={benchmarkNullState}
        onRetry={mockOnRetry} onStartOver={mockOnStartOver} />
    )
    expect(screen.getByTestId('benchmark-unavailable')).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: /benchmark distribution/i })).not.toBeInTheDocument()
  })
})

describe('Results — SHEET_WRITE_ERROR', () => {
  it('shows error message with retry button', () => {
    render(
      <Results clientScore={10} clientTier="developing" apiState={writeErrorState}
        onRetry={mockOnRetry} onStartOver={mockOnStartOver} />
    )
    expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong saving/i)
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('calls onRetry when the retry button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <Results clientScore={10} clientTier="developing" apiState={writeErrorState}
        onRetry={mockOnRetry} onStartOver={mockOnStartOver} />
    )
    await user.click(screen.getByRole('button', { name: /retry/i }))
    expect(mockOnRetry).toHaveBeenCalledTimes(1)
  })

  it('keeps the client-computed score/tier visible on write error', () => {
    render(
      <Results clientScore={10} clientTier="developing" apiState={writeErrorState}
        onRetry={mockOnRetry} onStartOver={mockOnStartOver} />
    )
    expect(screen.getByTestId('score-display')).toHaveTextContent('10 / 15')
  })
})

describe('Results — unknown 500 error treated as SHEET_WRITE_ERROR', () => {
  it('shows retry button for unknown error codes', () => {
    render(
      <Results clientScore={10} clientTier="developing" apiState={unknownErrorState}
        onRetry={mockOnRetry} onStartOver={mockOnStartOver} />
    )
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })
})

describe('Results — SCORE_OUT_OF_RANGE', () => {
  it('shows a dash instead of score/tier', () => {
    render(
      <Results clientScore={10} clientTier="developing" apiState={scoreOutOfRangeState}
        onRetry={mockOnRetry} onStartOver={mockOnStartOver} />
    )
    expect(screen.getByTestId('score-unavailable')).toBeInTheDocument()
    expect(screen.queryByTestId('score-display')).not.toBeInTheDocument()
  })

  it('hides the benchmark chart area entirely', () => {
    render(
      <Results clientScore={10} clientTier="developing" apiState={scoreOutOfRangeState}
        onRetry={mockOnRetry} onStartOver={mockOnStartOver} />
    )
    expect(screen.queryByRole('list', { name: /benchmark distribution/i })).not.toBeInTheDocument()
    expect(screen.queryByTestId('benchmark-loading')).not.toBeInTheDocument()
  })

  it('shows the specific score error message with no retry button', () => {
    render(
      <Results clientScore={10} clientTier="developing" apiState={scoreOutOfRangeState}
        onRetry={mockOnRetry} onStartOver={mockOnStartOver} />
    )
    expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong calculating/i)
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument()
  })
})

describe('Results — Start Over button', () => {
  it('is always visible and calls onStartOver when clicked', async () => {
    const user = userEvent.setup()
    render(
      <Results clientScore={10} clientTier="developing" apiState={pendingState}
        onRetry={mockOnRetry} onStartOver={mockOnStartOver} />
    )
    const btn = screen.getByTestId('start-over')
    expect(btn).toBeInTheDocument()
    await user.click(btn)
    expect(mockOnStartOver).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 3: Run component tests to verify they fail**

```bash
npm test -- __tests__/components/
```

Expected: FAIL — components don't exist yet (they'll be created in Task 8, so this task should run after Task 8).

- [ ] **Step 4: Run tests after components are created**

```bash
npm test -- __tests__/components/
```

Expected: All component tests pass.

- [ ] **Step 5: Run full test suite**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add __tests__/components/
git commit -m "test: add component tests for Assessment and Results"
```

---

## Task 10: Root Page — Multi-Step Flow Orchestration

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Write page.tsx**

```tsx
// src/app/page.tsx
'use client'

import { useRef, useState } from 'react'
import { IntakeForm } from '@/components/IntakeForm'
import { Assessment } from '@/components/Assessment'
import { Results } from '@/components/Results'
import { computeScore, assignTier } from '@/lib/scoring'
import type { Answers, ApiState, IntakeData, Step, SubmitPayload } from '@/lib/types'

const EMPTY_ANSWERS: Answers = { q1: null, q2: null, q3: null, q4: null, q5: null }
const EMPTY_INTAKE: IntakeData = { company_name: '', title: '', company_size: '' }
const INITIAL_API: ApiState = { status: 'idle', result: null, errorCode: null }

export default function Home() {
  const [step, setStep] = useState<Step>('intake')
  const [intake, setIntake] = useState<IntakeData>(EMPTY_INTAKE)
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [apiState, setApiState] = useState<ApiState>(INITIAL_API)
  const [clientScore, setClientScore] = useState(0)
  const [clientTier, setClientTier] = useState<ReturnType<typeof assignTier>>('earlyStage')

  // Single AbortController per request, paired with its timeout timer ID
  const abortRef = useRef<{
    controller: AbortController
    timeoutId: ReturnType<typeof setTimeout>
  } | null>(null)

  function startOver() {
    // Always cancel in-flight request and its timer before resetting state
    if (abortRef.current) {
      clearTimeout(abortRef.current.timeoutId)
      abortRef.current.controller.abort()
      abortRef.current = null
    }
    setStep('intake')
    setIntake(EMPTY_INTAKE)
    setAnswers(EMPTY_ANSWERS)
    setQuestionIndex(0)
    setApiState(INITIAL_API)
    setClientScore(0)
    setClientTier('earlyStage')
  }

  function handleIntakeSubmit(data: IntakeData) {
    setIntake(data)
    setStep('assessment')
    setQuestionIndex(0)
  }

  function handleAnswer(qKey: keyof Answers, value: number) {
    setAnswers(prev => ({ ...prev, [qKey]: value }))
  }

  function handleNext() {
    if (questionIndex < 4) {
      setQuestionIndex(i => i + 1)
    } else {
      const fullAnswers = answers as { q1: number; q2: number; q3: number; q4: number; q5: number }
      const score = computeScore(fullAnswers)
      const tier = assignTier(score)
      setClientScore(score)
      setClientTier(tier)
      setStep('results')
      setApiState({ status: 'pending', result: null, errorCode: null })
      submitToApi({ ...intake, ...fullAnswers })
    }
  }

  function handleBack() {
    if (questionIndex === 0) {
      setStep('intake')
    } else {
      setQuestionIndex(i => i - 1)
    }
  }

  async function submitToApi(payload: SubmitPayload) {
    // One controller per request; the timeout calls abort() after 10s
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10_000)
    abortRef.current = { controller, timeoutId }

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      abortRef.current = null

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const code: string = body.code ?? 'UNKNOWN'
        setApiState({ status: 'error', result: null, errorCode: code })
        return
      }

      const data = await res.json()

      // Server is authoritative; log divergence if client and server disagree
      const localScore = computeScore(payload)
      if (data.score !== localScore || data.tier !== assignTier(localScore)) {
        console.warn('[page] Server score/tier diverges from client computation', {
          server: { score: data.score, tier: data.tier },
          client: { score: localScore, tier: assignTier(localScore) },
        })
        setClientScore(data.score)
        setClientTier(data.tier)
      }

      setApiState({ status: 'success', result: data, errorCode: null })
    } catch (err: unknown) {
      clearTimeout(timeoutId)
      abortRef.current = null

      if (err instanceof Error && err.name === 'AbortError') {
        // Start Over aborted the request — state is already reset by startOver()
        return
      }
      // Timeout or network error: treat as SHEET_WRITE_ERROR (retry is safe)
      setApiState({ status: 'error', result: null, errorCode: 'SHEET_WRITE_ERROR' })
    }
  }

  function handleRetry() {
    const fullAnswers = answers as { q1: number; q2: number; q3: number; q4: number; q5: number }
    setApiState({ status: 'pending', result: null, errorCode: null })
    submitToApi({ ...intake, ...fullAnswers })
  }

  if (step === 'intake') {
    return <IntakeForm initial={intake} onSubmit={handleIntakeSubmit} />
  }

  if (step === 'assessment') {
    return (
      <Assessment
        currentIndex={questionIndex}
        answers={answers}
        onAnswer={handleAnswer}
        onNext={handleNext}
        onBack={handleBack}
      />
    )
  }

  return (
    <Results
      clientScore={clientScore}
      clientTier={clientTier}
      apiState={apiState}
      onRetry={handleRetry}
      onStartOver={startOver}
    />
  )
}
```

- [ ] **Step 2: Update src/app/layout.tsx**

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Maturity Self-Assessment',
  description: 'Assess your organization\'s AI enablement maturity and see how you compare to peers.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
```

- [ ] **Step 3: Build to verify no TypeScript errors**

```bash
npm run build
```

Expected: Build succeeds with no type errors.

- [ ] **Step 4: Manual end-to-end smoke test**

```bash
npm run dev
```

Open `http://localhost:3000` and verify:
- Intake form renders; "Start Assessment →" fails validation if any field is empty
- After valid intake, Question 1 appears with progress bar showing "Question 1 of 5"
- "Next →" button is disabled until an answer is selected
- Back button from Q1 returns to intake form with data preserved; question answers remain
- Completing all 5 questions reaches the Results page
- Score, tier, and next steps copy are immediately displayed
- "Start Over" returns to intake with clean state

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/app/layout.tsx
git commit -m "feat: wire multi-step assessment flow in root page"
```

---

## Task 11: QR Code Script

**Files:**
- Create: `scripts/generate-qr.js`

- [ ] **Step 1: Write the script**

```javascript
// scripts/generate-qr.js
const QRCode = require('qrcode')
const path = require('path')

const url = process.argv[2]

if (!url) {
  console.error('Error: URL argument is required')
  console.error('Usage: node scripts/generate-qr.js <deployed-url>')
  console.error('Example: node scripts/generate-qr.js https://your-app.vercel.app')
  process.exit(1)
}

const outputPath = path.join(__dirname, '..', 'qr-code.png')

QRCode.toFile(outputPath, url, { width: 400, margin: 2 }, (err) => {
  if (err) {
    console.error('Failed to generate QR code:', err.message)
    process.exit(1)
  }
  console.log(`QR code written to: ${outputPath}`)
  console.log(`Encodes URL: ${url}`)
})
```

- [ ] **Step 2: Test with no argument (should fail with usage message)**

```bash
node scripts/generate-qr.js; echo "Exit code: $?"
```

Expected output:
```
Error: URL argument is required
Usage: node scripts/generate-qr.js <deployed-url>
Example: node scripts/generate-qr.js https://your-app.vercel.app
Exit code: 1
```

- [ ] **Step 3: Test with a URL**

```bash
node scripts/generate-qr.js https://example.com && ls -lh qr-code.png
```

Expected output:
```
QR code written to: /path/to/project/qr-code.png
Encodes URL: https://example.com
-rw-r--r-- 1 user group  <size> <date> qr-code.png
```

- [ ] **Step 4: Verify qr-code.png is gitignored**

```bash
git status
```

Expected: `qr-code.png` does not appear in untracked files.

- [ ] **Step 5: Clean up and commit**

```bash
rm qr-code.png
git add scripts/generate-qr.js
git commit -m "feat: add QR code generation script"
```

---

## Task 12: Deploy to Vercel

- [ ] **Step 1: Push to GitHub**

Create a new repository on GitHub, then:

```bash
git remote add origin https://github.com/<your-org>/<your-repo>.git
git push -u origin main
```

- [ ] **Step 2: Import project into Vercel**

Go to vercel.com → "Add New → Project" → import the GitHub repository. Accept all defaults (Next.js is auto-detected).

- [ ] **Step 3: Add environment variables in Vercel**

In Vercel → Project Settings → Environment Variables, add:

| Name | Value |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Paste the full service account JSON as a raw string |
| `GOOGLE_SHEET_ID` | The sheet ID from the Google Sheets URL |

Verify the JSON is valid locally before setting:
```bash
echo $GOOGLE_SERVICE_ACCOUNT_JSON | node -e "process.stdin.resume(); let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{JSON.parse(d); console.log('Valid JSON')})"
```

Expected: `Valid JSON`

- [ ] **Step 4: Deploy and verify the API is live**

After Vercel deploys, run:

```bash
export URL=https://your-deployed-url.vercel.app

# Test startup guard (should get 200, not 500 — confirms env vars are set)
curl -s -o /dev/null -w "%{http_code}" "$URL/api/benchmark"
```

Expected: `200`

```bash
# Test a real submission
curl -s -X POST "$URL/api/submit" \
  -H "Content-Type: application/json" \
  -d '{"company_name":"Test Co","title":"CLO","company_size":"51\u2013200","q1":2,"q2":2,"q3":2,"q4":2,"q5":2}' \
  | python3 -m json.tool
```

Expected: JSON response with `score`, `tier`, and `benchmark` fields.

- [ ] **Step 5: Verify a row appears in Google Sheets**

Open the Google Sheet and confirm a new row was added with all 11 columns populated (timestamp through maturity_tier).

- [ ] **Step 6: Generate the QR code**

```bash
node scripts/generate-qr.js https://your-deployed-url.vercel.app
```

Expected:
```
QR code written to: /path/to/project/qr-code.png
Encodes URL: https://your-deployed-url.vercel.app
```

Deliver `qr-code.png` to the client for use in conference slides and printed materials.

---

## Final Checklist

- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Full user flow works end-to-end on the deployed URL
- [ ] A real submission appears in Google Sheets with all 11 columns populated
- [ ] Benchmark chart renders on the results page
- [ ] "Start Over" resets the full flow from Step 1
- [ ] QR code PNG generated and delivered to client

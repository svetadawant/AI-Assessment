// src/lib/types.ts

export type TierKey = 'access' | 'acceptance' | 'adoption' | 'action' | 'autonomy'

export type Step = 'intake' | 'assessment' | 'results'

export interface IntakeData {
  first_name: string
  last_name: string
  title: string
  company_name: string
}

export interface Answers {
  q1: number | null
  q2: number | null
  q3: number | null
  q4: number | null
  q5: number | null
  q6: number | null
  q7: number | null
  q8: number | null
  q9: number | null
}

// BenchmarkData values are numbers (floats, e.g. 33.3).
// The route handler serializes them with .toFixed(1) before including in the HTTP response.
export interface BenchmarkData {
  access: number
  acceptance: number
  adoption: number
  action: number
  autonomy: number
}

export interface SubmitResult {
  score: number
  tier: TierKey
  benchmark: BenchmarkData | null
  rowNumber: number | null
}

export type ApiStatus = 'idle' | 'pending' | 'success' | 'error'

export interface ApiState {
  status: ApiStatus
  result: SubmitResult | null
  errorCode: string | null
}

export interface SubmitPayload {
  first_name: string
  last_name: string
  title: string
  company_name: string
  q1: number
  q2: number
  q3: number
  q4: number
  q5: number
  q6: number
  q7: number
  q8: number
  q9: number
}

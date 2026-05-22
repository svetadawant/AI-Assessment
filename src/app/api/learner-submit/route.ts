import { NextRequest, NextResponse } from 'next/server'
import { validatePayload } from '@/lib/validate'
import { computeScore, assignTier, computeBenchmark } from '@/lib/scoring'
import { appendLearnerRow, readLearnerTierColumn } from '@/lib/sheets'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawCreds = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  const sheetId = process.env.GOOGLE_SHEET_ID
  if (!rawCreds || !sheetId) {
    console.error('[learner-submit] Server misconfiguration: missing env vars')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }
  try {
    JSON.parse(rawCreds)
  } catch {
    console.error('[learner-submit] Server misconfiguration: GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Missing or invalid field: first_name' }, { status: 400 })
  }

  const validationError = validatePayload(body)
  if (validationError) {
    return NextResponse.json(validationError, { status: 400 })
  }

  const data = body as {
    first_name: string; last_name: string; title: string
    q10?: string; q11?: string
    q1: number; q2: number; q3: number; q4: number; q5: number
    q6: number; q7: number; q8: number; q9: number
  }

  const score = computeScore(data)
  if (score < 9 || score > 36) {
    console.error(`[learner-submit] SCORE_OUT_OF_RANGE: computed score ${score}`)
    return NextResponse.json(
      { error: 'Score computation error', code: 'SCORE_OUT_OF_RANGE' },
      { status: 500 }
    )
  }
  const tier = assignTier(score)

  const timestamp = new Date().toISOString()
  const row = [
    timestamp,
    data.first_name.trim(),
    data.last_name.trim(),
    data.title.trim(),
    data.q1, data.q2, data.q3, data.q4, data.q5,
    data.q6, data.q7, data.q8, data.q9,
    score,
    tier,
    data.q10?.trim() ?? '',
    data.q11?.trim() ?? '',
  ]

  let rowNumber = 0
  try {
    rowNumber = await appendLearnerRow(row)
  } catch (err) {
    console.error('[learner-submit] Failed to append row:', err)
    return NextResponse.json(
      { error: 'Failed to save response', code: 'SHEET_WRITE_ERROR' },
      { status: 500 }
    )
  }

  let benchmark: ReturnType<typeof computeBenchmark> | null
  try {
    const tiers = await readLearnerTierColumn()
    benchmark = computeBenchmark(tiers)
  } catch (err) {
    console.error('[learner-submit] Failed to read benchmark:', err)
    benchmark = null
  }

  const serializedBenchmark = benchmark
    ? {
        access:     parseFloat(benchmark.access.toFixed(1)),
        acceptance: parseFloat(benchmark.acceptance.toFixed(1)),
        adoption:   parseFloat(benchmark.adoption.toFixed(1)),
        action:     parseFloat(benchmark.action.toFixed(1)),
        autonomy:   parseFloat(benchmark.autonomy.toFixed(1)),
      }
    : null

  return NextResponse.json({ score, tier, benchmark: serializedBenchmark, rowNumber })
}

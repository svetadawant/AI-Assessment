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
      access:     parseFloat(benchmark.access.toFixed(1)),
      acceptance: parseFloat(benchmark.acceptance.toFixed(1)),
      adoption:   parseFloat(benchmark.adoption.toFixed(1)),
      action:     parseFloat(benchmark.action.toFixed(1)),
      autonomy:   parseFloat(benchmark.autonomy.toFixed(1)),
    })
  } catch (err) {
    console.error('[benchmark] Failed to read benchmark data:', err)
    return NextResponse.json({ error: 'Failed to read benchmark data' }, { status: 500 })
  }
}

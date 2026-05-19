import { NextRequest, NextResponse } from 'next/server'
import { updateLearnerEmailForRow, appendLearnerEmailSignup } from '@/lib/sheets'
import type { TierKey } from '@/lib/types'

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { email, rowNumber, tier, score } = body as {
    email: string
    rowNumber?: number | null
    tier?: TierKey
    score?: number
  }

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  try {
    if (rowNumber && rowNumber > 0) {
      await updateLearnerEmailForRow(rowNumber, email.trim())
    } else {
      console.warn('[learner-email] No valid rowNumber, falling back to appendLearnerEmailSignup')
      await appendLearnerEmailSignup(email.trim(), tier ?? 'access', score ?? 0)
    }
  } catch (err) {
    console.error('[learner-email] Failed to save email:', err)
    return NextResponse.json({ error: 'Failed to save email' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

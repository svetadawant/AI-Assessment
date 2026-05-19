import { NextRequest, NextResponse } from 'next/server'
import { updateEmailForRow, appendEmailSignup } from '@/lib/sheets'
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
      // Happy path: write email into the submission row
      await updateEmailForRow(rowNumber, email.trim())
    } else {
      // Fallback: append a standalone row so we never lose the email
      console.warn('[email] No valid rowNumber, falling back to appendEmailSignup')
      await appendEmailSignup(email.trim(), tier ?? 'access', score ?? 0)
    }
  } catch (err) {
    console.error('[email] Failed to save email:', err)
    return NextResponse.json({ error: 'Failed to save email' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

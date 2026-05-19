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

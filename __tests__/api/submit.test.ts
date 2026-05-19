/**
 * @jest-environment node
 */
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

/**
 * @jest-environment node
 */
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

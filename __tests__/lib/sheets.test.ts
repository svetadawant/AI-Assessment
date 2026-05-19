jest.mock('googleapis')

import { appendRow, readTierColumn } from '@/lib/sheets'
import { google } from 'googleapis'

const mockAppend = jest.fn()
const mockGet = jest.fn()

const mockGoogleSheets = google as jest.Mocked<typeof google>
mockGoogleSheets.auth.GoogleAuth = jest.fn().mockImplementation(() => ({}))
mockGoogleSheets.sheets = jest.fn().mockReturnValue({
  spreadsheets: {
    values: {
      append: mockAppend,
      get: mockGet,
    },
  },
})

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
    const row = ['2026-01-01T00:00:00Z', 'Acme', 'CLO', '51–200', 2, 3, 1, 2, 2, 10, 'developing']
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

import { google } from 'googleapis'
import type { TierKey } from './types'

const VALID_TIERS: TierKey[] = ['access', 'acceptance', 'adoption', 'action', 'autonomy']
const TAB = 'Sheet1'
const EMAIL_TAB = 'Emails'

function getSheetClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  const sheetId = process.env.GOOGLE_SHEET_ID

  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not set')
  if (!sheetId) throw new Error('GOOGLE_SHEET_ID is not set')

  const credentials = JSON.parse(raw)

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  return { sheets: google.sheets({ version: 'v4', auth }), sheetId }
}

// Columns: timestamp | first_name | last_name | title | company_name
//          | q1–q9 (9 cols) | score | tier | email  →  A:Q (17 columns)
// Returns the 1-based row number of the appended row so email can be written later.
export async function appendRow(values: (string | number)[]): Promise<number> {
  const { sheets, sheetId } = getSheetClient()
  const res = await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${TAB}!A:Q`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [values] },
  })
  // updatedRange looks like "Sheet1!A5:Q5" — parse out the row number
  const updatedRange = res.data.updates?.updatedRange ?? ''
  console.log('[sheets] appendRow updatedRange:', updatedRange)
  const match = updatedRange.match(/(\d+)$/)
  return match ? parseInt(match[1], 10) : 0
}

// Writes the email address into column Q of an existing row.
export async function updateEmailForRow(rowNumber: number, email: string): Promise<void> {
  const { sheets, sheetId } = getSheetClient()
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${TAB}!Q${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[email]] },
  })
}

// Columns: timestamp | email | tier | score  →  Emails tab
export async function appendEmailSignup(email: string, tier: TierKey, score: number): Promise<void> {
  const { sheets, sheetId } = getSheetClient()
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${EMAIL_TAB}!A:D`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [[new Date().toISOString(), email, tier, score]] },
  })
}

export async function readTierColumn(): Promise<TierKey[]> {
  const { sheets, sheetId } = getSheetClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${TAB}!P2:P`,
  })

  const rows = res.data.values ?? []
  const result: TierKey[] = []

  for (const row of rows) {
    const value = row[0]
    if (!value) continue
    if ((VALID_TIERS as string[]).includes(value)) {
      result.push(value as TierKey)
    } else {
      console.warn(`[sheets] Unrecognized tier value: ${value}`)
    }
  }

  return result
}

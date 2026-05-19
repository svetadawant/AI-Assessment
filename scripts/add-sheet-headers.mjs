// Run once to write header row to the Google Sheet:
//   node scripts/add-sheet-headers.mjs

import { google } from 'googleapis'
import { readFileSync } from 'fs'

// Parse .env.local manually — handles values from `vercel env pull`
// Each line is KEY=value or KEY="value" where value may contain \n escape sequences
function loadEnv(file) {
  const env = {}
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const eq = line.indexOf('=')
    if (eq === -1 || line.startsWith('#')) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1)
    // Strip surrounding quotes, then unescape \n and \"
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1)
    }
    val = val.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
    env[key] = val
  }
  return env
}

const env = loadEnv('.env.local')
const raw = env.GOOGLE_SERVICE_ACCOUNT_JSON
const sheetId = env.GOOGLE_SHEET_ID

if (!raw || !sheetId) {
  console.error('Missing GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SHEET_ID in .env.local')
  process.exit(1)
}

// Avoid JSON.parse — the env file stores \n as two chars which breaks at top-level
// but is valid inside JSON strings (private_key). Extract only what we need.
const clientEmail = raw.match(/"client_email"\s*:\s*"([^"]+)"/)?.[1]
const rawPrivateKey = raw.match(/"private_key"\s*:\s*"((?:[^"\\]|\\.)*)"/)?.[1]
if (!clientEmail || !rawPrivateKey) {
  console.error('Could not extract client_email or private_key from credentials')
  process.exit(1)
}
const privateKey = rawPrivateKey.replace(/\\n/g, '\n')

const auth = new google.auth.JWT(
  clientEmail,
  undefined,
  privateKey,
  ['https://www.googleapis.com/auth/spreadsheets'],
)
const sheets = google.sheets({ version: 'v4', auth })

const HEADERS = [
  'Timestamp',
  'First Name',
  'Last Name',
  'Title',
  'Company',
  'Q1 – Tools Access',
  'Q2 – AI Governance',
  'Q3 – Acceptance / Belief',
  'Q4 – Adoption Rate',
  'Q5 – AI Learning',
  'Q6 – Leader Behavior',
  'Q7 – Worker Behavior',
  'Q8 – Team Collaboration',
  'Q9 – AI Agents',
  'Score',
  'Tier',
]

await sheets.spreadsheets.values.update({
  spreadsheetId: sheetId,
  range: 'Sheet1!A1:P1',
  valueInputOption: 'RAW',
  requestBody: { values: [HEADERS] },
})

console.log('Headers written to Sheet1!A1:P1')

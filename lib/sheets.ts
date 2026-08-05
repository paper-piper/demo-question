import { google } from 'googleapis';

/**
 * Google Sheets access via a service account — same pattern as the rest of the
 * system. The spreadsheet must be shared with the service account's email as
 * an Editor.
 *
 * Env vars (see .env.example):
 *   GOOGLE_SHEETS_SPREADSHEET_ID
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_PRIVATE_KEY            (with literal \n escapes)
 */

export const RESULTS_TAB = 'Results';
export const CORKBOARD_TAB = 'Corkboard';

export function sheetsConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY,
  );
}

function client() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

const spreadsheetId = () => process.env.GOOGLE_SHEETS_SPREADSHEET_ID as string;

/** Creates the tab and writes its header row if it does not exist yet. */
async function ensureTab(tab: string, header: string[]) {
  const sheets = client();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: spreadsheetId() });
  const exists = meta.data.sheets?.some((s) => s.properties?.title === tab);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId(),
      requestBody: { requests: [{ addSheet: { properties: { title: tab } } }] },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId(),
      range: `${tab}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [header] },
    });
  }
}

async function appendRow(tab: string, header: string[], row: (string | number | boolean)[]) {
  await ensureTab(tab, header);
  await client().spreadsheets.values.append({
    spreadsheetId: spreadsheetId(),
    range: `${tab}!A:Z`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });
}

const RESULTS_HEADER = ['timestamp', 'name', 'phone_number', 'unit_reached', 'passed'];
const CORKBOARD_HEADER = ['timestamp', 'name', 'initiative'];

export interface ResultRow {
  name: string;
  phoneNumber?: string;
  unitReached: number;
  passed: boolean;
}

export async function appendResult(row: ResultRow) {
  await appendRow(RESULTS_TAB, RESULTS_HEADER, [
    new Date().toISOString(),
    row.name,
    row.phoneNumber ?? '',
    row.unitReached,
    row.passed ? 'TRUE' : 'FALSE',
  ]);
}

export interface CorkboardRow {
  name: string;
  initiative: string;
}

export async function appendCorkboardNote(row: CorkboardRow) {
  await appendRow(CORKBOARD_TAB, CORKBOARD_HEADER, [
    new Date().toISOString(),
    row.name,
    row.initiative,
  ]);
}

export async function readCorkboardNotes(): Promise<CorkboardRow[]> {
  await ensureTab(CORKBOARD_TAB, CORKBOARD_HEADER);
  const res = await client().spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: `${CORKBOARD_TAB}!A2:C`,
  });
  const rows = res.data.values ?? [];
  return rows
    .filter((r) => r[1] || r[2])
    .map((r) => ({ name: String(r[1] ?? ''), initiative: String(r[2] ?? '') }))
    .reverse();
}

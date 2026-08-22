#!/usr/bin/env node
/**
 * Regenerates content/quiz-questions.generated.ts from the "Questions" tab
 * of the Google Sheet. Runs automatically as a "prebuild" step (see
 * package.json). If Sheets env vars aren't set, or the tab doesn't exist or
 * has no valid rows, it leaves the existing generated file untouched rather
 * than failing the build — local dev without Sheets configured still works.
 *
 * Sheet columns (header row, in this order):
 *   id | scenario | option_a | option_b | option_c | correct_option | hint
 *
 * - id: optional; defaults to "q1", "q2", ... by row order if blank.
 * - option_c: optional — leave blank for a two-option question.
 * - correct_option: "a", "b", or "c", matching one of the filled-in options.
 * - hint: shown when the learner picks wrong. Optional. Use Alt+Enter (or
 *   Cmd+Enter on Mac) inside the cell to start a new paragraph.
 */

import { google } from 'googleapis';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const QUESTIONS_TAB = 'Questions';
const OUT_FILE = path.join(process.cwd(), 'content', 'quiz-questions.generated.ts');

function sheetsConfigured() {
  return Boolean(
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY,
  );
}

async function main() {
  if (!sheetsConfigured()) {
    console.log('[sync-questions] Google Sheets not configured — keeping existing generated file.');
    return;
  }

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const exists = meta.data.sheets?.some((s) => s.properties?.title === QUESTIONS_TAB);
  if (!exists) {
    console.warn(`[sync-questions] No "${QUESTIONS_TAB}" tab found — keeping existing generated file.`);
    return;
  }

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${QUESTIONS_TAB}!A2:G`,
  });
  const rows = res.data.values ?? [];

  const questions = rows
    .filter((r) => (r[1] ?? '').toString().trim().length > 0)
    .map((r, i) => {
      const [id = '', scenario = '', optionA = '', optionB = '', optionC = '', correctRaw = '', hint = ''] =
        r.map((c) => (c ?? '').toString());

      const options = [
        { id: 'a', label: 'א.', text: optionA.trim() },
        { id: 'b', label: 'ב.', text: optionB.trim() },
        ...(optionC.trim() ? [{ id: 'c', label: 'ג.', text: optionC.trim() }] : []),
      ];

      const hintBlocks = hint
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((text) => ({ type: 'paragraph', text }));

      return {
        rowNumber: i + 2,
        id: id.trim() || `q${i + 1}`,
        scenario: scenario.trim(),
        options,
        correctOptionId: correctRaw.trim().toLowerCase(),
        constitutionExcerpt: hintBlocks,
      };
    });

  if (questions.length === 0) {
    console.warn('[sync-questions] Questions tab has no valid rows — keeping existing generated file.');
    return;
  }

  for (const q of questions) {
    if (!q.options.some((o) => o.id === q.correctOptionId)) {
      throw new Error(
        `[sync-questions] row ${q.rowNumber} (id "${q.id}"): correct_option "${q.correctOptionId}" ` +
          `doesn't match any filled-in option (a, b${q.options.length > 2 ? ', or c' : ''}).`,
      );
    }
  }

  const clean = questions.map(({ rowNumber, ...q }) => q);

  const body = `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Produced by scripts/sync-questions.mjs from the "${QUESTIONS_TAB}" tab of the
 * Google Sheet (GOOGLE_SHEETS_SPREADSHEET_ID). Runs automatically before
 * every build (see package.json "prebuild"). Edit questions by editing the
 * sheet and triggering a rebuild at /admin/rebuild — not by editing this file.
 */

import type { QuizQuestion } from './module';

export const QUIZ_QUESTIONS: QuizQuestion[] = ${JSON.stringify(clean, null, 2)};
`;

  await writeFile(OUT_FILE, body, 'utf-8');
  console.log(`[sync-questions] wrote ${clean.length} question(s) to ${OUT_FILE}`);
}

main().catch((err) => {
  console.error('[sync-questions] failed:', err);
  process.exit(1);
});

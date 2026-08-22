# Connecting the module to Google Sheets

Without this, the "מעורבות הורים" board and the completion list are cosmetic
only — nothing is saved anywhere, and nothing syncs between visitors. This
sets up the real thing: two tabs in a normal Google Sheet that any teacher can
open, filter, or download as `.xlsx`.

The code already knows how to create the tabs and write rows
([lib/sheets.ts](../lib/sheets.ts)) — it just needs three values it currently
doesn't have.

## 1. Create the spreadsheet

Create a new Google Sheet (any name, e.g. "דמוקרטי לב השרון — לומדה"). Leave it
empty — the app creates the `Results` and `Corkboard` tabs with headers the
first time each is written to.

Copy the spreadsheet ID out of its URL:

```
https://docs.google.com/spreadsheets/d/THIS_PART_IS_THE_ID/edit
```

That string is `GOOGLE_SHEETS_SPREADSHEET_ID`.

## 2. Create a service account (the "robot user")

This is a separate step from your personal Google login — it's a machine
identity your app authenticates as. No billing is required for this.

1. Go to [console.cloud.google.com](https://console.cloud.google.com/) and
   sign in with your normal Google account.
2. Top bar → project dropdown → **New Project**. Give it any name (e.g.
   "dls-module"). Create it, then make sure it's selected in the top bar.
3. Left sidebar (☰) → **APIs & Services** → **Library**. Search for
   **Google Sheets API** → **Enable**.
4. Left sidebar → **APIs & Services** → **Credentials**.
5. **Create Credentials** → **Service account**.
   - Name: anything (e.g. "sheets-writer").
   - Skip the optional role/access steps — click through to **Done**.
6. On the Credentials page, click the service account you just created.
7. Go to the **Keys** tab → **Add Key** → **Create new key** → **JSON** →
   **Create**. A `.json` file downloads — keep it private, don't commit it.

Open that JSON file. You need two fields from it:

- `"client_email"` → this is `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `"private_key"` → this is `GOOGLE_PRIVATE_KEY` (a long string starting
  with `-----BEGIN PRIVATE KEY-----`, containing literal `\n` sequences —
  copy it exactly as written in the JSON, quotes and all)

## 3. Share the sheet with the service account

Back in the Google Sheet from step 1: **Share** → paste the
`client_email` address from the JSON → set it to **Editor** → send/share.

Without this step every write will fail with a permissions error, even
with correct env vars.

## 4. Set the environment variables

Fill in [.env.example](../.env.example)'s three values in a real `.env.local`
file for local dev — this file is already git-ignored, which is exactly why
none of this reaches your host automatically from a `git push`. Every hosting
provider needs the same three values entered separately, in its own
dashboard:

```
GOOGLE_SHEETS_SPREADSHEET_ID=<from step 1>
GOOGLE_SERVICE_ACCOUNT_EMAIL=<client_email from the JSON>
GOOGLE_PRIVATE_KEY="<private_key from the JSON, quotes included>"
```

**On Netlify:** Site configuration → **Environment variables** → **Add a
variable** → **Add a single variable**, three times, one per name above.
Paste `GOOGLE_PRIVATE_KEY`'s value exactly as it appears in the JSON,
including the `-----BEGIN PRIVATE KEY-----` / `-----END PRIVATE KEY-----`
lines and the literal `\n` sequences — don't retype it as real newlines.
After adding them, trigger a new deploy (Deploys → Trigger deploy → Deploy
site) — Netlify only injects env vars into builds that start after they were
saved; the currently-live deploy won't pick them up on its own.

**On Vercel:** Project → Settings → Environment Variables, same three
values, then redeploy.

Restart the dev server locally (or redeploy on your host) after setting
these — `sheetsConfigured()` only checks `process.env` at request time, so a
running server needs a restart/redeploy to pick up new values.

## Verifying it worked

- Submit the parent-involvement note ("מעורבות הורים") from two different
  browsers/devices — the second one should see the first one's note after a
  refresh.
- Complete the module and confirm the declaration — a row should appear in
  the `Results` tab within a few seconds.
- If nothing appears, check the server logs for `[complete] failed to write
  to sheet` or `[corkboard] failed to write to sheet` — that error is usually
  the sharing step (2) being missed.

## What gets recorded

- **`Results` tab**: `timestamp`, `name`, `phone_number` — one row per
  completed run. Reaching this screen already means every activity was
  answered correctly, so there's no separate "passed" or score column.
- **`Corkboard` tab**: `timestamp`, `name`, `initiative` — one row per note
  pinned to the parent-involvement board.

## Editing the quiz questions (no code required)

The three dilemma questions in unit 2 live in a `Questions` tab in the same
spreadsheet, instead of in code. Unlike `Results` and `Corkboard`, this tab is
**not** created automatically — add it yourself, named exactly `Questions`,
with this header row and one row per question below it:

| id | scenario | option_a | option_b | option_c | correct_option | hint |
|----|----------|----------|----------|----------|-----------------|------|

- **id** — optional. A short label like `u2-q1`. Leave blank and it'll be
  numbered automatically by row order.
- **scenario** — the question text.
- **`option_a` / `option_b` / `option_c`** — the answer choices. Leave
  `option_c` blank for a two-option question.
- **correct_option** — `a`, `b`, or `c`, matching one of the filled-in
  options.
- **hint** — shown to whoever picks a wrong answer. Optional. Press
  Alt+Enter (⌘+Enter on Mac) inside the cell to start a new paragraph.

Editing the sheet does **not** change the live site by itself — the site is
static and only reads the sheet at build time. After editing, publish the
change from the secret link:

```
https://<your-site>/admin/rebuild?key=<REBUILD_SECRET>
```

Send that link (with the real key filled in) to whoever edits the questions.
Opening it shows a button — clicking it triggers a rebuild, and the new
questions go live within a few minutes. The link only works because the `key`
matches the `REBUILD_SECRET` environment variable set on the host; keep the
link itself private, the same as a password.

### One-time setup for this feature (developer)

1. Add the `Questions` tab as described above (start by copying the three
   existing questions out of
   [content/quiz-questions.generated.ts](../content/quiz-questions.generated.ts)
   so nothing regresses on the first sync).
2. Set `REBUILD_SECRET` in your host's environment variables to any random
   string — this is the `key` value editors put in their link.
3. In Netlify: **Site configuration → Build & deploy → Build hooks → Add
   build hook**. Copy the generated URL into `NETLIFY_BUILD_HOOK_URL`.
4. Redeploy once so both variables take effect.

If `GOOGLE_SHEETS_SPREADSHEET_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` /
`GOOGLE_PRIVATE_KEY` aren't set, or the `Questions` tab doesn't exist yet, the
build silently keeps using the questions already checked into
`content/quiz-questions.generated.ts` — it never breaks the build over a
missing sheet. It **does** fail the build if a row's `correct_option` doesn't
match any of that row's filled-in options, so a typo in the sheet gets
caught instead of silently shipping a broken quiz.

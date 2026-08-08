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
file (for local dev — this file is already git-ignored) and in your hosting
provider's environment variable settings (for production — e.g. Vercel
project → Settings → Environment Variables):

```
GOOGLE_SHEETS_SPREADSHEET_ID=<from step 1>
GOOGLE_SERVICE_ACCOUNT_EMAIL=<client_email from the JSON>
GOOGLE_PRIVATE_KEY="<private_key from the JSON, quotes included>"
```

Restart the dev server (or redeploy) after setting these — `sheetsConfigured()`
only checks `process.env` at request time, so a running server needs a
restart to pick up new values.

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

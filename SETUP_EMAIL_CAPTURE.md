# Set up email capture → Google Sheet

This connects the Transparency Scorecard's email gateway to your Google Sheet, so
every submission appends a row. It takes about 3 minutes. You can do it yourself,
hand it to a teammate, or paste it into **Claude for Chrome** to run in your browser.

**Reference values**
- Live site: https://nonprofit-transparency-scorecard.vercel.app
- Target sheet: https://docs.google.com/spreadsheets/d/130ovoHHtnqMaGoKpR_0PAahw8pF558NLvfnyXJ1TE9A/edit
- Vercel project: `nonprofit-transparency-scorecard`
- Env var to set: `SHEETS_WEBHOOK_URL` (plus optional `SHEETS_WEBHOOK_TOKEN`)

---

## Step 1 — Add the Apps Script to the sheet

1. Open the sheet (link above).
2. **Extensions → Apps Script.**
3. Delete any sample code and paste in the entire script from the **Apps Script code** section at the bottom of this file.
4. *(Optional but recommended)* Set a secret: change `var TOKEN = "";` to something like `var TOKEN = "meek-2026-xYz";`. If you do, use the exact same value in Step 2.
5. Click **Deploy → New deployment**.
6. Click the gear ⚙ next to "Select type" → choose **Web app**.
   - **Description:** `scorecard capture`
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
7. Click **Deploy**, then **Authorize access** and approve the Google permission prompt (choose your account → Advanced → "Go to … (unsafe)" → Allow — this is normal for your own script).
8. Copy the **Web app URL**. It ends in `/exec`. Keep it for Step 2.

> Quick check: pasting that `/exec` URL into a browser should show `{"ok":true,"service":"scorecard-capture"}`.

---

## Step 2 — Add the URL to Vercel

1. Go to the Vercel project **`nonprofit-transparency-scorecard`** → **Settings → Environment Variables**.
2. Add a variable:
   - **Key:** `SHEETS_WEBHOOK_URL`
   - **Value:** the `/exec` URL from Step 1
   - **Environments:** check **Production** (all environments is fine too)
3. *(Only if you set a `TOKEN` in Step 1)* add a second variable:
   - **Key:** `SHEETS_WEBHOOK_TOKEN`
   - **Value:** the same secret string
4. **Save.**

---

## Step 3 — Redeploy so the variables take effect

Environment-variable changes only apply to new deployments.

1. Vercel project → **Deployments**.
2. On the most recent deployment, click the **⋯** menu → **Redeploy** → confirm.

---

## Step 4 — Test it end to end

1. Open https://nonprofit-transparency-scorecard.vercel.app
2. Enter a test email (e.g. `test@example.com`) and click **Enter the experience**.
3. Open the Google Sheet — a new row should appear in an **Emails** tab:
   `Timestamp | Email | Source`.

If the row appears, capture is live. If not, see Troubleshooting.

---

## Troubleshooting

- **No row appears.** Re-open the `/exec` URL in a browser — it should return the JSON above. If it 404s, the web app wasn't deployed; redo Step 1.6–1.8. Make sure **Who has access = Anyone**.
- **Changed the script after deploying?** Apps Script keeps the old code live until you **Deploy → Manage deployments → edit → New version**. Redeploy a new version after any edit.
- **Set a `TOKEN` but rows don't write.** The `SHEETS_WEBHOOK_TOKEN` value in Vercel must match `TOKEN` in the script exactly, and you must redeploy Vercel (Step 3) after changing it.
- **Still stuck.** The site never blocks visitors on a capture failure — people still get through the scorecard; only the email isn't recorded — so there's no user-facing outage while you sort it out.

---

## Apps Script code

Paste everything below into the Apps Script editor (Step 1).

```javascript
/**
 * Google Apps Script — email capture sink for the Transparency Scorecard.
 * Appends Timestamp | Email | Source rows to this spreadsheet.
 */

// Must match the SHEETS_WEBHOOK_TOKEN env var in Vercel. Leave "" to accept all.
var TOKEN = "";

// Which tab to write to. Created automatically if it doesn't exist.
var SHEET_NAME = "Emails";

function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }

    if (TOKEN && data.token !== TOKEN) {
      return json({ ok: false, error: "unauthorized" });
    }

    var email = String(data.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return json({ ok: false, error: "invalid email" });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp", "Email", "Source"]);
    }

    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      email,
      data.source || "transparency-scorecard",
    ]);

    return json({ ok: true, stored: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// A simple GET so you can confirm the deployment is reachable in a browser.
function doGet() {
  return json({ ok: true, service: "scorecard-capture" });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
```

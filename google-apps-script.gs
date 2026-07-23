/**
 * Google Apps Script — email capture sink for the Transparency Scorecard.
 *
 * SETUP (about 3 minutes):
 *  1. Open your Google Sheet:
 *     https://docs.google.com/spreadsheets/d/130ovoHHtnqMaGoKpR_0PAahw8pF558NLvfnyXJ1TE9A/edit
 *  2. Extensions -> Apps Script. Delete any sample code and paste this whole file.
 *  3. (Optional but recommended) set a secret below and use the SAME value for the
 *     SHEETS_WEBHOOK_TOKEN environment variable in Vercel. Leave "" to disable the check.
 *  4. Click Deploy -> New deployment -> type: Web app.
 *       - Description: "scorecard capture"
 *       - Execute as: Me
 *       - Who has access: Anyone
 *     Deploy, authorize when prompted, and copy the Web app URL (ends in /exec).
 *  5. In Vercel -> Project -> Settings -> Environment Variables, add:
 *       SHEETS_WEBHOOK_URL   = the /exec URL you copied
 *       SHEETS_WEBHOOK_TOKEN = the same secret (only if you set one below)
 *     Then redeploy the project.
 *
 * The first time the script runs it writes a header row automatically.
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

// Vercel serverless function (Node.js runtime).
// Receives an email from the scorecard gateway, validates it server-side, and
// forwards it to whichever capture destinations are configured. Any subset may
// be enabled at once; the email is "stored" if at least one succeeds.
//
// Configure destinations with environment variables in the Vercel project
// (Settings -> Environment Variables), then redeploy:
//
//   Google Sheet (via an Apps Script web app):
//     SHEETS_WEBHOOK_URL     the Apps Script /exec URL (see google-apps-script.gs)
//     SHEETS_WEBHOOK_TOKEN   optional shared secret; must match the script's TOKEN
//
//   HubSpot (via its public Forms API — non-secret IDs):
//     HUBSPOT_PORTAL_ID
//     HUBSPOT_FORM_GUID
//
// With none set, the function still accepts the request (so the experience works
// immediately) but reports stored:false and logs a warning.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isValidEmail(email) {
  return (
    typeof email === "string" &&
    email.length <= 254 &&
    EMAIL_RE.test(email) &&
    !email.includes("..")
  );
}

// POST with a timeout so a slow destination can't hang the function.
async function postJSON(url, body, ms = 6000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function sendToSheet(email, source) {
  const url = process.env.SHEETS_WEBHOOK_URL;
  if (!url) return null; // not configured
  try {
    const res = await postJSON(url, {
      email,
      source: source || "transparency-scorecard",
      timestamp: new Date().toISOString(),
      token: process.env.SHEETS_WEBHOOK_TOKEN || "",
    });
    if (!res.ok) {
      console.error("capture: Google Sheet webhook responded", res.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error("capture: Google Sheet webhook failed", err && err.name);
    return false;
  }
}

async function sendToHubSpot(email, referer) {
  const portalId = process.env.HUBSPOT_PORTAL_ID;
  const formGuid = process.env.HUBSPOT_FORM_GUID;
  if (!portalId || !formGuid) return null; // not configured
  const endpoint =
    `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formGuid}`;
  try {
    const res = await postJSON(endpoint, {
      fields: [{ objectTypeId: "0-1", name: "email", value: email }],
      context: {
        pageName: "Nonprofit Transparency Scorecard",
        pageUri: referer || "transparency-scorecard",
      },
    });
    if (!res.ok) {
      console.error("capture: HubSpot rejected submission", res.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error("capture: HubSpot request failed", err && err.name);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  // req.body may arrive parsed or as a raw string depending on content-type.
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const email = String(body.email || "").trim().toLowerCase();
  if (!isValidEmail(email)) {
    return res.status(400).json({ ok: false, error: "Invalid email address" });
  }

  // Fan out to every configured destination concurrently.
  const [sheet, hubspot] = await Promise.all([
    sendToSheet(email, body.source),
    sendToHubSpot(email, req.headers.referer),
  ]);

  const results = { sheet, hubspot };
  const configured = Object.values(results).filter((r) => r !== null);
  const stored = configured.some((r) => r === true);

  if (configured.length === 0) {
    console.warn("capture: no destination configured — email accepted but not persisted");
    return res
      .status(200)
      .json({ ok: true, stored: false, note: "capture-backend-unconfigured" });
  }

  if (!stored) {
    // Every configured destination failed.
    return res.status(502).json({ ok: false, stored: false, results });
  }

  return res.status(200).json({ ok: true, stored: true, results });
}

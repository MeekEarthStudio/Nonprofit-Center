// Vercel serverless function (Node.js runtime).
// Receives an email from the scorecard gateway, validates it server-side, and
// forwards it to HubSpot's public Forms API when the portal is configured.
//
// Configure persistence by setting two environment variables in the Vercel
// project (Settings -> Environment Variables). Both are non-secret IDs from the
// HubSpot form you want submissions to land in:
//   HUBSPOT_PORTAL_ID   e.g. 12345678
//   HUBSPOT_FORM_GUID   e.g. 1a2b3c4d-5e6f-7890-abcd-ef1234567890
//
// With neither set, the function still accepts the request (so the experience
// works immediately after deploy) but reports stored:false and logs a warning.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isValidEmail(email) {
  return (
    typeof email === "string" &&
    email.length <= 254 &&
    EMAIL_RE.test(email) &&
    !email.includes("..")
  );
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

  const portalId = process.env.HUBSPOT_PORTAL_ID;
  const formGuid = process.env.HUBSPOT_FORM_GUID;

  if (portalId && formGuid) {
    const endpoint =
      `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formGuid}`;
    const payload = {
      fields: [{ objectTypeId: "0-1", name: "email", value: email }],
      context: {
        pageName: "Nonprofit Transparency Scorecard",
        pageUri: req.headers.referer || "transparency-scorecard",
      },
    };
    try {
      const hs = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!hs.ok) {
        const detail = await hs.text().catch(() => "");
        console.error("capture: HubSpot rejected submission", hs.status, detail);
        return res
          .status(502)
          .json({ ok: false, stored: false, error: "Capture service error" });
      }
      return res.status(200).json({ ok: true, stored: true });
    } catch (err) {
      console.error("capture: HubSpot request failed", err);
      return res
        .status(502)
        .json({ ok: false, stored: false, error: "Capture service unreachable" });
    }
  }

  console.warn(
    "capture: HUBSPOT_PORTAL_ID / HUBSPOT_FORM_GUID not set — email accepted but not persisted"
  );
  return res
    .status(200)
    .json({ ok: true, stored: false, note: "capture-backend-unconfigured" });
}

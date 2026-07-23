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
// Spam protection (durable per-IP rate limiting via Upstash Redis) activates only
// when these are set — create a free Upstash Redis database and add:
//     UPSTASH_REDIS_REST_URL
//     UPSTASH_REDIS_REST_TOKEN
// Unconfigured, or if Redis is unreachable, the function fails open (allows the
// request) so a store outage never blocks a real signup.
//
// Hardening (see remediation plan H-1 / M-1 / M-2 / M-3):
//   - strict email validation + CSV/formula-injection escaping for the Sheet
//   - server-side honeypot enforcement
//   - Origin allowlist so other sites can't POST into the contact list
//   - two-tier rate limits (generous per-IP + stricter failure-keyed)

// Deliberately stricter than RFC 5321: this is a marketing list, not a mail
// server, so false negatives on exotic addresses are acceptable. Excludes
// '=', quotes, parentheses and whitespace, closing the formula-injection vector
// in the local-part at the source.
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,24}$/;

function isValidEmail(email) {
  const s = String(email ?? "").trim();
  return s.length >= 6 && s.length <= 254 && EMAIL_RE.test(s);
}

// Google Sheets / Excel evaluate a cell beginning with = + - @ (or certain
// control chars) as a formula. Prefix a single quote so the value is stored as
// literal text. Applied to EVERY field written to the Sheet.
const SHEET_UNSAFE = /^[=+\-@\t\r]/;
function sanitizeForSheet(value, maxLen = 320) {
  const s = String(value ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, maxLen);
  return SHEET_UNSAFE.test(s) ? "'" + s : s;
}

// Never write a client-supplied source string unmodified.
const ALLOWED_SOURCES = new Set(["scorecard-gate", "scorecard-results"]);

// Only these origins may POST from a browser. Same-origin form posts may omit
// Origin; unknown origins are rejected. Add custom domains here when they go
// live (e.g. https://meekearthstudio.net / https://www.meekearthstudio.net).
const ALLOWED_ORIGINS = new Set([
  "https://nonprofit-transparency-scorecard.vercel.app",
]);

// Rate limits (durable, via Upstash Redis; active only when configured).
const RATE_LIMIT = 30;        // generous primary path — comfortably covers a
const RATE_WINDOW = "10 m";   // NATed office / conference / CGNAT network
const FAIL_LIMIT = 10;        // stricter tier keyed on bad/suspicious requests
const FAIL_WINDOW = "10 m";   // (abuse is characterised by failures)

let limitersPromise;
function getLimiters() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null; // not configured — rate limiting disabled
  }
  if (!limitersPromise) {
    limitersPromise = (async () => {
      const [{ Ratelimit }, { Redis }] = await Promise.all([
        import("@upstash/ratelimit"),
        import("@upstash/redis"),
      ]);
      const redis = Redis.fromEnv();
      return {
        main: new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(RATE_LIMIT, RATE_WINDOW),
          prefix: "scorecard-capture",
          analytics: false,
        }),
        fail: new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(FAIL_LIMIT, FAIL_WINDOW),
          prefix: "scorecard-capture-fail",
          analytics: false,
        }),
      };
    })();
  }
  return limitersPromise;
}

function clientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length) return xff.split(",")[0].trim();
  return req.headers["x-real-ip"] || "unknown";
}

// Record a suspicious request (bad origin, invalid email, honeypot hit) against
// the stricter counter. Returns true once the IP should be hard-throttled.
async function tooManyFailures(limiters, ip) {
  if (!limiters) return false;
  try {
    const { success } = await limiters.fail.limit(ip);
    return !success;
  } catch {
    return false; // fail open
  }
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
      // Every field is escaped so nothing lands in the Sheet as a live formula.
      email: sanitizeForSheet(email),
      source: sanitizeForSheet(source),
      timestamp: sanitizeForSheet(new Date().toISOString()),
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
    // HubSpot is not a spreadsheet — send the validated address as-is.
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
  // ---- CORS / Origin (M-2) -------------------------------------------------
  const origin = req.headers.origin;
  const originAllowed = !origin || ALLOWED_ORIGINS.has(origin);
  if (origin && originAllowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") {
    return res.status(originAllowed ? 204 : 403).end();
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const ip = clientIp(req);
  const limiters = getLimiters();
  const resolved = limiters ? await limiters : null;

  // A browser cross-origin POST from an unknown site — refuse and count it.
  if (!originAllowed) {
    const block = await tooManyFailures(resolved, ip);
    return res.status(block ? 429 : 403).json({ ok: false, error: "Forbidden" });
  }

  // ---- Primary per-IP rate limit (M-3) -------------------------------------
  // Runs before any third-party write, so throttled requests cost no quota.
  // Fails open if the store is unreachable so real signups are never blocked.
  if (resolved) {
    try {
      const { success, limit, remaining, reset } = await resolved.main.limit(ip);
      res.setHeader("X-RateLimit-Limit", String(limit));
      res.setHeader("X-RateLimit-Remaining", String(Math.max(0, remaining)));
      if (!success) {
        const retry = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
        res.setHeader("Retry-After", String(retry));
        return res
          .status(429)
          .json({ ok: false, error: "Too many requests. Please try again shortly." });
      }
    } catch (err) {
      console.error("capture: rate limiter unavailable, allowing request", err && err.name);
    }
  }

  // ---- Parse body ----------------------------------------------------------
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  // ---- Honeypot (M-1) ------------------------------------------------------
  // Real users never see this field. Any value means a bot: silently drop it,
  // quietly count the failure, and return a success-shaped response so the
  // scraper gets no signal about which requests were rejected.
  if (String(body.company_website ?? "").trim() !== "") {
    if (resolved) { try { await resolved.fail.limit(ip); } catch {} }
    return res.status(200).json({ ok: true });
  }

  // ---- Validate (H-1) ------------------------------------------------------
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!isValidEmail(email)) {
    const block = await tooManyFailures(resolved, ip);
    return res
      .status(block ? 429 : 400)
      .json({ ok: false, error: "Invalid email address" });
  }

  // Client-supplied source is never trusted — snap to an allowlist.
  const source = ALLOWED_SOURCES.has(body.source) ? body.source : "scorecard-gate";

  // ---- Fan out to every configured destination concurrently ---------------
  const [sheet, hubspot] = await Promise.all([
    sendToSheet(email, source),
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
    return res.status(502).json({ ok: false, stored: false, results });
  }

  return res.status(200).json({ ok: true, stored: true, results });
}

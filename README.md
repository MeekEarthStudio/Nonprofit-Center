# Nonprofit Transparency Scorecard

An interactive, single-page web app that walks a visitor through the proven data
from Meek Earth Studio's **Deanwood benefit-concert prototype** (Jan 17, 2026, with
STEP DC), then scores their own ticketed events against ten levers of donor
transparency.

The front end is a static site — `index.html` with `styles.css` and `app.js` —
plus one serverless function at `api/capture.js`. No build step, no framework, no
dependencies. Open `index.html` in any browser to preview; deploy the folder to
Vercel (zero-config) to activate email capture.

**Live:** https://nonprofit-transparency-scorecard.vercel.app/

## Files

| Path | Purpose |
|---|---|
| `index.html` | Markup for the gateway, the presentation slides, and the scorecard |
| `styles.css` | The green/light design system |
| `app.js` | All interactivity — gateway, charts, claim filters, plays, scoring, result |
| `api/capture.js` | Vercel serverless function that validates + stores the captured email |

## Email capture

On submit, the gateway POSTs the address to `/api/capture`. That function validates
server-side and fans out to whichever destinations are configured via environment
variables in the Vercel project (Settings → Environment Variables). Any subset can
be enabled at once; the email counts as stored if at least one succeeds.

**Google Sheet (via an Apps Script web app):**

- `SHEETS_WEBHOOK_URL` — the Apps Script `/exec` URL
- `SHEETS_WEBHOOK_TOKEN` — optional shared secret (must match the script)

Setup: open `google-apps-script.gs`, follow its header instructions to paste the
script into the target sheet, deploy it as a web app, then set the two variables
above and redeploy. Rows land as `Timestamp | Email | Source`.

**HubSpot (via its public Forms API — non-secret IDs):**

- `HUBSPOT_PORTAL_ID`
- `HUBSPOT_FORM_GUID`

With none set, the function still accepts the request (so the experience works
immediately after deploy) and reports `stored:false`. The gateway degrades
gracefully: a capture outage — or opening `index.html` directly over `file://` —
still lets the visitor through to the content. The gate is lead capture, not
authentication.

## Spam protection (rate limiting)

`/api/capture` enforces durable, two-tier per-IP rate limits backed by Upstash
Redis: a **generous primary limit** (30 requests / 10 min, sliding window) sized
so a NATed office or conference network isn't locked out, plus a **stricter
failure-keyed limit** (10 bad/suspicious requests — invalid emails, honeypot
hits, rejected origins — / 10 min) since abuse is characterised by failures. The
limiter runs before any Sheet/HubSpot write, so throttled requests cost no
third-party quota. It activates only when these env vars are set — create a free
Upstash Redis database and add them to the Vercel project:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Over the limit returns `429` with a `Retry-After` header; the gateway shows a
"please wait a moment" message and doesn't open the app. If the vars are unset —
or Redis is ever unreachable — the limiter **fails open** (allows the request) so
a store outage never blocks a real signup.

## Flow

1. **Email gateway** — a valid email address is required to enter. Validation is
   client-side only; the address never leaves the browser. It's used to personalize
   the final scorecard ("Prepared for …").
2. **Interactive data breakdown** of the two source documents:
   - Verified ledger (animated metric counters)
   - Premium-conversion vs. benchmark bar chart with the 95% confidence band
   - "Where every dollar went" proportional revenue-split chart
   - Claim classification (Proven / Supported inference / Not supported) with filters
   - The proven, investor-safe logic chain
   - The nine fundraising plays (expandable cards)
3. **Interactive scorecard** — ten criteria scored 0/1/2 with a live running total.
4. **Result card** — score out of 20, rating band (Transparency Leader / Building
   Trust / Highest Upside), a per-criterion breakdown, prioritized next moves, and a
   comparison against how the prototype itself would score (13/20). Print/save enabled.

## Design

- **Theme:** light, green palette (brand accent `#8BC53F` from the source documents).
- **Accessibility:** charts are direct-labeled so identity is never color-alone;
  keyboard navigation (`←` / `→`), focus-visible outlines, and live-region status
  messages are included.

## Source material

Content is drawn from two internal Meek Earth Studio documents: *Deanwood Prototype —
Proven Metrics & Validated Logic* and *The Nonprofit Event Fundraising Playbook*. Per
those documents' own honesty notes, the evidence base is a single 54-buyer event; the
scorecard is a structured self-audit, not a revenue guarantee.

_Music for the meek._

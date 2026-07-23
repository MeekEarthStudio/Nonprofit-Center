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
server-side and forwards to HubSpot's public Forms API when these (non-secret)
environment variables are set in the Vercel project:

- `HUBSPOT_PORTAL_ID`
- `HUBSPOT_FORM_GUID`

With neither set, the function still accepts the request (so the experience works
immediately after deploy) and reports `stored:false`. The gateway degrades
gracefully: a capture outage — or opening `index.html` directly over `file://` —
still lets the visitor through to the content. The gate is lead capture, not
authentication.

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

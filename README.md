# Nonprofit Transparency Scorecard

An interactive, single-page web app that walks a visitor through the proven data
from Meek Earth Studio's **Deanwood benefit-concert prototype** (Jan 17, 2026, with
STEP DC), then scores their own ticketed events against ten levers of donor
transparency.

Everything lives in **`index.html`** — no build step, no dependencies, no backend.
Open it in any modern browser.

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

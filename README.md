# The Transparency Vault

A single-page web experience from **Meek Earth Studio PBC** that opens with a
vault-door animation and walks a visitor through the case for nonprofit
transparency — the 2026 research (with inline citations), the concrete
practices, and the Deanwood benefit-concert prototype that put them to work.

The site is fully static — `index.html`, `styles.css`, `app.js`, and one logo
image. No build step, no framework, no serverless functions, and **no data
collection**: there is no email gate, no analytics beacon, no backend. Open
`index.html` in any browser to preview; deploy the folder to Vercel
(zero-config) to publish.

**Live:** https://nonprofit-transparency-scorecard.vercel.app/

## The journey

1. **The vault** — a full-screen vault door with a single **Open** button. The
   wheel spins, the lugs retract, the door swings, and the page unlocks.
2. **Reasons to be more transparent** — the 2026 donor-trust evidence: the
   Give.org trust gap (67.7% say trust is essential vs. 18.3% high trust), the
   Candid Seal contribution lifts (+62% across 148,786 charities; +61% for
   small nonprofits), earlier GuideStar/Candid research (+53%), Independent
   Sector's sector-trust findings, and platform fee-transparency expectations.
3. **Methods to be more transparent** — six practices, each with an explicit
   named citation rendered at full body-copy size (GAAP/ASC 958 reporting,
   Form 990 discipline, Candid Seals, dashboards/impact reports,
   conflict-of-interest enforcement, point-of-donation fee disclosure).
4. **The Deanwood concert** — the Jan 17, 2026 benefit in Deanwood, DC for
   STEP DC (artist: Grace J. Reid): 54 tickets, 70.37% premium conversion
   against a 20–30% benchmark, $3,615 gross, $1,890 delivered to the
   nonprofit — with the honesty note that it's a single 54-buyer prototype —
   plus the embedded concert video.
5. **Meek Earth Studio PBC** — the studio logo and the thirds model: ⅓ of
   revenue to the artists, ⅓ to the nonprofit, ⅓ to the studio, disclosed to
   every buyer at checkout.
6. **Contact** — cbreid3@meekearthstudio.net to explore a partnership.

## Files

| Path | Purpose |
|---|---|
| `index.html` | All markup for the vault and the five journey sections |
| `styles.css` | The green/light design system, vault animation, print styles |
| `app.js` | Vault choreography, scroll reveals, animated counters, nav highlighting |
| `assets/meek-earth-logo.jpeg` | The Meek Earth Studio logo (served from this repo at a pinned commit) |
| `vercel.json` | Security headers (CSP allows the YouTube-nocookie embed) |

## Design notes

- **Theme:** light, green palette (brand accent `#8BC53F`).
- **Citations as credibility:** every research claim carries its source inline
  at the same font size as body copy — never fine print.
- **Video:** embedded via `youtube-nocookie.com` (privacy-enhanced mode); the
  CSP's `frame-src` allows only YouTube's embed origins.
- **Accessibility:** `prefers-reduced-motion` skips the vault and counter
  animations; keyboard focus outlines; the thirds graphic has a text
  alternative. Printing hides the vault and expands citation URLs.

## Sources

Research citations are compiled in the page itself; figures for the Deanwood
prototype come from internal Meek Earth Studio documents (*Deanwood Prototype —
Proven Metrics & Validated Logic* and *The Nonprofit Event Fundraising
Playbook*). Per those documents' own honesty notes, the evidence base is a
single 54-buyer event.

_Music for the meek._

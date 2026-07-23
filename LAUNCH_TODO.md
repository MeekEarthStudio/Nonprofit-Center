# Transparency Scorecard — What's Left To Do

**Live:** https://nonprofit-transparency-scorecard.vercel.app
**As of:** July 23, 2026

Everything code-side is built, deployed, and committed. The items below are the
ones that need **you** — a dashboard, an account you own, a decision, or counsel.

---

## 🔴 Before the LinkedIn post (blockers)

- [ ] **M-5 — Delete stale preview deployments.** Vercel → Deployments → delete
  every build older than the corrected copy (the old one still claims "nothing is
  sent, stored, or shared"). Then Settings → Deployment Protection → turn on
  **Vercel Authentication for Preview** so future previews aren't public. Finally
  search `site:vercel.app nonprofit-transparency-scorecard` and request removal of
  anything indexed.
- [ ] **Run the Verify checks against production** (from the remediation doc): the
  H-1 / M-1 / M-2 `curl` blocks, then open the Google Sheet and confirm **no cell
  renders as a formula or link**. *(I couldn't run these from my sandbox — its
  network blocks Vercel — so this pass is yours.)*

---

## ⚙️ Backend activation (capture + spam protection are dormant until this is done)

Both use the step-by-step in **`SETUP_EMAIL_CAPTURE.md`** (hand it to Claude for Chrome).

- [ ] **Part A — Google Sheet capture.** Paste the Apps Script into your sheet,
  deploy it as a web app, set `SHEETS_WEBHOOK_URL` (+ optional
  `SHEETS_WEBHOOK_TOKEN`) in Vercel, and redeploy. *(Until this is set, emails are
  accepted but not stored.)*
- [ ] **Part B — Upstash rate limiting.** Create a free Upstash Redis DB, set
  `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in Vercel, and redeploy.
  *(Until this is set, the limiter is off / fails open — M-3 isn't actually
  enforcing yet.)*
- [ ] *(Optional)* **HubSpot** as a second destination: set `HUBSPOT_PORTAL_ID` +
  `HUBSPOT_FORM_GUID` and redeploy. Works alongside the Sheet.

---

## 🧭 Decisions (tell me which way to go and I'll build it)

- [ ] **M-4 — Double opt-in.** Not built. Options: (a) I implement it —
  pending/confirmed status, signed single-use token, one confirmation email,
  30-day purge of unconfirmed; or (b) accept as a **documented known risk** for
  launch. Needs a decision either way.
- [ ] **M-6 — Unbundled consent ("skip — just show me the scorecard" link).** Not
  built. A cleaner GDPR posture but costs some capture rate. Decide whether you
  want it before or after counsel weighs in.

---

## 📋 Legal / content (yours to supply)

- [ ] **M-6 — Add your postal address** to the "Who we are" section of
  `privacy.html`. I left it out rather than invent one — GDPR notices are expected
  to include a controller address.
- [ ] **M-6 — File the counsel question** with Lowenstein Sandler (Matthew
  VanderGoot), alongside the PRO licensing question:
  > Does a publicly promoted lead-capture tool reaching EU/UK visitors require a
  > GDPR-compliant notice and an unbundled consent path, and if so what is the
  > minimum viable posture for a pre-revenue PBC?

---

## ✅ Already done (no action needed — for reference)

- Interactive scorecard built and deployed (gateway → data breakdown → scorecard → result).
- Print output fixed (score/rating now print correctly).
- Gate copy corrected to the truthful mailing-list wording + Privacy policy link.
- Security headers (CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, COOP/CORP).
- **H-1** formula-injection escaping + strict email validation + source allowlist.
- **M-1** server-side honeypot enforcement.
- **M-2** Origin allowlist / cross-origin POST rejection.
- **M-3** durable two-tier rate-limit *code* (activates once Upstash env vars are set — see Part B).
- **M-6 interim** privacy sections: controller, legal basis, retention, rights, right to complain.

---

*Meek Earth Studio PBC · Music for the meek.*

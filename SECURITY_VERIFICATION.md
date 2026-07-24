# Security — Left to Verify

**Target:** https://nonprofit-transparency-scorecard.vercel.app
**As of:** July 24, 2026

A checklist of what still needs verifying before this is safe to promote publicly.
Grouped by priority. `B` = current production URL in the commands below:

```bash
B=https://nonprofit-transparency-scorecard.vercel.app
```

---

## 0. Blocking — current production is broken / diverged

- [ ] **Production is broken right now.** `index.html` links `styles.css` and
  `app.js`, but both return **404** — so no JS/CSS loads and the app is dead.
  Fix the deploy so those files are actually served, then re-verify everything
  below on the fixed build.
      ```bash
      curl -s -o /dev/null -w "%{http_code}\n" "$B/styles.css"   # must be 200
      curl -s -o /dev/null -w "%{http_code}\n" "$B/app.js"       # must be 200
      ```
- [ ] **Production has diverged from git.** The live build was regenerated
  (added a "skip the list" button + a **second** `/api` function) and no longer
  matches branch `claude/nonprofit-transparency-scorecard-57pkw2`. Decide the
  source of truth and make prod == a reviewed source, so future changes are
  tracked and auditable.
- [ ] **Audit the regenerated `app.js`.** Confirm the client still: sends the
  honeypot field, uses the strict email regex, posts `source:"scorecard-gate"`,
  and that the new "skip" button doesn't bypass any control unexpectedly.

---

## 1. Audit the unknown second serverless function

The live deployment reports **two** Node functions; only `api/capture.js` has
been reviewed. Whatever the second endpoint is (double opt-in? confirm link?),
verify:

- [ ] What route it is and what it does (read its source).
- [ ] It has **its own rate limiting** (don't leave an unthrottled endpoint).
- [ ] Any **token/HMAC** it issues uses a secret from env (never hard-coded,
  never in client JS), is single-use, and expires.
- [ ] Any confirmation/redirect link is **not an open redirect** (validate the
  target; don't reflect user input into a `Location`).
- [ ] It applies the same **email validation + sheet-injection escaping** before
  writing anywhere.
- [ ] It doesn't leak internal errors, tokens, or PII in responses/logs.

---

## 2. Verify the shipped controls live (run against the fixed build)

- [ ] **H-1 formula injection** — all three must be rejected **or** stored as
  escaped literal text; then open the Sheet and confirm **no cell renders as a
  formula/link**.
      ```bash
      curl -s -X POST "$B/api/capture" -H "Content-Type: application/json" \
        -d '{"email":"=HYPERLINK(\"http://evil.co\")@example.com"}'
      curl -s -X POST "$B/api/capture" -H "Content-Type: application/json" \
        -d '{"email":"ok@example.com","source":"=1+1"}'
      curl -s -X POST "$B/api/capture" -H "Content-Type: application/json" \
        -d '{"email":"+test@example.com"}'
      ```
- [ ] **M-1 honeypot** — response looks successful, but the row must **not**
  appear in the Sheet.
      ```bash
      curl -s -X POST "$B/api/capture" -H "Content-Type: application/json" \
        -d '{"email":"hp@example.com","company_website":"http://spam.co"}'
      ```
- [ ] **M-2 cross-origin** — a foreign `Origin` must be rejected (`403`).
      ```bash
      curl -s -o /dev/null -w "%{http_code}\n" -X POST "$B/api/capture" \
        -H "Origin: https://evil.example.com" \
        -H "Content-Type: application/json" -d '{"email":"cors@example.com"}'
      ```
- [ ] **Security headers** still present after the regeneration (CSP,
  HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, COOP/CORP).
      ```bash
      curl -sI "$B/" | grep -iE 'content-security-policy|strict-transport|x-frame|x-content-type|referrer-policy|permissions-policy|cross-origin'
      ```

---

## 3. Rate limiting — durability & tuning (M-3)

- [ ] **Confirm it's actually enforcing.** The limiter is dormant unless
  `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set in Vercel. As of
  last check the function had **zero invocations** and durability is unconfirmed.
- [ ] **Burst test** — the cut-off must hold *consistently across repeated runs*
  (inconsistent cut-offs = a per-instance in-memory counter, i.e. not durable).
      ```bash
      for i in $(seq 1 40); do
        curl -s -o /dev/null -w "%{http_code} " -X POST "$B/api/capture" \
          -H "Content-Type: application/json" -d "{\"email\":\"burst$i@example.com\"}"
      done; echo
      ```
- [ ] **Failure tier** — 10+ *invalid* submissions from one IP should get
  throttled (abuse is characterised by failures, not successes).
- [ ] Confirm the limiter runs **before** the Sheet/HubSpot write (throttled
  requests should cost no third-party quota).

---

## 4. Secrets & configuration

- [ ] **No secrets in the repo or client.** Grep the branch and the browser
  bundle for tokens/keys — everything sensitive must live only in Vercel env
  vars.
- [ ] **Apps Script web app access.** It's deployed "Anyone" so the `/exec` URL
  is effectively public — anyone who learns it can append rows. Set a
  `SHEETS_WEBHOOK_TOKEN` (matching `TOKEN` in the script) so only your function
  can write, and don't expose the `/exec` URL publicly.
- [ ] **Env var scope** — capture/rate-limit vars are set for **Production** and
  a redeploy has happened since (env changes only apply to new deployments).
- [ ] **Confirm the Sheet is actually receiving rows** (Part A wired) — otherwise
  you're not capturing anything.

---

## 5. Deployment hygiene (M-5)

- [x] Stale/old deployments deleted (only current builds remain). ✔ done
- [ ] **Deployment Protection for Preview** enabled, so future preview URLs
  aren't publicly reachable.
- [ ] No prior preview/production URL with the old false claim is still indexed:
  search `site:vercel.app nonprofit-transparency-scorecard`.
- [ ] Production alias points at the corrected, reviewed build (not a rolled-back
  or regenerated-but-broken one).

---

## 6. Consent & legal (M-4 / M-6)

- [ ] **Double opt-in (M-4)** — is a subscriber's address verified before it's
  mailed? If the regenerated 2nd function implements this, review it (see §1).
  If not, decide: implement, or accept as a documented known risk.
- [ ] **GDPR counsel (M-6)** — file the notice/unbundled-consent question with
  counsel; add the controller **postal address** to `privacy.html`.
- [ ] Confirm the "skip — just show me the scorecard" path truly lets a visitor
  through **without** enrolling them (unbundled consent), and that it's honestly
  labeled.

---

## 7. Ongoing

- [ ] Keep `@upstash/*` (and any deps added by the 2nd function) patched.
- [ ] Re-run §2 after any redeploy or regeneration — a rebuild can silently drop
  a control (as the CSS/JS 404 just showed).

---

*This checklist reflects state at the time of writing; production was mid-change.
Re-verify against whatever build is actually live. Meek Earth Studio PBC · Music for the meek.*

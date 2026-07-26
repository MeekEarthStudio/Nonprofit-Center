"use strict";

/* ============================================================
   1. Scorecard data — ten practices from the cited 2026 research
   ============================================================ */
const CRITERIA = [
  {
    t: "GAAP-compliant financial statements",
    d: "Statements follow ASC 958 with real footnote disclosures, and they're posted where donors can find them.",
    m: "Adopt ASC 958 statements with full footnotes and publish them on your website.",
    cite: { label: "Gray, Gray & Gray, LLP", url: "https://www.gggllp.com/best-practices-for-transparency-in-financial-reporting-for-nonprofits/" },
  },
  {
    t: "Independent audit (or review) at your scale",
    d: "An independent CPA audits or reviews your financials on a regular cycle appropriate to your budget size.",
    m: "Commission an independent audit or review and publish the result.",
    cite: { label: "Gray, Gray & Gray, LLP", url: "https://www.gggllp.com/best-practices-for-transparency-in-financial-reporting-for-nonprofits/" },
  },
  {
    t: "Form 990 filed on time and posted",
    d: "You know your 2026-cycle filing threshold and deadline, you've never missed, and your recent 990s are public on your site.",
    m: "Confirm your 990 deadline for the 2026 cycle and post your last three filings — three straight missed years is automatic revocation.",
    cite: { label: "Mission M / National Council of Nonprofits", url: "https://missionm.net/nonprofit-transparency-checklist/" },
  },
  {
    t: "Candid Seal of Transparency, current",
    d: "Your Candid profile is claimed, complete, and carries a current-year Seal.",
    m: "Claim and complete your Candid profile for a 2026 Seal — the practice with the clearest measured payoff (+62% contributions on average).",
    cite: { label: "Candid — 2026 Seals of Transparency", url: "https://candid.org/blogs/candid-2026-seals-of-transparency-made-faster-easier-nonprofits-more-donations/" },
  },
  {
    t: "Annual impact report and outcomes dashboard",
    d: "You publish a yearly impact report and keep a living, public dashboard of program outcomes.",
    m: "Publish an annual impact report and stand up a simple public outcomes dashboard.",
    cite: { label: "Zeffy — 2026 Guide", url: "https://www.zeffy.com/blog/nonprofit-organization-transparency" },
  },
  {
    t: "State charitable registrations current",
    d: "You're registered (and current) in every state where you solicit donations.",
    m: "Audit your state registrations against where you actually fundraise — NASCO maintains the map.",
    cite: { label: "Zeffy / NASCO", url: "https://www.zeffy.com/blog/nonprofit-organization-transparency" },
  },
  {
    t: "Conflict-of-interest policy, enforced",
    d: "Every board member files an annual written disclosure, recusals are documented, and the minutes show it.",
    m: "Collect annual COI disclosures from the full board and document recusals in the minutes.",
    cite: { label: "Boardable — Board Best Practices 2026", url: "https://boardable.com/resources/nonprofit-board-best-practices/" },
  },
  {
    t: "Fees and fund use disclosed at the point of donation",
    d: "Before a donor gives, they can see what the platform keeps, what your organization nets, and how the money is used.",
    m: "Add fee and fund-use disclosure to your donation flow — 53% of donors rank it as the top platform trust driver.",
    cite: { label: "Give.org Donor Trust Special Report (2026)", url: "https://give.org/donor-trust-report/2026-special-report-online-giving-platforms-donor-expectations" },
  },
  {
    t: "Fast, stated fund delivery",
    d: "Donated funds reach your programs on a stated timeline donors can see — 62% of donors expect delivery within three days.",
    m: "State your fund-delivery timeline publicly and tighten it toward the three-day expectation.",
    cite: { label: "Give.org Donor Trust Special Report (2026)", url: "https://give.org/donor-trust-report/2026-special-report-online-giving-platforms-donor-expectations" },
  },
  {
    t: "Event revenue splits disclosed to buyers",
    d: "For ticketed fundraisers, every buyer sees the full split at checkout — who gets what, including fees.",
    m: "Disclose the full revenue split on your next event's checkout, the way the Deanwood concert did (70.37% premium conversion vs. a 20–30% benchmark).",
    cite: { label: "The Deanwood concert (above)", url: "#deanwood" },
  },
];

const BANDS = [
  { min: 16, label: "Transparency Leader", blurb: "Your books are effectively open. You're positioned for the trust premium the research measures — Candid Seal holders averaged 62% more in contributions." },
  { min: 10, label: "Building Trust", blurb: "A solid base with visible gaps. Each move below is a cited, concrete practice — most cost more discipline than money." },
  { min: 0,  label: "Highest Upside", blurb: "The good news in the research: transparency lifts are largest where practice is thinnest — small nonprofits saw a 61% contribution lift after earning a Seal." },
];

const MAX_SCORE = CRITERIA.length * 2;
const scores = new Array(CRITERIA.length).fill(null);

/* ============================================================
   2. Vault opening
   ============================================================ */
const overlay = document.getElementById("vaultOverlay");
const frame = document.querySelector(".vault-frame");
const openBtn = document.getElementById("openVaultBtn");
const journey = document.getElementById("journey");

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function revealJourney() {
  journey.hidden = false;
  document.body.classList.remove("locked");
  overlay.classList.add("gone");
  overlay.addEventListener("transitionend", () => overlay.remove(), { once: true });
  // fallback removal in case transitionend never fires
  setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 1600);
  wireJourney();
}

openBtn.addEventListener("click", () => {
  openBtn.disabled = true;
  if (reducedMotion) { revealJourney(); return; }
  frame.classList.add("opening");
  // wheel spin (0.9s) → lugs retract → door swing (starts 0.7s, runs 1.1s)
  setTimeout(revealJourney, 1750);
});

/* ============================================================
   3. Build the scorecard
   ============================================================ */
const critList = document.getElementById("critList");
const VALUE_LABELS = ["0 · Not yet", "1 · In progress", "2 · Yes, publicly"];

CRITERIA.forEach((c, i) => {
  const li = document.createElement("li");
  li.className = "crit reveal";
  li.innerHTML =
    `<h3>${c.t}</h3>` +
    `<p>${c.d}</p>` +
    `<p class="cite">Source: <a href="${c.cite.url}"${c.cite.url.startsWith("#") ? "" : ' target="_blank" rel="noopener"'}>${c.cite.label}</a></p>` +
    `<div class="crit-btns" role="radiogroup" aria-label="${c.t}">` +
    VALUE_LABELS.map((lbl, v) =>
      `<button type="button" role="radio" aria-checked="false" data-i="${i}" data-v="${v}">${lbl}</button>`
    ).join("") +
    `</div>`;
  critList.appendChild(li);
});

critList.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-i]");
  if (!btn) return;
  const i = Number(btn.dataset.i);
  scores[i] = Number(btn.dataset.v);
  btn.parentElement.querySelectorAll("button").forEach((b) => {
    const on = b === btn;
    b.classList.toggle("on", on);
    b.setAttribute("aria-checked", String(on));
  });
  renderResults();
});

/* ============================================================
   4. Results
   ============================================================ */
const railScore = document.getElementById("railScore");
const railAnswered = document.getElementById("railAnswered");
const ringArc = document.getElementById("ringArc");
const ringNum = document.getElementById("ringNum");
const bandLabel = document.getElementById("bandLabel");
const bandBlurb = document.getElementById("bandBlurb");
const answeredNote = document.getElementById("answeredNote");
const resultBreakdown = document.getElementById("resultBreakdown");
const nextMoves = document.getElementById("nextMoves");

const RING_C = 2 * Math.PI * 52;
ringArc.style.strokeDasharray = RING_C;

function renderResults() {
  const answered = scores.filter((s) => s !== null).length;
  const total = scores.reduce((sum, s) => sum + (s || 0), 0);

  railScore.textContent = total;
  railAnswered.textContent = `${answered} of ${CRITERIA.length} answered`;

  ringNum.textContent = total;
  ringArc.style.strokeDashoffset = RING_C * (1 - total / MAX_SCORE);

  const band = BANDS.find((b) => total >= b.min);
  bandLabel.textContent = band.label;
  bandBlurb.textContent = band.blurb;
  answeredNote.textContent =
    answered === CRITERIA.length
      ? "All ten practices scored."
      : `${answered} of ${CRITERIA.length} scored — unanswered items count as 0 for now.`;

  resultBreakdown.innerHTML = CRITERIA.map((c, i) => {
    const s = scores[i];
    const cls = s === 2 ? "s2" : s === 1 ? "s1" : s === 0 ? "s0" : "sx";
    return `<li><span class="bd-score ${cls}">${s === null ? "—" : s}</span><span>${c.t}</span></li>`;
  }).join("");

  const gaps = CRITERIA.map((c, i) => ({ c, s: scores[i] ?? 0 }))
    .filter((x) => x.s < 2)
    .sort((a, b) => a.s - b.s)
    .slice(0, 3);
  nextMoves.innerHTML = gaps.length
    ? gaps.map((x) => `<li>${x.c.m} <span class="mv-src">(${x.c.cite.label})</span></li>`).join("")
    : `<li>Nothing urgent — all ten practices are in place. Keep the Seal, the 990, and the registrations current.</li>`;
}

document.getElementById("printBtn").addEventListener("click", () => window.print());

document.getElementById("resetBtn").addEventListener("click", () => {
  scores.fill(null);
  critList.querySelectorAll("button.on").forEach((b) => {
    b.classList.remove("on");
    b.setAttribute("aria-checked", "false");
  });
  renderResults();
  document.getElementById("scorecard").scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
});

document.getElementById("printDate").textContent = new Date().toLocaleDateString(undefined, {
  year: "numeric", month: "long", day: "numeric",
});

renderResults();

/* ============================================================
   5. Journey interactivity (runs once the vault opens)
   ============================================================ */
let wired = false;

function wireJourney() {
  if (wired) return;
  wired = true;

  const counters = document.querySelectorAll(".count");
  const reveals = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("in"));
    counters.forEach((el) => setCount(el, 1));
    return;
  }

  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in");
      revealObs.unobserve(entry.target);
    });
  }, { threshold: 0.2 });
  reveals.forEach((el) => revealObs.observe(el));

  const countObs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCount(entry.target);
      countObs.unobserve(entry.target);
    });
  }, { threshold: 0.5 });
  counters.forEach((el) => countObs.observe(el));

  // highlight the nav link for the section in view
  const navLinks = [...document.querySelectorAll(".topnav-links a")];
  const byId = Object.fromEntries(navLinks.map((a) => [a.getAttribute("href").slice(1), a]));
  const sectionObs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const link = byId[entry.target.id];
      if (!link) return;
      if (entry.isIntersecting) {
        navLinks.forEach((a) => a.classList.remove("active"));
        link.classList.add("active");
      }
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  document.querySelectorAll(".section[id]").forEach((s) => sectionObs.observe(s));
}

/* ============================================================
   6. Animated counters
   ============================================================ */
function setCount(el, progress) {
  const target = parseFloat(el.dataset.count);
  const decimals = parseInt(el.dataset.decimals || "0", 10);
  const value = target * progress;
  let text = value.toFixed(decimals);
  if (el.dataset.comma) text = Number(text).toLocaleString("en-US", {
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  });
  el.textContent = text;
}

function animateCount(el) {
  if (reducedMotion) { setCount(el, 1); return; }
  const duration = 1200;
  const start = performance.now();
  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    setCount(el, eased);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

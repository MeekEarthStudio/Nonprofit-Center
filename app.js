"use strict";

/* ============================================================
   1. Vault opening
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
   2. Journey interactivity (runs once the vault opens)
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
   3. Animated counters
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

"use strict";
/* ============================================================
   DATA
   ============================================================ */
const CLAIMS = [
  {s:"Every ticket routed the full $35 base amount to the nonprofit's meal program", k:"proven", b:"Transaction records: $1,890 = 54 × $35, reconstructed exactly from the P&L."},
  {s:"70.37% of buyers converted to the premium tier", k:"proven", b:"Directly observed: 38 of 54 buyers."},
  {s:"Conversion exceeded the industry benchmark even at the statistical low end", k:"proven", b:"Wilson 95% CI low bound (~57%) is roughly double the 20–30% benchmark ceiling."},
  {s:"Buyers paid more with the full revenue split transparently disclosed", k:"proven", b:"Co-occurrence is a transaction fact: disclosure was present for every upgrade decision."},
  {s:"Buyers were willing to pay above sticker price", k:"proven", b:"Confirmed ~$205 in unprompted checkout tips, split evenly between artist and studio."},
  {s:"The prototype was financially self-sustaining", k:"proven", b:"$289.35 net income after all fees and opex, with zero marketing spend."},
  {s:"Buyers upgraded to pay the artist OR to reward the studio (at least one motive)", k:"inference", b:"The defensible disjunctive conclusion: a completed upgrade requires at least one sufficient motive; bundled purchases can't isolate which."},
  {s:"Buyers upgraded to pay the artist AND reward the studio (both motives)", k:"notsupported", b:"Conjunction can't be established from bundled data; P(AND) ≤ P(OR) by axiom, and overhead-aversion research lowers the studio-motive prior."},
  {s:"Buyers paid more BECAUSE OF transparency (causal claim)", k:"notsupported", b:"Causation requires motive measurement; only co-occurrence was observed. The next concert's checkout question converts this to data."},
  {s:"70.37% will port directly to a five-tier pricing ladder", k:"notsupported", b:"Conversion was measured on a two-option menu; choice-architecture changes invalidate direct extrapolation."}
];

const PLAYS = [
  {t:"Print the split where the money changes hands", i:"Research shows giving drops when donors believe their money funds overhead — but when the exact split was disclosed at checkout, seven in ten buyers still chose to pay more.", p:"Publish your event's exact revenue split — real percentages, not “proceeds benefit us” — at the point of purchase. Transparency on a website is trivia; transparency at checkout is trust."},
  {t:"Guarantee the mission a floor on every ticket", i:"At the prototype, every ticket carried the full base amount to the nonprofit's meal program. The cause's revenue was never contingent on the event turning a profit.", p:"Route a defined dollar amount or percentage to the mission on every ticket at the moment of sale — not from surplus after costs. “Every ticket feeds a family, guaranteed” sells; “if the event does well, you'll get a check” doesn't."},
  {t:"Offer tiers — let generous people be generous", i:"A single price caps every supporter at the same contribution. With just two tiers, 70% of buyers self-selected upward. The premium tier didn't need convincing; it needed to exist.", p:"Offer at least a base and a premium option, with the premium clearly tied to added impact. A flat-price event silently converts your most generous supporters into average ones."},
  {t:"Open a giving lane above the sticker price", i:"Buyers voluntarily tipped beyond the listed premium price at checkout — unprompted. Willingness to pay didn't stop at the menu's top option.", p:"Add an optional tip or add-on field inside the checkout flow itself. A donation link in a follow-up email captures a fraction of what an in-flow option does — the moment of generosity is the moment of purchase."},
  {t:"Treat your community as the distribution channel it is", i:"The prototype spent $0 on marketing. All 54 buyers arrived organically — substantially through the nonprofit partner's own network. The nonprofit was the acquisition engine, not just the beneficiary.", p:"Budget your list, volunteers, and neighborhood presence as media. Then tag every ticket link by source so the next event's marketing follows evidence, not habit."},
  {t:"Pair the cause with a face", i:"The event paired the mission with a named, local artist whose pay visibly depended on buyers' choices. Decades of giving research says identifiable beneficiaries outperform abstract causes.", p:"Give supporters a person: the artist being paid fairly, the family receiving meals. “Pay this artist and feed this family” beats “support our operating fund” every time."},
  {t:"Know your real fee rate — and who absorbs it", i:"Processing fees ran 4.43% of gross — roughly a third higher than the headline card rate — driven by multi-recipient routing. Left unplanned, fees quietly ate into one party's share.", p:"Measure your actual all-in fee rate from real statements, then decide in writing, before the event, whose share absorbs fees. An undecided fee policy always becomes an unfair one."},
  {t:"Keep the cohort — your buyers are a base", i:"Fifty-four buyers is a small list but a complete one: every person who ever bought the product. Inviting them back produces the first repeat-purchase rate — a number every funder eventually asks about.", p:"Capture every buyer's contact at purchase, recognize them afterward, and invite them back with early access. Track how many return. Retention is the cheapest revenue you'll ever raise."},
  {t:"Ask one question: why did you give?", i:"The prototype's biggest open question isn't how many upgraded — it's why. Transaction data shows what people did; only a question reveals motive.", p:"Add one optional checkout question: “What most influenced your choice — the artist, the cause, the perks, or something else?” One line of data converts your next fundraising story from plausible to proven."}
];

const CRITERIA = [
  {t:"Split disclosure", o:["No breakdown shared; “proceeds benefit” language only","General percentages published somewhere (website, FAQ)","Exact split shown at the point of purchase, on the ticket itself"]},
  {t:"Guaranteed mission floor", o:["Cause paid from surplus after costs — no guarantee","Fixed donation promised, independent of ticket count","Every single ticket routes a defined amount to the mission at checkout"]},
  {t:"Pricing tiers", o:["One flat ticket price","Two options (base + premium)","Three or more tiers with a clear premium anchor"]},
  {t:"Above-sticker giving", o:["No way to give beyond the ticket price","Separate donation link outside checkout","Optional tip or add-on inside the checkout flow"]},
  {t:"Fee transparency", o:["Processing fees unknown or ignored in planning","Fees estimated at standard card rates","Actual fee rate measured and allocation decided in advance"]},
  {t:"Channel tracking", o:["No tracking of where buyers came from","Anecdotal sense of top channels","Tagged links per channel with per-channel counts"]},
  {t:"Identifiable beneficiary", o:["Generic cause description","Cause-level specifics (program, neighborhood)","A named person, artist, or family the buyer's money visibly supports"]},
  {t:"Supporter data capture", o:["No emails or records kept","Emails collected but unused","Cohort tracked, invited back, and repeat-purchase rate measured"]},
  {t:"Motive measurement", o:["No idea why supporters give","Informal feedback only","A structured question at checkout or post-event capturing motive"]},
  {t:"Post-event impact report", o:["No follow-up on how funds were used","General thank-you message","Itemized report to every buyer showing exactly where the money went"]}
];

const BANDS = {
  lead:   {name:"Transparency Leader", cls:"lead",
    means:"Your events already practice radical transparency. The structural levers are largely in place — so the frontier now is scale, retention, and sharpening the story with measured donor motive."},
  build:  {name:"Building Trust", cls:"build",
    means:"A strong foundation with visible gaps. Prioritize your two lowest-scoring criteria — point-of-purchase disclosure and checkout-level giving usually move revenue fastest."},
  upside: {name:"Highest Upside", cls:"upside",
    means:"Most events in this band leave significant premium revenue unclaimed. The prototype data suggests transparency and tiering are the highest-leverage first moves — and they cost structure, not budget."}
};

/* ============================================================
   STATE + HELPERS
   ============================================================ */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const scores = new Array(CRITERIA.length).fill(null);
let current = 0;
let slides = [];
const fmt = n => n.toLocaleString("en-US");

/* ============================================================
   GATEWAY
   ============================================================ */
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function validEmail(v){ return emailRe.test(v.trim()) && !/\.\./.test(v) && v.trim().length<=254; }

$("#gateForm").addEventListener("submit", async e=>{
  e.preventDefault();
  const inp = $("#email"), msg = $("#gateMsg"), btn = $("#gateBtn"), v = inp.value.trim();
  const fail = t=>{ msg.className="gate-msg err"; msg.textContent=t; inp.classList.add("invalid"); inp.focus(); btn.disabled=false; };
  if(!v){ fail("Please enter your email address to continue."); return; }
  if(!validEmail(v)){ fail("That doesn't look like a valid email — check for typos."); return; }
  inp.classList.remove("invalid");
  btn.disabled = true;
  msg.className="gate-msg"; msg.textContent="Verifying…";
  // Attempt server-side capture; the content isn't sensitive, so a capture
  // outage (or local file:// preview with no API) degrades gracefully — the
  // visitor still gets in, the email just isn't persisted that time.
  await captureEmail(v);
  msg.className="gate-msg ok"; msg.textContent="Verified. Opening the experience…";
  $("#whoEmail").textContent = v;
  $("#resPreparedFor").textContent = "Prepared for " + v;
  setTimeout(()=>{
    $("#gate").classList.add("hidden");
    $("#app").classList.add("show");
    window.scrollTo(0,0);
    initApp();
  }, 420);
});

async function captureEmail(email){
  const ctrl = new AbortController();
  const timer = setTimeout(()=>ctrl.abort(), 6000);
  try{
    const r = await fetch("/api/capture", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ email, source:"transparency-scorecard" }),
      signal: ctrl.signal
    });
    const data = await r.json().catch(()=>({}));
    if(!r.ok) console.warn("capture: server responded", r.status, data);
    else if(data && data.stored===false) console.info("capture: accepted but not persisted —", data.note||"backend unconfigured");
    return data;
  }catch(err){
    console.info("capture: skipped (endpoint unreachable / preview mode)", err && err.name);
    return null;
  }finally{
    clearTimeout(timer);
  }
}
$("#email").addEventListener("input", ()=>{
  const inp=$("#email"), msg=$("#gateMsg");
  if(inp.classList.contains("invalid") && validEmail(inp.value.trim())){ inp.classList.remove("invalid"); msg.textContent=""; msg.className="gate-msg"; }
});

/* ============================================================
   APP INIT
   ============================================================ */
let appReady = false;
function initApp(){
  if(appReady){ return; }
  appReady = true;
  slides = $$(".slide");
  buildDots();
  buildClaims();
  buildPlays();
  buildScorecard();
  wireNav();
  goto(0, true);
}

function buildDots(){
  const wrap = $("#dots"); wrap.innerHTML="";
  slides.forEach((s,i)=>{
    const b=document.createElement("button");
    b.className="dot"; b.setAttribute("aria-label","Go to "+(s.dataset.label||("slide "+(i+1))));
    b.addEventListener("click",()=>goto(i));
    wrap.appendChild(b);
  });
}

/* ---------- Navigation ---------- */
function wireNav(){
  $("#nextBtn").addEventListener("click",()=>goto(current+1));
  $("#prevBtn").addEventListener("click",()=>goto(current-1));
  document.addEventListener("keydown", e=>{
    if($("#gate").classList.contains("hidden")===false) return;
    if(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA") return;
    if(e.key==="ArrowRight") goto(current+1);
    if(e.key==="ArrowLeft") goto(current-1);
  });
  $("#revealScoreBtn").addEventListener("click",()=>{ if(allAnswered()){ renderResult(); goto(slides.length-1); }});
  $("#printBtn").addEventListener("click",()=>window.print());
  $("#restartBtn").addEventListener("click",()=>{
    scores.fill(null);
    $$(".opt.sel").forEach(o=>o.classList.remove("sel"));
    updateRail();
    goto(7);
  });
}

function goto(i, initial){
  i = Math.max(0, Math.min(slides.length-1, i));
  // Guard: can't reach result without a full scorecard
  if(i===slides.length-1 && !allAnswered()){ i = 7; }
  current = i;
  slides.forEach((s,idx)=>s.classList.toggle("active", idx===i));
  // progress
  const pct = slides.length>1 ? (i/(slides.length-1))*100 : 0;
  $("#progFill").style.width = pct+"%";
  $("#progLabel").textContent = slides[i].dataset.label || "";
  $("#progCount").textContent = (i+1)+" / "+slides.length;
  // dots
  $$("#dots .dot").forEach((d,idx)=>{
    d.classList.toggle("active", idx===i);
    d.classList.toggle("done", idx<i);
  });
  // nav buttons
  $("#prevBtn").style.visibility = i===0 ? "hidden":"visible";
  const nextBtn = $("#nextBtn");
  if(i>=slides.length-1){ nextBtn.style.visibility="hidden"; }
  else if(i===7){ nextBtn.style.visibility="hidden"; } // scorecard uses its own reveal button
  else { nextBtn.style.visibility="visible"; nextBtn.firstChild && (nextBtn.childNodes[0].nodeValue="Next "); }
  if(i===slides.length-2){ /* scorecard */ }
  window.scrollTo({top:0, behavior: initial?"auto":"smooth"});
  // slide-specific animations
  if(i===0) animateCounters(slides[0]);
  if(i===1) animateCounters(slides[1]);
  if(i===2) animateBars();
  if(i===3) animateSplit();
}

/* ---------- Counters ---------- */
function animateCounters(scope){
  $$("[data-count]", scope).forEach(el=>{
    if(el.dataset.done) return;
    el.dataset.done="1";
    const target = parseFloat(el.dataset.count);
    const dec = el.dataset.dec ? parseInt(el.dataset.dec) : (Number.isInteger(target)?0: (target.toString().split(".")[1]||"").length);
    const suffix = el.dataset.suffix || "";
    const dur = 1100; const start = performance.now();
    function tick(now){
      const t = Math.min(1,(now-start)/dur);
      const e = 1-Math.pow(1-t,3);
      const val = target*e;
      el.textContent = (dec? val.toFixed(dec): Math.round(val).toLocaleString("en-US")) + suffix;
      if(t<1) requestAnimationFrame(tick);
      else el.textContent = (dec? target.toFixed(dec): Math.round(target).toLocaleString("en-US")) + suffix;
    }
    requestAnimationFrame(tick);
  });
}

/* ---------- Bars ---------- */
function animateBars(){
  $$("#convChart .barfill").forEach(b=>{
    requestAnimationFrame(()=>{ b.style.width = b.dataset.w+"%"; });
  });
}

/* ---------- Split ---------- */
function animateSplit(){
  const segs = $$("#splitBar .seg");
  const total = segs.reduce((a,s)=>a+parseFloat(s.dataset.amt),0);
  segs.forEach(s=>{
    const pct = parseFloat(s.dataset.amt)/total*100;
    s.style.width="0%";
    requestAnimationFrame(()=>{ s.style.width = pct+"%"; });
    if(pct<8){ s.querySelector(".segval").textContent=""; }
  });
}

/* ---------- Claims ---------- */
function buildClaims(){
  const list=$("#claimList");
  const counts={all:CLAIMS.length,proven:0,inference:0,notsupported:0};
  CLAIMS.forEach(c=>counts[c.k]++);
  Object.keys(counts).forEach(k=>{ const el=$("#cnt-"+k); if(el) el.textContent=counts[k]; });
  const label={proven:"Proven",inference:"Inference",notsupported:"Not Supported"};
  list.innerHTML = CLAIMS.map(c=>`
    <div class="claim" data-k="${c.k}">
      <span class="tag ${c.k}">${label[c.k]}</span>
      <div><div class="st">${c.s}</div><div class="bs">${c.b}</div></div>
    </div>`).join("");
  $$("#claimFilters .chip").forEach(chip=>{
    chip.addEventListener("click",()=>{
      $$("#claimFilters .chip").forEach(c=>c.classList.remove("active"));
      chip.classList.add("active");
      const f=chip.dataset.f;
      $$(".claim").forEach(cl=> cl.classList.toggle("hide", f!=="all" && cl.dataset.k!==f));
    });
  });
}

/* ---------- Plays ---------- */
function buildPlays(){
  const g=$("#playsGrid");
  g.innerHTML = PLAYS.map((p,i)=>`
    <div class="play" data-i="${i}">
      <button class="phead" aria-expanded="false">
        <span class="pn">${i+1}</span>
        <span class="pt">${p.t}</span>
        <span class="chev"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      </button>
      <div class="pbody"><div class="pbody-in">
        <div class="pi"><b>The insight.</b> ${p.i}</div>
        <div class="pi"><b>The play.</b> ${p.p}</div>
      </div></div>
    </div>`).join("");
  $$("#playsGrid .play").forEach(pl=>{
    const btn=pl.querySelector(".phead");
    btn.addEventListener("click",()=>{
      const open = pl.classList.toggle("open");
      btn.setAttribute("aria-expanded", open?"true":"false");
    });
  });
}

/* ---------- Scorecard ---------- */
function buildScorecard(){
  const list=$("#scList");
  list.innerHTML = CRITERIA.map((c,i)=>`
    <div class="sc-item" data-i="${i}">
      <div class="sc-head"><span class="n">${i+1}</span><span class="t">${c.t}</span></div>
      <div class="opts">
        ${c.o.map((txt,pts)=>`
          <button class="opt" data-i="${i}" data-p="${pts}">
            <span class="pts"><span class="pill">${pts} pt${pts===1?"":"s"}</span></span>
            <span class="txt">${txt}</span>
            <span class="check"><svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
          </button>`).join("")}
      </div>
    </div>`).join("");
  $$("#scList .opt").forEach(opt=>{
    opt.addEventListener("click",()=>{
      const i=+opt.dataset.i, p=+opt.dataset.p;
      scores[i]=p;
      $$(`.opt[data-i="${i}"]`).forEach(o=>o.classList.remove("sel"));
      opt.classList.add("sel");
      updateRail();
    });
  });
  updateRail();
}

function total(){ return scores.reduce((a,v)=>a+(v||0),0); }
function answeredCount(){ return scores.filter(v=>v!==null).length; }
function allAnswered(){ return answeredCount()===CRITERIA.length; }
function band(t){ return t>=16?"lead": t>=10?"build":"upside"; }

function updateRail(){
  const t=total(), a=answeredCount();
  $("#railScore").textContent=t;
  $("#railMeter").style.width=(t/20*100)+"%";
  $("#railAnswered").textContent=a+" of 10 answered";
  const rate=$("#railRate");
  if(a<CRITERIA.length){ rate.textContent="In progress…"; rate.className="rate"; }
  else{ const b=BANDS[band(t)]; rate.textContent=b.name; rate.className="rate "+b.cls; }
  const btn=$("#revealScoreBtn");
  btn.disabled=!allAnswered();
  $("#revealHint").textContent = allAnswered()? "Ready — reveal your scorecard." : `${CRITERIA.length-a} criteria left to answer.`;
}

/* ---------- Result ---------- */
function renderResult(){
  const t=total(); const bk=band(t); const b=BANDS[bk];
  $("#resScore").textContent=t;
  $("#resRating").textContent=b.name;
  $("#resMeans").textContent=b.means;
  const hero=$("#resHero"); hero.className="result-hero "+b.cls;
  // ring
  const C=2*Math.PI*58;
  const arc=$("#ringArc");
  arc.style.transition="none"; arc.style.strokeDashoffset=C;
  requestAnimationFrame(()=>{ arc.style.transition="stroke-dashoffset 1.1s cubic-bezier(.2,.7,.2,1)"; arc.style.strokeDashoffset = C*(1-t/20); });
  // breakdown
  $("#resBreakdown").innerHTML = CRITERIA.map((c,i)=>{
    const p=scores[i]||0;
    const pips=[0,1].map(idx=>`<span class="bd-pip ${p>idx?"on":""} ${p===2?"two":""}"></span>`).join("");
    return `<div class="bd-row"><span class="lab">${i+1}. ${c.t}</span><span class="bd-pts">${pips}<span style="margin-left:8px;font-weight:750;color:var(--green-800)">${p}</span></span></div>`;
  }).join("");
  // moves: two lowest-scoring criteria (prioritize lowest points, earliest order)
  const ranked=CRITERIA.map((c,i)=>({t:c.t,p:scores[i]||0,i}))
    .sort((a,b)=>a.p-b.p || a.i-b.i);
  const lows=ranked.filter(r=>r.p<2).slice(0,3);
  const movesTxt = {
    0:"Publish your exact revenue split at the point of purchase, not just on a webpage.",
    1:"Route a fixed amount to the mission on every ticket at checkout — guarantee the floor.",
    2:"Add a premium tier (or a third) with a clear impact anchor above the base price.",
    3:"Put an optional tip or add-on field inside the checkout flow itself.",
    4:"Pull your real all-in fee rate from statements and decide, in writing, who absorbs it.",
    5:"Tag every ticket link by channel so next event's spend follows evidence.",
    6:"Name the person the money supports — the artist paid, the family fed.",
    7:"Capture every buyer's contact, invite them back, and measure repeat purchases.",
    8:"Add one checkout question: what most influenced your choice?",
    9:"Send every buyer an itemized report showing exactly where their money went."
  };
  const ml=$("#movesList");
  if(lows.length===0){
    ml.innerHTML=`<div class="move"><span class="mp">★</span><div>You're maxed across every criterion. Focus next on <b>scale and retention</b> — invite this cohort back and measure the repeat-purchase rate funders ask about.</div></div>`;
  } else {
    ml.innerHTML=lows.map(r=>`<div class="move"><span class="mp">${r.i+1}</span><div><b>${r.t}</b> — ${movesTxt[r.i]}</div></div>`).join("");
  }
  // mark result dot reachable
  $$("#dots .dot").forEach((d,idx)=>{ if(idx===slides.length-1) d.classList.add("done"); });
}

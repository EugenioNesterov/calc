// ═══════════════════════════════════════════════════════
//  HVAC QUOTE CALCULATOR — Strict 7-step Typeform flow
//  Logic unchanged. Only HTML templates updated for UI.
// ═══════════════════════════════════════════════════════

// ─── State ───────────────────────────────────────────
const answers = {
  homeType:   null,
  systemType: null,
  sqFootage:  null,
  zipCode:    "",
  firstName:  "",
  lastName:   "",
  phone:      "",
  email:      "",
};

let currentStep = 0; // 0-5 = questions, 6 = result

// ─── UI Refs ─────────────────────────────────────────
const stepContainer = document.getElementById("stepContainer");
const progressFill  = document.getElementById("progressFill");
const stepIndicator = document.getElementById("stepIndicator");
const stepLabel     = document.getElementById("stepLabel");
const backButton    = document.getElementById("backButton");
const nextButton    = document.getElementById("nextButton"); // hidden in footer, kept for JS compat

const QUESTION_COUNT = 6;

// ─── Validation (UNCHANGED) ──────────────────────────
function isStepValid(step) {
  switch (step) {
    case 0: return answers.homeType   !== null;
    case 1: return answers.systemType !== null;
    case 2: return answers.sqFootage  !== null;
    case 3: return answers.zipCode.trim().length >= 5;
    case 4: return answers.firstName.trim().length > 0 && answers.lastName.trim().length > 0;
    case 5: return answers.phone.trim().length >= 10 && answers.email.trim().includes("@");
    case 6: return true;
    default: return false;
  }
}

// ─── Sync inline OK button ────────────────────────────
function refreshStepNext() {
  const btn = document.querySelector(".step-next-btn");
  if (btn) btn.disabled = !isStepValid(currentStep);
}

// ─── Progress (UNCHANGED logic) ──────────────────────
function updateProgress() {
  const isResult = currentStep === 6;

  if (isResult) {
    progressFill.style.width  = "100%";
    stepIndicator.textContent = "Done!";
    stepLabel.textContent     = "";
    backButton.disabled       = false;
    return;
  }

  const humanStep = currentStep + 1;
  const pct       = (humanStep / QUESTION_COUNT) * 100;

  progressFill.style.width  = `${pct}%`;
  stepIndicator.textContent = `${humanStep}/${QUESTION_COUNT}`;
  stepLabel.textContent     = `Step ${humanStep} of ${QUESTION_COUNT}`;
  backButton.disabled       = currentStep === 0;
}

// ─── Inline OK button HTML ───────────────────────────
function stepNextBtn(disabled = true) {
  return `
    <div class="flex flex-col items-center gap-2 mt-10">
      <button type="button" class="step-next-btn" ${disabled ? "disabled" : ""}>
        OK&nbsp;&nbsp;→
      </button>
      <p class="text-xs text-slate-400">press <kbd class="font-mono bg-slate-100 px-1 py-0.5 rounded text-[11px]">Enter ↵</kbd></p>
    </div>`;
}

// ─── Option card HTML (no badge) ─────────────────────
function optionCard(label, stateKey, index) {
  const selected = answers[stateKey] === label;
  return `
    <button
      type="button"
      role="radio"
      aria-checked="${selected}"
      class="option-card ${selected ? "selected" : ""} anim-fade-up"
      data-key="${stateKey}"
      data-value="${label}"
    >
      <span class="label">${label}</span>
      ${selected
        ? `<svg class="check-icon w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
             <path fill-rule="evenodd" d="M16.704 5.29a1 1 0 01.006 1.414l-7 7a1 1 0 01-1.42-.004L4.79 10.17a1 1 0 111.42-1.404l2.79 2.823 6.29-6.294a1 1 0 011.414-.005z" clip-rule="evenodd"/>
           </svg>`
        : `<span class="w-5 h-5 flex-shrink-0"></span>`
      }
    </button>`;
}

// ─── STEP 1: Home Type ───────────────────────────────
function renderStep0() {
  const opts = ["Single-Family", "Condo", "Mobile", "Townhouse"];
  return `
    <div class="w-full max-w-lg mx-auto">
      <div class="text-center mb-12 anim-fade-up">
        <h1 class="font-display text-4xl sm:text-5xl font-extrabold leading-tight text-slate-900 tracking-tight">
          Select the type of home that you own
        </h1>
        <p class="mt-5 text-base text-slate-500 leading-relaxed max-w-sm mx-auto">
          To provide the most accurate estimate, we'll start with a few quick details about your home...
        </p>
      </div>
      <div class="flex flex-col gap-3 anim-child" role="radiogroup" aria-label="Home type">
        ${opts.map((opt, i) => optionCard(opt, "homeType", i)).join("")}
      </div>
      ${stepNextBtn(!isStepValid(0))}
    </div>`;
}

// ─── STEP 2: System Type ─────────────────────────────
function renderStep1() {
  const opts = ["Furnace", "A/C", "Mini-Split", "Heat Pump", "A/C & Furnace"];
  return `
    <div class="w-full max-w-lg mx-auto">
      <div class="text-center mb-12 anim-fade-up">
        <h1 class="font-display text-4xl sm:text-5xl font-extrabold leading-tight text-slate-900 tracking-tight">
          Which type of system would you like a quote for?
        </h1>
      </div>
      <div class="flex flex-col gap-3 anim-child" role="radiogroup" aria-label="System type">
        ${opts.map((opt, i) => optionCard(opt, "systemType", i)).join("")}
      </div>
      ${stepNextBtn(!isStepValid(1))}
    </div>`;
}

// ─── STEP 3: Square Footage ──────────────────────────
function renderStep2() {
  const opts = ["600–1,200", "1,201–1,500", "1,501–1,800", "1,801–2,100", "2,101–2,400", "2,400+"];
  return `
    <div class="w-full max-w-lg mx-auto">
      <div class="text-center mb-12 anim-fade-up">
        <h1 class="font-display text-4xl sm:text-5xl font-extrabold leading-tight text-slate-900 tracking-tight">
          What is the square footage of your home?
        </h1>
      </div>
      <div class="grid grid-cols-2 gap-3 anim-child" role="radiogroup" aria-label="Square footage">
        ${opts.map((opt, i) => optionCard(opt, "sqFootage", i)).join("")}
      </div>
      ${stepNextBtn(!isStepValid(2))}
    </div>`;
}

// ─── STEP 4: Zip Code ────────────────────────────────
function renderStep3() {
  return `
    <div class="w-full max-w-md mx-auto">
      <div class="text-center mb-14 anim-fade-up">
        <h1 class="font-display text-4xl sm:text-5xl font-extrabold leading-tight text-slate-900 tracking-tight">
          What is your zip code?
        </h1>
      </div>
      <div class="anim-fade-up" style="animation-delay:80ms">
        <label for="zipInput" class="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Zip Code</label>
        <input
          id="zipInput"
          type="text"
          inputmode="numeric"
          maxlength="10"
          placeholder="e.g. 90210"
          value="${answers.zipCode}"
          class="tf-input"
          autocomplete="postal-code"
          aria-label="Zip code"
        />
        <p class="mt-3 text-sm text-slate-400">We use your zip to find eligible local rebates.</p>
      </div>
      ${stepNextBtn(!isStepValid(3))}
    </div>`;
}

// ─── STEP 5: Name ────────────────────────────────────
function renderStep4() {
  return `
    <div class="w-full max-w-md mx-auto">
      <div class="text-center mb-14 anim-fade-up">
        <h1 class="font-display text-4xl sm:text-5xl font-extrabold leading-tight text-slate-900 tracking-tight">
          Please enter your full name
        </h1>
      </div>
      <div class="space-y-10">
        <div class="anim-fade-up" style="animation-delay:60ms">
          <label for="firstNameInput" class="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">First Name</label>
          <input
            id="firstNameInput"
            type="text"
            placeholder="John"
            value="${answers.firstName}"
            class="tf-input"
            autocomplete="given-name"
            aria-label="First name"
          />
        </div>
        <div class="anim-fade-up" style="animation-delay:130ms">
          <label for="lastNameInput" class="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Last Name</label>
          <input
            id="lastNameInput"
            type="text"
            placeholder="Doe"
            value="${answers.lastName}"
            class="tf-input"
            autocomplete="family-name"
            aria-label="Last name"
          />
        </div>
      </div>
      ${stepNextBtn(!isStepValid(4))}
    </div>`;
}

// ─── STEP 6: Contact ─────────────────────────────────
function renderStep5() {
  return `
    <div class="w-full max-w-md mx-auto">
      <div class="text-center mb-14 anim-fade-up">
        <h1 class="font-display text-4xl sm:text-5xl font-extrabold leading-tight text-slate-900 tracking-tight">
          Good news—your quote is ready! Where should we send it?
        </h1>
        <p class="mt-5 text-base text-slate-500 leading-relaxed">
          Enter your email and phone number for instant delivery!
        </p>
      </div>
      <div class="space-y-10">
        <div class="anim-fade-up" style="animation-delay:60ms">
          <label for="phoneInput" class="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Phone Number</label>
          <input
            id="phoneInput"
            type="tel"
            inputmode="tel"
            placeholder="(555) 123-4567"
            value="${answers.phone}"
            class="tf-input"
            autocomplete="tel"
            aria-label="Phone number"
          />
        </div>
        <div class="anim-fade-up" style="animation-delay:130ms">
          <label for="emailInput" class="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Email</label>
          <input
            id="emailInput"
            type="email"
            inputmode="email"
            placeholder="email@example.com"
            value="${answers.email}"
            class="tf-input"
            autocomplete="email"
            aria-label="Email address"
          />
        </div>
      </div>
      ${stepNextBtn(!isStepValid(5))}
    </div>`;
}

// ─── STEP 7: Result Screen ───────────────────────────
function renderStep6() {
  const sizeLookup = {
    "600–1,200":   { label: "2–3 Ton", tier: "basic"   },
    "1,201–1,500": { label: "2–3 Ton", tier: "basic"   },
    "1,501–1,800": { label: "3–4 Ton", tier: "mid"     },
    "1,801–2,100": { label: "3–4 Ton", tier: "mid"     },
    "2,101–2,400": { label: "4–5 Ton", tier: "premium" },
    "2,400+":      { label: "4–5 Ton", tier: "premium" },
  };
  const priceRange = {
    basic:   "$3,000–$5,000",
    mid:     "$5,000–$8,000",
    premium: "$8,000–$12,000",
  };

  const { label: systemSize, tier } = sizeLookup[answers.sqFootage] || { label: "3–4 Ton", tier: "mid" };
  const price      = priceRange[tier];
  const systemType = answers.systemType || "HVAC System";
  const firstName  = answers.firstName  || "";

  return `
    <div class="w-full max-w-xl mx-auto">

      <!-- Ready badge -->
      <div class="flex justify-center mb-8 anim-scale-in">
        <div class="flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5">
          <span class="pulse-dot w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
          <span class="text-xs font-bold text-emerald-700 tracking-wide uppercase">
            ${firstName ? `Quote ready · ${firstName}` : "Quote ready"}
          </span>
        </div>
      </div>

      <!-- Meta: Estimate Type + System Size -->
      <div class="flex flex-wrap gap-x-8 gap-y-4 mb-6 anim-fade-up" style="animation-delay:40ms">
        <div>
          <span class="result-label">Estimate Type</span>
          <span class="result-value">${systemType}</span>
        </div>
        <div>
          <span class="result-label">System Size</span>
          <span class="result-value">${systemSize}</span>
        </div>
      </div>

      <!-- Big price -->
      <div class="mb-8 anim-fade-up" style="animation-delay:80ms">
        <p class="font-display text-6xl sm:text-7xl font-extrabold tracking-tight text-slate-900 leading-none">
          ${price}
        </p>
        <p class="mt-2 text-sm text-slate-400">Estimated installed price · Confirmed after in-home assessment</p>
      </div>

      <div class="h-px bg-slate-100 mb-7"></div>

      <!-- Brand -->
      <div class="mb-7 anim-fade-up" style="animation-delay:120ms">
        <span class="result-label">Brand</span>
        <p class="text-[.9375rem] font-semibold text-slate-800 mt-0.5">
          AC PRO <span class="font-normal text-slate-400">(Lennox also available)</span>
        </p>
      </div>

      <div class="h-px bg-slate-100 mb-7"></div>

      <!-- Special offers -->
      <div class="mb-7 anim-fade-up" style="animation-delay:150ms">
        <span class="result-label">Special Offers</span>
        <ul class="mt-2 space-y-2">
          <li class="text-[.9375rem] text-slate-700">• Senior, Military &amp; First Responder Discounts</li>
          <li class="text-[.9375rem] text-slate-700">• Up to $2,000 in Tax Credits Available on Select Systems</li>
        </ul>
      </div>

      <!-- Additional savings -->
      <div class="mb-7 rounded-xl bg-amber-50 border border-amber-100 px-4 py-4 anim-fade-up" style="animation-delay:180ms">
        <p class="text-xs font-bold uppercase tracking-widest text-amber-500 mb-1">Additional Savings</p>
        <p class="text-sm text-amber-900 leading-relaxed">Book your in-home consultation today and unlock an exclusive early booking discount!</p>
      </div>

      <!-- Consultation text -->
      <p class="text-sm text-slate-500 leading-relaxed mb-8 anim-fade-up" style="animation-delay:200ms">
        Schedule a FREE in-home consultation with our team to assess your home, answer your questions, and explore financing options. It's all at no cost to you!
      </p>

      <!-- CTAs -->
      <div class="grid gap-3 sm:grid-cols-2 anim-fade-up" style="animation-delay:220ms">
        <a
          href="tel:6196262499"
          id="callNowBtn"
          class="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition duration-150 hover:border-accent-300 hover:text-accent-600 focus:outline-none focus:ring-4 focus:ring-accent-100"
        >
          <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
          </svg>
          Call Now: 619-626-2499
        </a>

        <button
          type="button"
          id="bookNowBtn"
          class="flex items-center justify-center gap-2 rounded-xl bg-accent-500 px-5 py-3.5 text-sm font-bold text-white transition duration-150 hover:bg-accent-600 focus:outline-none focus:ring-4 focus:ring-accent-100"
        >
          <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
          </svg>
          BOOK NOW
        </button>
      </div>

      <!-- Disclaimer -->
      <p class="mt-6 text-xs text-slate-400 text-center leading-relaxed border-t border-slate-100 pt-5 anim-fade-up" style="animation-delay:240ms">
        This online estimate is subject to adjustment following the in-home assessment. Pricing may vary based on additional features or simpler options. Ductwork is not included, and discounts may vary.
      </p>

      <!-- Answer summary pills -->
      <div class="mt-6 flex flex-wrap justify-center gap-2 anim-fade-up" style="animation-delay:260ms">
        ${[
          ["🏠", answers.homeType],
          ["⚙️", answers.systemType],
          ["📐", answers.sqFootage],
          ["📍", answers.zipCode],
        ].filter(([, v]) => v).map(([icon, val]) => `
          <span class="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500">
            ${icon} ${val}
          </span>
        `).join("")}
      </div>
    </div>`;
}

// ─── Step Router ─────────────────────────────────────
const RENDERERS = [
  renderStep0,
  renderStep1,
  renderStep2,
  renderStep3,
  renderStep4,
  renderStep5,
  renderStep6,
];

// ─── Render + Transition (UNCHANGED) ─────────────────
function renderStep(dir = 1) {
  const animClass = dir >= 0 ? "anim-slide-right" : "anim-slide-left";

  stepContainer.innerHTML = `
    <div class="${animClass}" style="width:100%;display:flex;justify-content:center;">
      ${RENDERERS[currentStep]()}
    </div>`;

  updateProgress();
  attachListeners();
}

// ─── Event Listeners Per Step (UNCHANGED logic) ──────
function attachListeners() {
  // Bind inline OK button
  document.querySelector(".step-next-btn")?.addEventListener("click", tryAdvance);

  // ── Choice cards (steps 0, 1, 2) ──
  document.querySelectorAll(".option-card").forEach(card => {
    card.addEventListener("click", () => {
      const key = card.dataset.key;
      const val = card.dataset.value;
      answers[key] = val;

      // Update card visuals without full re-render
      document.querySelectorAll(`.option-card[data-key="${key}"]`).forEach(c => {
        const isSel = c.dataset.value === val;
        c.classList.toggle("selected", isSel);
        c.setAttribute("aria-checked", String(isSel));

        // Swap checkmark / empty span
        const svgEl   = c.querySelector("svg.check-icon");
        const emptyEl = c.querySelector("span.w-5.h-5.flex-shrink-0");
        if (isSel && !svgEl) {
          emptyEl?.insertAdjacentHTML("afterend", `
            <svg class="check-icon w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.704 5.29a1 1 0 01.006 1.414l-7 7a1 1 0 01-1.42-.004L4.79 10.17a1 1 0 111.42-1.404l2.79 2.823 6.29-6.294a1 1 0 011.414-.005z" clip-rule="evenodd"/>
            </svg>`);
          emptyEl?.remove();
        } else if (!isSel && svgEl) {
          svgEl.insertAdjacentHTML("afterend", `<span class="w-5 h-5 flex-shrink-0"></span>`);
          svgEl.remove();
        }
      });

      refreshStepNext();
      setTimeout(() => advance(1), 300); // Typeform-style auto-advance
    });
  });

  // ── Zip code (step 3) ──
  const zipInput = document.getElementById("zipInput");
  if (zipInput) {
    zipInput.addEventListener("input", () => {
      answers.zipCode = zipInput.value;
      refreshStepNext();
    });
    zipInput.addEventListener("keydown", e => { if (e.key === "Enter") tryAdvance(); });
    setTimeout(() => zipInput.focus(), 200);
  }

  // ── Name (step 4) ──
  const fnInput = document.getElementById("firstNameInput");
  const lnInput = document.getElementById("lastNameInput");
  if (fnInput) {
    fnInput.addEventListener("input", () => {
      answers.firstName = fnInput.value;
      refreshStepNext();
    });
    fnInput.addEventListener("keydown", e => { if (e.key === "Enter") lnInput?.focus(); });
    setTimeout(() => fnInput.focus(), 200);
  }
  if (lnInput) {
    lnInput.addEventListener("input", () => {
      answers.lastName = lnInput.value;
      refreshStepNext();
    });
    lnInput.addEventListener("keydown", e => { if (e.key === "Enter") tryAdvance(); });
  }

  // ── Contact (step 5) ──
  const phoneInput = document.getElementById("phoneInput");
  const emailInput = document.getElementById("emailInput");
  if (phoneInput) {
    phoneInput.addEventListener("input", () => {
      answers.phone = phoneInput.value;
      refreshStepNext();
    });
    phoneInput.addEventListener("keydown", e => { if (e.key === "Enter") emailInput?.focus(); });
    setTimeout(() => phoneInput.focus(), 200);
  }
  if (emailInput) {
    emailInput.addEventListener("input", () => {
      answers.email = emailInput.value;
      refreshStepNext();
    });
    emailInput.addEventListener("keydown", e => { if (e.key === "Enter") tryAdvance(); });
  }

  // ── BOOK NOW (result) ──
  const bookBtn = document.getElementById("bookNowBtn");
  if (bookBtn) {
    bookBtn.addEventListener("click", () => {
      bookBtn.innerHTML = "✓ Booked! We'll be in touch.";
      bookBtn.disabled  = true;
      bookBtn.classList.add("opacity-70");
    });
  }
}

// ─── Navigation (UNCHANGED) ──────────────────────────
function advance(dir) {
  if (dir > 0) {
    if (currentStep >= 6) return;
    currentStep++;
  } else {
    if (currentStep <= 0) return;
    currentStep--;
  }
  renderStep(dir);
}

function tryAdvance() {
  if (isStepValid(currentStep)) advance(1);
}

backButton.addEventListener("click", () => advance(-1));
nextButton.addEventListener("click", tryAdvance); // hidden but kept for compat

// ─── Boot ─────────────────────────────────────────────
renderStep(1);

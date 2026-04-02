// ═══════════════════════════════════════════════════════
//  HVAC QUOTE CALCULATOR — 100% Original Typeform Logic
// ═══════════════════════════════════════════════════════

// ─── State ───────────────────────────────────────────
const answers = {
  homeType:   null,
  systemType: null,
  zones:      null, // Only for Mini-Split
  replaceNew: null, // New or Replacement
  sqFootage:  null,
  zipCode:    "",
  firstName:  "",
  lastName:   "",
  phone:      "",
  email:      "",
};

// Instead of a linear currentStep, we track our position in a dynamic path
let pathIndex = 0; 

// The full list of step indices:
// 0: Home Type, 1: System Type, 2: Zones, 3: Replace/New, 4: SqFt, 5: Zip, 6: Name, 7: Contact, 8: Result
const PATHS = {
  "Mini-Split": [0, 1, 2, 5, 6, 7, 8],
  "Furnace": [0, 1, 4, 5, 6, 7, 8],
  "DEFAULT": [0, 1, 3, 4, 5, 6, 7, 8] // A/C, Heat Pump, A/C & Furnace
};

function getActivePath() {
  if (answers.systemType === "Mini-Split") return PATHS["Mini-Split"];
  if (answers.systemType === "Furnace") return PATHS["Furnace"];
  if (!answers.systemType) return PATHS["DEFAULT"]; // Fallback for early steps
  return PATHS["DEFAULT"];
}

// ─── UI Refs ─────────────────────────────────────────
const stepContainer = document.getElementById("stepContainer");
const progressFill  = document.getElementById("progressFill");
const stepIndicator = document.getElementById("stepIndicator");
const stepLabel     = document.getElementById("stepLabel");

// ─── Validation ──────────────────────────
function isStepValid(stepIndex) {
  switch (stepIndex) {
    case 0: return answers.homeType   !== null;
    case 1: return answers.systemType !== null;
    case 2: return answers.zones      !== null;
    case 3: return answers.replaceNew !== null;
    case 4: return answers.sqFootage  !== null;
    case 5: return answers.zipCode.trim().length >= 5;
    case 6: return answers.firstName.trim().length > 0 && answers.lastName.trim().length > 0;
    case 7: return answers.phone.trim().length >= 10 && answers.email.trim().includes("@");
    case 8: return true;
    default: return false;
  }
}

// ─── Sync inline OK button ────────────────────────────
function refreshStepNext() {
  const btn = document.querySelector(".step-next-btn");
  if (btn) {
    const currentStepIndex = getActivePath()[pathIndex];
    btn.disabled = !isStepValid(currentStepIndex);
  }
}

// ─── Progress ──────────────────────
function updateProgress() {
  const currentPath = getActivePath();
  const currentStepIndex = currentPath[pathIndex];
  const isResult = currentStepIndex === 8;
  const questionCount = currentPath.length - 1;

  if (isResult) {
    progressFill.style.width  = "100%";
    stepIndicator.textContent = "Done!";
    stepLabel.textContent     = "";
    return;
  }

  const humanStep = pathIndex + 1;
  const pct       = (humanStep / questionCount) * 100;

  progressFill.style.width  = `${pct}%`;
  stepIndicator.textContent = `${humanStep}/${questionCount}`;
  stepLabel.textContent     = `Step ${humanStep} of ${questionCount}`;
}

// ─── Умные встроенные элементы навигации ─────────────
// stepIndex 0-4: карточки (авто-переход) → только «Back»
// stepIndex 5-7: текстовые поля → «Back» + «OK»
function renderStepControls(stepIndex, disabled = true) {
  const isCardStep  = stepIndex >= 0 && stepIndex <= 4;
  const isInputStep = stepIndex >= 5 && stepIndex <= 7;
  const isFirstStep = pathIndex === 0;

  // ── Кнопка «Back» — вторичный стиль ──────────────────
  const backBtn = `
    <button
      type="button"
      class="step-back-btn w-full flex items-center justify-center py-3.5 rounded
             bg-slate-100 text-sm font-bold text-slate-600 uppercase tracking-wide
             transition hover:bg-slate-200 hover:text-brand-blue"
    >← Back</button>`;

  // ── Кнопка «OK» — первичный brand-red стиль ──────────
  const okBtn = `
    <button
      type="button"
      class="step-next-btn w-full flex items-center justify-center py-3.5"
      ${disabled ? "disabled" : ""}
    >OK &nbsp;→</button>`;

  if (isCardStep) {
    // На первом шаге некуда возвращаться — убираем Back
    if (isFirstStep) return "";
    // Одна кнопка — центрируем, не растягиваем
    return `<div class="flex justify-center mt-8">${backBtn.replace("w-full", "px-8")}</div>`;
  }

  if (isInputStep) {
    // Две кнопки — равноширинная двухколоночная сетка
    return `
      <div class="w-full grid grid-cols-2 gap-4 mt-8">
        ${backBtn}
        ${okBtn}
      </div>`;
  }

  return ""; // шаг 8 (результат) — управляется самим рендерером
}

// ─── Option card HTML ─────────────────────
// layout: 'vertical' (квадратная сетка) | 'horizontal' (полноширинная строка)
function optionCard(label, stateKey, layout = 'horizontal') {
  const selected = answers[stateKey] === label;
  return `
    <button
      type="button"
      role="radio"
      aria-checked="${selected}"
      class="option-card ${layout} ${selected ? 'selected' : ''} anim-fade-up"
      data-key="${stateKey}"
      data-value="${label}"
      data-layout="${layout}"
    >
      <span class="label">${label}</span>
      ${selected
        ? `<svg class="check-icon" fill="currentColor" viewBox="0 0 20 20">
             <path fill-rule="evenodd" d="M16.704 5.29a1 1 0 01.006 1.414l-7 7a1 1 0 01-1.42-.004L4.79 10.17a1 1 0 111.42-1.404l2.79 2.823 6.29-6.294a1 1 0 011.414-.005z" clip-rule="evenodd"/>
           </svg>`
        : `<span class="check-placeholder"></span>`
      }
    </button>`;
}

// ─── STEPS TEMPLATES ───────────────────────────────

function renderStep0() {
  const opts = ["Single-Family", "Condo", "Mobile", "Townhouse"];
  return `
    <div class="w-full max-w-2xl mx-auto">
      <div class="text-center mb-10 anim-fade-up">
        <h1 class="font-display text-3xl sm:text-4xl font-black leading-tight text-brand-blue uppercase tracking-tight">
          Select the type of home that you own
        </h1>
        <p class="mt-4 text-sm font-semibold text-slate-500 leading-relaxed max-w-sm mx-auto uppercase tracking-wide">
          To provide the most accurate estimate, we'll start with a few quick details about your home...
        </p>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 anim-child" role="radiogroup">
        ${opts.map(opt => optionCard(opt, "homeType", "vertical")).join("")}
      </div>
      ${renderStepControls(0, !isStepValid(0))}
    </div>`;
}

function renderStep1() {
  const opts = ["Furnace", "A/C", "Mini-Split", "Heat Pump", "A/C & Furnace"];
  return `
    <div class="w-full max-w-2xl mx-auto">
      <div class="text-center mb-10 anim-fade-up">
        <h1 class="font-display text-3xl sm:text-4xl font-black leading-tight text-brand-blue uppercase tracking-tight">
          Which type of system would you like a quote for?
        </h1>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 anim-child" role="radiogroup">
        ${opts.map(opt => optionCard(opt, "systemType", "vertical")).join("")}
      </div>
      ${renderStepControls(1, !isStepValid(1))}
    </div>`;
}

function renderStep2() {
  const opts = ["1 Zone", "2 Zones", "3 Zones", "4 Zones", "5 Zones"];
  return `
    <div class="w-full max-w-lg mx-auto">
      <div class="text-center mb-12 anim-fade-up">
        <h1 class="font-display text-3xl sm:text-4xl font-black leading-tight text-brand-blue uppercase tracking-tight">
          How many zones do you need?
        </h1>
      </div>
      <div class="flex flex-col gap-3 anim-child" role="radiogroup">
        ${opts.map(opt => optionCard(opt, "zones", "horizontal")).join("")}
      </div>
      ${renderStepControls(2, !isStepValid(2))}
    </div>`;
}

function renderStep3() {
  const opts = ["New Installation", "Replacement"];
  return `
    <div class="w-full max-w-2xl mx-auto">
      <div class="text-center mb-10 anim-fade-up">
        <h1 class="font-display text-3xl sm:text-4xl font-black leading-tight text-brand-blue uppercase tracking-tight">
          Are you looking to replace an existing system or add a new one?
        </h1>
      </div>
      <div class="grid grid-cols-2 gap-4 max-w-md mx-auto anim-child" role="radiogroup">
        ${opts.map(opt => optionCard(opt, "replaceNew", "vertical")).join("")}
      </div>
      ${renderStepControls(3, !isStepValid(3))}
    </div>`;
}

function renderStep4() {
  const opts = ["600–1,200", "1,201–1,500", "1,501–1,800", "1,801–2,100", "2,101–2,400", "2,400+"];
  return `
    <div class="w-full max-w-lg mx-auto">
      <div class="text-center mb-12 anim-fade-up">
        <h1 class="font-display text-3xl sm:text-4xl font-black leading-tight text-brand-blue uppercase tracking-tight">
          What is the square footage of your home?
        </h1>
      </div>
      <div class="grid grid-cols-2 gap-3 anim-child" role="radiogroup">
        ${opts.map(opt => optionCard(opt, "sqFootage", "horizontal")).join("")}
      </div>
      ${renderStepControls(4, !isStepValid(4))}
    </div>`;
}

function renderStep5() {
  return `
    <div class="w-full max-w-md mx-auto">
      <div class="text-center mb-14 anim-fade-up">
        <h1 class="font-display text-3xl sm:text-4xl font-black leading-tight text-brand-blue uppercase tracking-tight">
          What is your zip code?
        </h1>
      </div>
      <div class="anim-fade-up" style="animation-delay:80ms">
        <label for="zipInput" class="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Zip Code</label>
        <input id="zipInput" type="text" inputmode="numeric" maxlength="10" placeholder="e.g. 92129" value="${answers.zipCode}" class="tf-input" autocomplete="postal-code"/>
        <p class="mt-3 text-xs font-bold uppercase tracking-wide text-slate-400">We use your zip to find eligible local rebates.</p>
      </div>
      ${renderStepControls(5, !isStepValid(5))}
    </div>`;
}

function renderStep6() {
  return `
    <div class="w-full max-w-md mx-auto">
      <div class="text-center mb-14 anim-fade-up">
        <h1 class="font-display text-3xl sm:text-4xl font-black leading-tight text-brand-blue uppercase tracking-tight">
          Please enter your full name
        </h1>
      </div>
      <div class="space-y-10">
        <div class="anim-fade-up" style="animation-delay:60ms">
          <label for="firstNameInput" class="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">First Name</label>
          <input id="firstNameInput" type="text" placeholder="JOHN" value="${answers.firstName}" class="tf-input uppercase" autocomplete="given-name"/>
        </div>
        <div class="anim-fade-up" style="animation-delay:130ms">
          <label for="lastNameInput" class="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Last Name</label>
          <input id="lastNameInput" type="text" placeholder="DOE" value="${answers.lastName}" class="tf-input uppercase" autocomplete="family-name"/>
        </div>
      </div>
      ${renderStepControls(6, !isStepValid(6))}
    </div>`;
}

function renderStep7() {
  return `
    <div class="w-full max-w-md mx-auto">
      <div class="text-center mb-14 anim-fade-up">
        <h1 class="font-display text-3xl sm:text-4xl font-black leading-tight text-brand-blue uppercase tracking-tight">
          Good news—your quote is ready! Where should we send it?
        </h1>
        <p class="mt-4 text-sm font-semibold text-slate-500 leading-relaxed uppercase tracking-wide">
          Enter your email and phone number for instant delivery!
        </p>
      </div>
      <div class="space-y-10">
        <div class="anim-fade-up" style="animation-delay:60ms">
          <label for="phoneInput" class="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Phone Number</label>
          <input id="phoneInput" type="tel" inputmode="tel" placeholder="(555) 123-4567" value="${answers.phone}" class="tf-input" autocomplete="tel"/>
        </div>
        <div class="anim-fade-up" style="animation-delay:130ms">
          <label for="emailInput" class="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Email</label>
          <input id="emailInput" type="email" inputmode="email" placeholder="email@example.com" value="${answers.email}" class="tf-input" autocomplete="email"/>
        </div>
      </div>
      ${renderStepControls(7, !isStepValid(7))}
    </div>`;
}

function renderStep8() {
  const price = calculatePrice();
  const systemSize = getSystemSize();
  const systemType = answers.systemType || "HVAC System";
  const firstName = answers.firstName || "";

  return `
    <div class="w-full max-w-xl mx-auto">
      
      <div class="flex justify-center mb-8 anim-scale-in">
        <div class="flex items-center gap-2 rounded bg-brand-blue border border-slate-800 px-4 py-2 shadow-lg">
          <span class="pulse-dot w-2.5 h-2.5 rounded-full bg-brand-red inline-block"></span>
          <span class="text-xs font-black text-white tracking-widest uppercase">
            ${firstName ? `Quote ready · ${firstName}` : "Quote ready"}
          </span>
        </div>
      </div>
      
      <div class="flex flex-wrap gap-x-12 gap-y-4 mb-6 anim-fade-up" style="animation-delay:40ms">
        <div>
          <span class="result-label">Estimate Type</span>
          <span class="result-value uppercase">${systemType}</span>
        </div>
        <div>
          <span class="result-label">System Size</span>
          <span class="result-value uppercase">${systemSize}</span>
        </div>
      </div>
      
      <div class="mb-8 anim-fade-up" style="animation-delay:80ms">
        <p class="font-display text-6xl sm:text-7xl font-black tracking-tighter text-brand-red leading-none">
          ${price}
        </p>
        <p class="mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">Estimated installed price · Confirmed after in-home assessment</p>
      </div>
      
      <div class="h-1 w-full bg-slate-200 mb-7"></div>
      
      <div class="mb-7 anim-fade-up" style="animation-delay:120ms">
        <span class="result-label">Brand</span>
        <p class="text-lg font-black text-brand-blue mt-0.5 uppercase tracking-wide">
          Big City Pro <span class="font-semibold text-slate-400 text-sm tracking-normal">(Lennox also available)</span>
        </p>
      </div>
      
      <div class="h-1 w-full bg-slate-200 mb-7"></div>
      
      <div class="mb-7 anim-fade-up" style="animation-delay:150ms">
        <span class="result-label">Special Offers</span>
        <ul class="mt-3 space-y-3">
          <li class="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
             <span class="text-brand-red">✔</span> Senior, Military &amp; First Responder Discounts
          </li>
          <li class="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
             <span class="text-brand-red">✔</span> Up to $2,000 in Tax Credits Available
          </li>
        </ul>
      </div>
      
      <div class="mb-8 rounded bg-brand-gray border-l-4 border-brand-red px-5 py-5 anim-fade-up" style="animation-delay:180ms">
        <p class="text-xs font-black uppercase tracking-widest text-brand-red mb-2">Additional Savings</p>
        <p class="text-sm font-semibold text-brand-blue leading-relaxed">Book your in-home consultation today and unlock an exclusive early booking discount! It's all at no cost to you!</p>
      </div>
      
      <div class="grid gap-4 sm:grid-cols-2 anim-fade-up" style="animation-delay:220ms">
        <a href="tel:6195418118" id="callNowBtn" class="flex items-center justify-center gap-2 rounded bg-brand-blue px-5 py-4 text-sm font-black uppercase tracking-wider text-white transition duration-150 hover:bg-brand-light focus:outline-none focus:ring-4 focus:ring-brand-blue/30 shadow-xl">
          <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
          </svg>
          (619) 541-8118
        </a>
        <button type="button" id="bookNowBtn" class="flex items-center justify-center gap-2 rounded bg-brand-red px-5 py-4 text-sm font-black uppercase tracking-wider text-white transition duration-150 hover:bg-brand-redHover focus:outline-none focus:ring-4 focus:ring-brand-red/30 shadow-xl">
          <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
          </svg>
          BOOK NOW
        </button>
      </div>
      
      <p class="mt-8 text-[11px] font-semibold text-slate-400 text-center leading-relaxed border-t border-slate-200 pt-6 anim-fade-up" style="animation-delay:240ms">
        This online estimate is subject to adjustment following the in-home assessment. Pricing may vary based on additional features or simpler options. Ductwork is not included, and discounts may vary.
      </p>
    </div>`;
}
// ─── Core Original Logic Extracted from JSON ──────────
function calculatePrice() {
  const type = answers.systemType;
  const zones = answers.zones;
  const sqft = answers.sqFootage;
  const install = answers.replaceNew;

  if (type === "Mini-Split") {
    const prices = { "1 Zone": "$5,493.23", "2 Zones": "$9,311.87", "3 Zones": "$13,272.45", "4 Zones": "$18,198.02", "5 Zones": "$22,762.19" };
    return prices[zones] || "$5,493.23";
  }

  if (type === "Furnace") {
    const prices = { "600–1,200": "$4,702", "1,201–1,500": "$4,823", "1,501–1,800": "$4,721", "1,801–2,100": "$4,918", "2,101–2,400": "$4,793", "2,400+": "$4,853" };
    return prices[sqft] || "$4,702";
  }

  if (type === "A/C") {
    if (install === "Replacement") {
      const prices = { "600–1,200": "$6,941", "1,201–1,500": "$6,941", "1,501–1,800": "$6,941", "1,801–2,100": "$7,541", "2,101–2,400": "$7,571", "2,400+": "$7,881" };
      return prices[sqft] || "$6,941";
    } else {
      const prices = { "600–1,200": "$7,791", "1,201–1,500": "$7,791", "1,501–1,800": "$7,925", "1,801–2,100": "$8,381", "2,101–2,400": "$8,421", "2,400+": "$8,731" };
      return prices[sqft] || "$7,791";
    }
  }

  if (type === "Heat Pump") {
    if (install === "Replacement") {
      const prices = { "600–1,200": "$7,677", "1,201–1,500": "$9,076", "1,501–1,800": "$8,633", "1,801–2,100": "$9,464", "2,101–2,400": "$9,535", "2,400+": "$9,713" };
      return prices[sqft] || "$7,677";
    } else {
      const prices = { "600–1,200": "$8,627", "1,201–1,500": "$9,076", "1,501–1,800": "$9,584", "1,801–2,100": "$9,464", "2,101–2,400": "$10,485", "2,400+": "$10,642" };
      return prices[sqft] || "$8,627";
    }
  }

  if (type === "A/C & Furnace") {
    if (install === "Replacement") {
      const prices = { "600–1,200": "$8,747", "1,201–1,500": "$8,747", "1,501–1,800": "$8,747", "1,801–2,100": "$9,419", "2,101–2,400": "$9,584", "2,400+": "$9,872" };
      return prices[sqft] || "$8,747";
    } else {
      const prices = { "600–1,200": "$9,697", "1,201–1,500": "$9,697", "1,501–1,800": "$10,369", "1,801–2,100": "$10,425", "2,101–2,400": "$10,781", "2,400+": "$10,781" };
      return prices[sqft] || "$9,697";
    }
  }

  return "$5,000"; // Fallback
}

function getSystemSize() {
  if (answers.systemType === "Mini-Split") {
    return answers.zones || "1 Zone";
  }
  const sizes = {
    "600–1,200": "2 Ton",
    "1,201–1,500": "2.5 Ton",
    "1,501–1,800": "3 Ton",
    "1,801–2,100": "3.5 Ton",
    "2,101–2,400": "4 Ton",
    "2,400+": "5 Ton"
  };
  return sizes[answers.sqFootage] || "3 Ton";
}

function renderStep8() {
  const price = calculatePrice();
  const systemSize = getSystemSize();
  const systemType = answers.systemType || "HVAC System";
  const firstName = answers.firstName || "";

  return `
    <div class="w-full max-w-xl mx-auto">
      <div class="flex justify-center mb-8 anim-scale-in">
        <div class="flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5">
          <span class="pulse-dot w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
          <span class="text-xs font-bold text-emerald-700 tracking-wide uppercase">
            ${firstName ? `Quote ready · ${firstName}` : "Quote ready"}
          </span>
        </div>
      </div>
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
      <div class="mb-8 anim-fade-up" style="animation-delay:80ms">
        <p class="font-display text-6xl sm:text-7xl font-extrabold tracking-tight text-slate-900 leading-none">
          ${price}
        </p>
        <p class="mt-2 text-sm text-slate-400">Estimated installed price · Confirmed after in-home assessment</p>
      </div>
      <div class="h-px bg-slate-100 mb-7"></div>
      <div class="mb-7 anim-fade-up" style="animation-delay:120ms">
        <span class="result-label">Brand</span>
        <p class="text-[.9375rem] font-semibold text-slate-800 mt-0.5">
          AC PRO <span class="font-normal text-slate-400">(Lennox also available)</span>
        </p>
      </div>
      <div class="h-px bg-slate-100 mb-7"></div>
      <div class="mb-7 anim-fade-up" style="animation-delay:150ms">
        <span class="result-label">Special Offers</span>
        <ul class="mt-2 space-y-2">
          <li class="text-[.9375rem] text-slate-700">• Senior, Military &amp; First Responder Discounts</li>
          <li class="text-[.9375rem] text-slate-700">• Up to $2,000 in Tax Credits Available on Select Systems</li>
        </ul>
      </div>
      <div class="mb-7 rounded-xl bg-amber-50 border border-amber-100 px-4 py-4 anim-fade-up" style="animation-delay:180ms">
        <p class="text-xs font-bold uppercase tracking-widest text-amber-500 mb-1">Additional Savings</p>
        <p class="text-sm text-amber-900 leading-relaxed">Book your in-home consultation today and unlock an exclusive early booking discount!</p>
      </div>
      <p class="text-sm text-slate-500 leading-relaxed mb-8 anim-fade-up" style="animation-delay:200ms">
        Schedule a FREE in-home consultation with our team to assess your home, answer your questions, and explore financing options. It's all at no cost to you!
      </p>
      <div class="grid gap-3 sm:grid-cols-2 anim-fade-up" style="animation-delay:220ms">
        <a href="tel:6196262499" id="callNowBtn" class="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition duration-150 hover:border-accent-300 hover:text-accent-600 focus:outline-none focus:ring-4 focus:ring-accent-100">
          <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
          </svg>
          Call Now: 619-626-2499
        </a>
        <button type="button" id="bookNowBtn" class="flex items-center justify-center gap-2 rounded-xl bg-accent-500 px-5 py-3.5 text-sm font-bold text-white transition duration-150 hover:bg-accent-600 focus:outline-none focus:ring-4 focus:ring-accent-100">
          <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
          </svg>
          BOOK NOW
        </button>
      </div>
      <p class="mt-6 text-xs text-slate-400 text-center leading-relaxed border-t border-slate-100 pt-5 anim-fade-up" style="animation-delay:240ms">
        This online estimate is subject to adjustment following the in-home assessment. Pricing may vary based on additional features or simpler options. Ductwork is not included, and discounts may vary.
      </p>
    </div>`;
}

// ─── Step Router ─────────────────────────────────────
const RENDERERS = {
  0: renderStep0,
  1: renderStep1,
  2: renderStep2,
  3: renderStep3,
  4: renderStep4,
  5: renderStep5,
  6: renderStep6,
  7: renderStep7,
  8: renderStep8
};

function renderStep(dir = 1) {
  const currentPath = getActivePath();
  const stepToRender = currentPath[pathIndex];
  
  const animClass = dir >= 0 ? "anim-slide-right" : "anim-slide-left";

  stepContainer.innerHTML = `
    <div class="${animClass}" style="width:100%;display:flex;justify-content:center;">
      ${RENDERERS[stepToRender]()}
    </div>`;

  updateProgress();
  attachListeners();
}

// ─── Event Listeners ─────────────────────────────────
function attachListeners() {
  // Динамические кнопки навигации внутри шага
  document.querySelector(".step-next-btn")?.addEventListener("click", tryAdvance);
  document.querySelector(".step-back-btn")?.addEventListener("click", () => advance(-1));

  document.querySelectorAll(".option-card").forEach(card => {
    card.addEventListener("click", () => {
      const key = card.dataset.key;
      const val = card.dataset.value;
      answers[key] = val;

      document.querySelectorAll(`.option-card[data-key="${key}"]`).forEach(c => {
        const isSel = c.dataset.value === val;
        c.classList.toggle("selected", isSel);
        c.setAttribute("aria-checked", String(isSel));

        const svgEl   = c.querySelector("svg.check-icon");
        const emptyEl = c.querySelector("span.check-placeholder");
        if (isSel && !svgEl) {
          emptyEl?.insertAdjacentHTML("afterend", `
            <svg class="check-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.704 5.29a1 1 0 01.006 1.414l-7 7a1 1 0 01-1.42-.004L4.79 10.17a1 1 0 111.42-1.404l2.79 2.823 6.29-6.294a1 1 0 011.414-.005z" clip-rule="evenodd"/>
            </svg>`);
          emptyEl?.remove();
        } else if (!isSel && svgEl) {
          svgEl.insertAdjacentHTML("afterend", `<span class="check-placeholder"></span>`);
          svgEl.remove();
        }
      });

      refreshStepNext();
      setTimeout(() => advance(1), 300);
    });
  });

  const attachInput = (id, key, nextId) => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener("input", () => { answers[key] = input.value; refreshStepNext(); });
      input.addEventListener("keydown", e => { 
        if (e.key === "Enter") {
          if (nextId) document.getElementById(nextId)?.focus();
          else tryAdvance();
        }
      });
    }
  };

  attachInput("zipInput", "zipCode");
  attachInput("firstNameInput", "firstName", "lastNameInput");
  attachInput("lastNameInput", "lastName");
  attachInput("phoneInput", "phone", "emailInput");
  attachInput("emailInput", "email");

  const autoFocusField = document.getElementById("zipInput") || document.getElementById("firstNameInput") || document.getElementById("phoneInput");
  if (autoFocusField) setTimeout(() => autoFocusField.focus(), 200);

  const bookBtn = document.getElementById("bookNowBtn");
  if (bookBtn) {
    bookBtn.addEventListener("click", () => {
      bookBtn.innerHTML = "✓ Booked! We'll be in touch.";
      bookBtn.disabled  = true;
      bookBtn.classList.add("opacity-70");
    });
  }
}

// ─── Navigation ──────────────────────────────────────
function advance(dir) {
  const currentPath = getActivePath();
  
  if (dir > 0) {
    if (pathIndex >= currentPath.length - 1) return;
    pathIndex++;
  } else {
    if (pathIndex <= 0) return;
    pathIndex--;
  }
  renderStep(dir);
}

function tryAdvance() {
  const currentStepIndex = getActivePath()[pathIndex];
  if (isStepValid(currentStepIndex)) advance(1);
}

// Глобальные кнопки footer удалены — навигация встроена в каждый шаг

// ─── Boot ─────────────────────────────────────────────
renderStep(1);
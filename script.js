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
  privacyAgreed: false,
};

// ─── FormSubmit ──────────────────────────────────────
const FORMSUBMIT_URL = "https://formsubmit.co/ajax/005mvv@gmail.com";

async function sendLead(isUrgent = false) {
  const payload = {
    ...answers,
    _subject: isUrgent
      ? "URGENT: HVAC Lead Booked!"
      : "New HVAC Lead (Viewing Quote)",
    _captcha: "false",
  };
  try {
    await fetch(FORMSUBMIT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (_) {
    // Ошибки сети не блокируют UI
  }
}

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

// ─── Phone Formatter ────────────────────────────────
/**
 * Форматирует строку в маску US-телефона.
 * < 4 цифр  → «XXX»
 * < 7 цифр  → «(XXX) XXX»
 * иначе     → «(XXX) XXX-XXXX» (макс. 10 цифр)
 */
function formatUSPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

// ─── Reset Logic ────────────────────────────────────
function resetCalculator() {
  // Очистка объекта ответов к исходному состоянию
  answers.homeType   = null;
  answers.systemType = null;
  answers.zones      = null;
  answers.replaceNew = null;
  answers.sqFootage  = null;
  answers.zipCode    = "";
  answers.firstName  = "";
  answers.lastName   = "";
  answers.phone      = "";
  answers.email      = "";
  answers.privacyAgreed = false;

  pathIndex = 0;
  renderStep(1);
}

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
    case 7: {
      const phoneDigits = answers.phone.replace(/\D/g, "");
      const emailRegex  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return phoneDigits.length === 10 && emailRegex.test(answers.email.trim()) && !!answers.privacyAgreed;
    }
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
function optionCard(label, stateKey, layout = 'horizontal', imageSrc = null) {
  const selected = answers[stateKey] === label;
  return `
    <button
      type="button"
      role="radio"
      aria-checked="${selected}"
      class="option-card ${layout} ${selected ? 'selected' : ''} anim-fade-up group"
      data-key="${stateKey}"
      data-value="${label}"
      data-layout="${layout}"
    >
      ${imageSrc ? `<img src="${imageSrc}" alt="${label}" class="w-24 h-24 sm:w-28 sm:h-28 object-contain mb-4 drop-shadow-sm transition-transform group-hover:scale-105" loading="lazy" draggable="false">` : ''}
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
  const opts = [
    { label: "Single-Family", img: "homes/single.png" },
    { label: "Condo",         img: "homes/condo.png" },
    { label: "Mobile",        img: "homes/mobile.png" },
    { label: "Townhouse",     img: "homes/townhouse.png" },
  ];
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
        ${opts.map(opt => optionCard(opt.label, "homeType", "vertical", opt.img)).join("")}
      </div>
      ${renderStepControls(0, !isStepValid(0))}
    </div>`;
}

function renderStep1() {
  const opts = [
    { label: "Furnace",      img: "systems/furnace.png" },
    { label: "A/C",          img: "systems/ac.png" },
    { label: "Mini-Split",   img: "systems/minisplit.png" },
    { label: "Heat Pump",    img: "systems/heatpump.png" },
    { label: "A/C & Furnace", img: "systems/combo.png" },
  ];
  return `
    <div class="w-full max-w-2xl mx-auto">
      <div class="text-center mb-10 anim-fade-up">
        <h1 class="font-display text-3xl sm:text-4xl font-black leading-tight text-brand-blue uppercase tracking-tight">
          Which type of system would you like a quote for?
        </h1>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 anim-child" role="radiogroup">
        ${opts.map(opt => optionCard(opt.label, "systemType", "vertical", opt.img)).join("")}
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
  const opts = [
    { label: "New Installation", img: "install/new.png" },
    { label: "Replacement",      img: "install/replace.png" },
  ];
  return `
    <div class="w-full max-w-2xl mx-auto">
      <div class="text-center mb-10 anim-fade-up">
        <h1 class="font-display text-3xl sm:text-4xl font-black leading-tight text-brand-blue uppercase tracking-tight">
          Are you looking to replace an existing system or add a new one?
        </h1>
      </div>
      <div class="grid grid-cols-2 gap-4 max-w-md mx-auto anim-child" role="radiogroup">
        ${opts.map(opt => optionCard(opt.label, "replaceNew", "vertical", opt.img)).join("")}
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
          <p class="text-[10px] text-slate-400 mt-2 font-medium leading-relaxed">By providing your phone number, you consent to receive calls and SMS regarding your quote.</p>
        </div>
        <div class="anim-fade-up" style="animation-delay:130ms">
          <label for="emailInput" class="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Email</label>
          <input id="emailInput" type="email" inputmode="email" placeholder="email@example.com" value="${answers.email}" class="tf-input" autocomplete="email"/>
          <p class="text-[10px] text-slate-400 mt-2 font-medium leading-relaxed">By providing your email, you consent to receive quote details and updates.</p>
        </div>
        
        <div class="anim-fade-up" style="animation-delay:200ms">
          <label class="relative inline-flex items-center cursor-pointer group">
            <input type="checkbox" id="privacyCheckbox" class="sr-only peer" ${answers.privacyAgreed ? 'checked' : ''}>
            <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-red"></div>
            <span class="ml-3 text-sm font-bold text-slate-600">
              I agree to the <button type="button" id="openPrivacyModalBtn" class="text-brand-blue underline hover:text-brand-light transition-colors">Privacy Policy</button>
            </span>
          </label>
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

      <div class="mt-6 text-center anim-fade-up" style="animation-delay:260ms">
        <span id="startOverBtn" class="text-sm font-semibold text-slate-400 hover:text-slate-600 mt-6 cursor-pointer underline underline-offset-4">
          Start Over
        </span>
      </div>
      
      <p class="mt-8 text-[11px] font-semibold text-slate-400 text-center leading-relaxed border-t border-slate-200 pt-6 anim-fade-up" style="animation-delay:280ms">
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
    const prices = { "1 Zone": "$4,499", "2 Zones": "$6,490", "3 Zones": "$8,490", "4 Zones": "$9,990", "5 Zones": "$11,990" };
    return prices[zones] || "$4,499";
  }

  if (type === "Furnace") {
    const prices = { "600–1,200": "$4,290", "1,201–1,500": "$4,390", "1,501–1,800": "$4,490", "1,801–2,100": "$4,590", "2,101–2,400": "$4,690", "2,400+": "$4,690" };
    return prices[sqft] || "$4,290";
  }

  if (type === "A/C") {
    if (install === "Replacement") {
      const prices = { "600–1,200": "$5,590", "1,201–1,500": "$5,590", "1,501–1,800": "$5,990", "1,801–2,100": "$6,590", "2,101–2,400": "$6,590", "2,400+": "$6,890" };
      return prices[sqft] || "$5,590";
    } else {
      const prices = { "600–1,200": "$6,390", "1,201–1,500": "$6,390", "1,501–1,800": "$6,790", "1,801–2,100": "$7,390", "2,101–2,400": "$7,390", "2,400+": "$7,690" };
      return prices[sqft] || "$6,390";
    }
  }

  if (type === "Heat Pump") {
    if (install === "Replacement") {
      const prices = { "600–1,200": "$6,490", "1,201–1,500": "$6,890", "1,501–1,800": "$7,490", "1,801–2,100": "$7,990", "2,101–2,400": "$7,990", "2,400+": "$8,490" };
      return prices[sqft] || "$6,490";
    } else {
      const prices = { "600–1,200": "$7,490", "1,201–1,500": "$7,890", "1,501–1,800": "$8,490", "1,801–2,100": "$8,990", "2,101–2,400": "$8,990", "2,400+": "$9,490" };
      return prices[sqft] || "$7,490";
    }
  }

  if (type === "A/C & Furnace") {
    if (install === "Replacement") {
      const prices = { "600–1,200": "$8,290", "1,201–1,500": "$8,490", "1,501–1,800": "$8,490", "1,801–2,100": "$9,090", "2,101–2,400": "$9,290", "2,400+": "$9,490" };
      return prices[sqft] || "$8,290";
    } else {
      const prices = { "600–1,200": "$9,290", "1,201–1,500": "$9,490", "1,501–1,800": "$9,490", "1,801–2,100": "$10,090", "2,101–2,400": "$10,290", "2,400+": "$10,490" };
      return prices[sqft] || "$9,290";
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
  // Глобальный слушатель для логотипа (сброс)
  const logoBtn = document.getElementById("logoResetBtn");
  if (logoBtn) {
    logoBtn.addEventListener("click", (e) => {
      e.preventDefault();
      resetCalculator();
    });
  }

  // ─── Модальное окно Privacy Policy ──────────────────
  const privacyModal = document.getElementById("privacyModal");
  const openPrivacyBtn = document.getElementById("openPrivacyModalBtn");
  const closePrivacyBtn = document.getElementById("closePrivacyModalBtn");
  const privacyOverlay = document.getElementById("privacyOverlay");

  const toggleModal = (show) => {
    if (privacyModal) privacyModal.classList.toggle("hidden", !show);
    document.body.style.overflow = show ? "hidden" : "";
  };

  if (openPrivacyBtn) openPrivacyBtn.addEventListener("click", () => toggleModal(true));
  if (closePrivacyBtn) closePrivacyBtn.addEventListener("click", () => toggleModal(false));
  if (privacyOverlay) privacyOverlay.addEventListener("click", () => toggleModal(false));

  // Динамические кнопки навигации внутри шага
  document.querySelector(".step-next-btn")?.addEventListener("click", tryAdvance);
  document.querySelector(".step-back-btn")?.addEventListener("click", () => advance(-1));
  
  // ... (existing option-card and input listeners) ...

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
      input.addEventListener("input", (e) => {
        let val = e.target.value;

        // Применяем правила валидации и маскирования в реальном времени
        if (key === "zipCode") {
          // Только цифры, макс. 5 символов
          val = val.replace(/\D/g, "").slice(0, 5);
        } else if (key === "firstName" || key === "lastName") {
          // Только буквы, пробелы и дефисы
          val = val.replace(/[^a-zA-Z\s-]/g, "");
        } else if (key === "phone") {
          // Маска телефона (XXX) XXX-XXXX
          const digits = val.replace(/\D/g, "").slice(0, 10);
          if (digits.length <= 3) {
            val = digits;
          } else if (digits.length <= 6) {
            val = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
          } else {
            val = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
          }
        } else if (key === "email") {
          // Удаление всех пробелов и перевод в нижний регистр
          val = val.replace(/\s/g, "").toLowerCase();
        }

        input.value = val;
        answers[key] = val;
        refreshStepNext();
      });

      input.addEventListener("keydown", (e) => {
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

  const currentPath = getActivePath();
  const stepIndex = currentPath[pathIndex];

  if (stepIndex === 7) {
    const privacyCheckbox = document.getElementById("privacyCheckbox");
    if (privacyCheckbox) {
      privacyCheckbox.addEventListener("change", (e) => {
        answers.privacyAgreed = e.target.checked;
        refreshStepNext();
      });
    }
  }

  // Логика для финального шага (Step 8)
  if (stepIndex === 8) {
    document.getElementById("startOverBtn")?.addEventListener("click", resetCalculator);
    
    const bookBtn = document.getElementById("bookNowBtn");
    if (bookBtn) {
      bookBtn.addEventListener("click", () => {
        // Отправляем «горячий» лид — пользователь нажал Book Now
        sendLead(true);
        const stepContainer = document.getElementById("stepContainer");
        if (stepContainer) {
          stepContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center p-8 anim-fade-up">
              <svg class="w-20 h-20 text-green-500 mb-6 anim-scale-in" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
              </svg>
              <h2 class="text-xl sm:text-2xl font-bold text-slate-800 text-center mb-6">
                Our specialist will contact you within a few minutes to help you choose the right solution.
              </h2>
              <p class="text-base italic text-slate-600 text-center mb-4 max-w-lg mx-auto">
                "The mission of our company is to provide the most comfortable solution at a fair price — and ensure every customer is fully satisfied."
              </p>
              <p class="text-base font-bold text-slate-800 text-center">
                — Val Malinovskii
              </p>
            </div>
          `;
          // Прокрутка наверх при замене контента
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }
  }

  const autoFocusField = document.getElementById("zipInput") || document.getElementById("firstNameInput") || document.getElementById("phoneInput");
}

// ─── Navigation ──────────────────────────────────────
function advance(dir) {
  const currentPath = getActivePath();
  
  if (dir > 0) {
    if (pathIndex >= currentPath.length - 1) return;
    // Отправляем «теплый» лид при завершении шага 7 (контактные данные)
    if (currentPath[pathIndex] === 7) sendLead(false);
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
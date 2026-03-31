// AC replacement estimator: four UI steps + final result (no repair logic)
const totalSteps = 5;

const quizSteps = [
  {
    key: "systemType",
    title: "What type of system?",
    options: [
      { label: "Central AC", value: "central_ac" },
      { label: "Ductless Mini Split", value: "ductless" },
    ],
  },
  {
    key: "homeSize",
    title: "Home size?",
    options: [
      { label: "Under 1000 sq ft", value: "under_1000" },
      { label: "1000–2000 sq ft", value: "between_1000_2000" },
      { label: "2000+ sq ft", value: "over_2000" },
    ],
  },
  {
    key: "condition",
    title: "Current system condition?",
    options: [
      { label: "Still working", value: "working" },
      { label: "Not working", value: "not_working" },
      { label: "Old system (10+ years)", value: "old" },
    ],
  },
  {
    key: "replacementTime",
    title: "When do you need replacement?",
    options: [
      { label: "ASAP", value: "asap" },
      { label: "This week", value: "this_week" },
      { label: "Just researching", value: "researching" },
    ],
  },
];

// Pricing is fixed in this version to match the required 3,500 – 8,000 range
function formatCurrency(n) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n).replace("$", "$");
  } catch {
    return `$${Number(n).toLocaleString("en-US")}`;
  }
}

function calculatePriceRange() {
  // Fixed range per the specification: $3,500 – $8,000
  return {
    min: 3500,
    max: 8000,
  };
}

const ui = {
  screen: document.getElementById("screen"),
  questionTitle: document.getElementById("questionTitle"),
  optionsContainer: document.getElementById("optionsContainer"),
  resultContainer: document.getElementById("resultContainer"),
  resultPrice: document.getElementById("resultPrice"),
  stepIndicator: document.getElementById("stepIndicator"),
  progressBar: document.getElementById("progressBar"),
  backButton: document.getElementById("backButton"),
  openLeadModalButton: document.getElementById("openLeadModalButton"),
  leadModal: document.getElementById("leadModal"),
  modalBackdrop: document.getElementById("modalBackdrop"),
  closeLeadModalButton: document.getElementById("closeLeadModalButton"),
  leadForm: document.getElementById("leadForm"),
};

let currentStep = 0;
const answers = {};

function roundToFive(value) {
  return Math.round(value / 5) * 5;
}

function calculatePriceRange() {
  // Fixed range per the specification: $3,500 – $8,000
  // The estimator is now dedicated to AC replacement and does not depend on per-step modifiers.
  return {
    min: 3500,
    max: 8000,
  };
}

function updateProgress() {
  const stepNumber = currentStep + 1;
  const progressPercent = (stepNumber / totalSteps) * 100;

  ui.stepIndicator.textContent = `${stepNumber}/${totalSteps}`;
  ui.progressBar.style.width = `${progressPercent}%`;
  ui.backButton.disabled = currentStep === 0;
}

function createOptionButton(option, index, stepKey) {
  const button = document.createElement("button");
  button.type = "button";

  const isSelected = answers[stepKey] === option.value;
  const baseClasses =
    "option-enter group w-full rounded-2xl border px-5 py-4 text-left transition duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-100 sm:px-6 sm:py-5";
  const stateClasses = isSelected
    ? "border-accent-300 bg-accent-50/70 shadow-soft"
    : "border-slate-200/90 bg-white/95 hover:-translate-y-0.5 hover:border-accent-300 hover:shadow-soft";

  button.className = `${baseClasses} ${stateClasses}`;
  button.style.animationDelay = `${index * 70}ms`;

  button.innerHTML = `
    <span class="flex items-center gap-4">
      <span class="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-sm font-bold text-slate-500">
        ${index + 1}
      </span>
      <span class="flex-1">
        <span class="block text-[17px] font-bold leading-tight text-slate-800 sm:text-lg">${option.label}</span>
      <span class="mt-1 block text-sm font-medium text-slate-500">Click to select</span>
      </span>
      <span class="flex h-8 w-8 flex-none items-center justify-center rounded-full border ${isSelected ? "border-accent-500 bg-accent-500 text-white" : "border-slate-300 bg-white text-slate-400"}">
        ${
          isSelected
            ? '<svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4"><path fill-rule="evenodd" d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7 7a1 1 0 0 1-1.42-.004L4.79 10.17a1 1 0 1 1 1.42-1.404l2.79 2.823 6.29-6.294a1 1 0 0 1 1.414-.005z" clip-rule="evenodd"/></svg>'
            : '<svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 0 1 0-1.414L10.586 10 7.293 6.707a1 1 0 0 1 1.414-1.414l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414 0z" clip-rule="evenodd"/></svg>'
        }
      </span>
    </span>
  `;

  button.addEventListener("click", () => {
    answers[stepKey] = option.value;
    goToStep(currentStep + 1, 1);
  });

  return button;
}

function renderQuestionStep(step) {
  ui.questionTitle.textContent = step.title;
  ui.optionsContainer.innerHTML = "";
  ui.optionsContainer.classList.remove("hidden");
  ui.resultContainer.classList.add("hidden");

  step.options.forEach((option, index) => {
    const optionButton = createOptionButton(option, index, step.key);
    ui.optionsContainer.appendChild(optionButton);
  });
}

function renderResultStep() {
  const range = calculatePriceRange();
  ui.questionTitle.textContent = "Estimated cost";
  ui.optionsContainer.classList.add("hidden");
  ui.resultContainer.classList.remove("hidden");
  ui.resultPrice.textContent = `${formatCurrency(range.min)} – ${formatCurrency(range.max)}`;
}

function renderCurrentStep() {
  if (currentStep < quizSteps.length) {
    renderQuestionStep(quizSteps[currentStep]);
  } else {
    renderResultStep();
  }

  updateProgress();
}

function goToStep(nextStep, direction) {
  if (nextStep < 0 || nextStep >= totalSteps) {
    return;
  }

  ui.screen.style.setProperty("--exit-offset", `${direction > 0 ? -24 : 24}px`);
  ui.screen.classList.add("screen-exit");

  setTimeout(() => {
    currentStep = nextStep;
    renderCurrentStep();

    ui.screen.classList.remove("screen-exit");
    ui.screen.classList.add("screen-enter");
  }, 170);
}

function openLeadModal() {
  ui.leadModal.classList.remove("hidden");
  ui.leadModal.classList.add("flex");
  document.body.classList.add("overflow-hidden");

  const firstInput = ui.leadForm.querySelector('input[name="firstName"]');
  firstInput?.focus();
}

function closeLeadModal() {
  ui.leadModal.classList.add("hidden");
  ui.leadModal.classList.remove("flex");
  document.body.classList.remove("overflow-hidden");
}

ui.backButton.addEventListener("click", () => {
  if (currentStep > 0) {
    goToStep(currentStep - 1, -1);
  }
});

ui.openLeadModalButton.addEventListener("click", openLeadModal);
ui.closeLeadModalButton.addEventListener("click", closeLeadModal);
ui.modalBackdrop.addEventListener("click", closeLeadModal);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !ui.leadModal.classList.contains("hidden")) {
    closeLeadModal();
  }
});

ui.leadForm.addEventListener("submit", (event) => {
  event.preventDefault();
  ui.leadForm.reset();
  closeLeadModal();
  window.alert("Thank you! Your request has been submitted.");
});

renderCurrentStep();

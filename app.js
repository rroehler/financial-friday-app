import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB4Z_Wt6_zizqjbnVrSI2GQt1IF3mQ6ToA",
  authDomain: "my-personal-website-7d2f7.firebaseapp.com",
  projectId: "my-personal-website-7d2f7",
  storageBucket: "my-personal-website-7d2f7.firebasestorage.app",
  messagingSenderId: "69240259654",
  appId: "1:69240259654:web:c5c4eaf3f2b3c9e230f647"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ACCOUNT_DOC = doc(db, 'budget', 'accounts');
const EMPTY_ACCOUNTS = Object.freeze({
  navyFederal: 0,
  purdueFCU: 0,
  savorOne: 0,
  oneKey: 0
});

const accountLabels = {
  navyFederal: 'Navy Federal',
  purdueFCU: 'Purdue Federal',
  savorOne: 'Capital One SavorOne',
  oneKey: 'Wells Fargo OneKey'
};


const PLAN_SECTIONS = [
  {
    key: 'home-fixed',
    title: 'Home & fixed',
    subtitle: 'Core monthly obligations',
    icon: 'ti-home',
    categories: [
      { section: 'fixed', item: 'rent', label: 'Rent', defaultPlanned: 1295 },
      { section: 'fixed', item: 'mortgage', label: 'Mortgages', defaultPlanned: 1840 },
      { section: 'fixed', item: 'utilities', label: 'Utilities', defaultPlanned: 275 },
      { section: 'fixed', item: 'phone', label: 'Phone', defaultPlanned: 65 },
      { section: 'fixed', item: 'insurance', label: 'Insurance', defaultPlanned: 85 },
      { section: 'fixed', item: 'pet', label: 'Pet insurance', defaultPlanned: 0 },
      { section: 'fixed', item: 'subscriptions', label: 'Subscriptions', defaultPlanned: 0 },
      { section: 'fixed', item: 'otherFixed', label: 'Other fixed', defaultPlanned: 0 }
    ]
  },
  {
    key: 'lifestyle',
    title: 'Lifestyle',
    subtitle: 'Flexible personal spending',
    icon: 'ti-sparkles',
    categories: [
      { section: 'purdue', item: 'pet', label: 'Pet spending', defaultPlanned: 150 },
      { section: 'purdue', item: 'entertainment', label: 'Entertainment', defaultPlanned: 100 },
      { section: 'purdue', item: 'clothing', label: 'Clothing', defaultPlanned: 75 },
      { section: 'purdue', item: 'amazon', label: 'Amazon', defaultPlanned: 100 },
      { section: 'purdue', item: 'travel', label: 'Travel', defaultPlanned: 100 },
      { section: 'purdue', item: 'misc', label: 'Miscellaneous', defaultPlanned: 150 }
    ]
  },
  {
    key: 'transportation',
    title: 'Transportation',
    subtitle: 'Vehicle and fuel',
    icon: 'ti-car',
    categories: [
      { section: 'fixed', item: 'truck', label: 'Truck payment', defaultPlanned: 730 },
      { section: 'purdue', item: 'gas', label: 'Gas', defaultPlanned: 250 }
    ]
  },
  {
    key: 'everyday',
    title: 'Everyday',
    subtitle: 'Regular living expenses',
    icon: 'ti-shopping-cart',
    categories: [
      { section: 'purdue', item: 'groceries', label: 'Groceries', defaultPlanned: 500 },
      { section: 'purdue', item: 'dining', label: 'Dining', defaultPlanned: 250 },
      { section: 'purdue', item: 'prescription', label: 'Prescriptions', defaultPlanned: 50 }
    ]
  },
  {
    key: 'financial-progress',
    title: 'Financial progress',
    subtitle: 'Debt reduction and interest',
    icon: 'ti-target-arrow',
    accent: true,
    categories: [
      { section: 'debt', item: 'savorOne', label: 'SavorOne payment', defaultPlanned: 0 },
      { section: 'debt', item: 'oneKey', label: 'OneKey payment', defaultPlanned: 0 },
      { section: 'debt', item: 'interest', label: 'Interest', defaultPlanned: 0 }
    ]
  }
];

const collapsedPlanSections = new Set(
  JSON.parse(localStorage.getItem('financialFridayCollapsedPlanSections') || '[]')
);

let monthlyBudgetState = {};
const APP_MODES = Object.freeze({ REALITY: 'reality', FREEDOM: 'freedom' });
const appState = {
  mode: APP_MODES.REALITY,
  realityPlan: {},
  workingPlan: null,
  hasPendingChanges: false
};

const loginScreen = document.getElementById('login-screen');
const appShell = document.getElementById('app-shell');
const loginError = document.getElementById('login-error');
const balanceModal = document.getElementById('balance-modal');
const modalInput = document.getElementById('modal-new-balance');
const modalError = document.getElementById('modal-error');
const modalSave = document.getElementById('modal-save');
const modalCancel = document.getElementById('modal-cancel');
const accountsNote = document.querySelector('.accounts-note');
const planEditSheet = document.getElementById('plan-edit-sheet');
const planEditInput = document.getElementById('plan-edit-input');
const planEditError = document.getElementById('plan-edit-error');
const planEditSave = document.getElementById('plan-edit-save');
const planEditCancel = document.getElementById('plan-edit-cancel');
const modeToggle = document.getElementById('mode-toggle');
const freedomBanner = document.getElementById('freedom-banner');
const freedomIntro = document.getElementById('freedom-intro');
const realityDialog = document.getElementById('reality-dialog');
const accountsLockedDialog = document.getElementById('accounts-locked-dialog');
const modeTransition = document.getElementById('mode-transition');


let accountState = { ...EMPTY_ACCOUNTS };
let weeklyTrendHistory = [];
let activePanel = 'cash';
let editingAccount = null;
let trendChart;
let swipeStartX = null;
let isSavingBalance = false;
let editingPlanCategory = null;
let isSavingPlanAmount = false;
let lastUpdatedPlanKey = null;


function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function getActivePlan() {
  return appState.mode === APP_MODES.FREEDOM && appState.workingPlan
    ? appState.workingPlan
    : appState.realityPlan;
}

function getTotalPlanned(plan) {
  return round2(PLAN_SECTIONS.flatMap(section => section.categories).reduce((total, category) => {
    const key = `mb-${category.section}-${category.item}-budgeted`;
    const value = Number(plan[key]);
    return total + (Number.isFinite(value) ? value : category.defaultPlanned);
  }, 0));
}

function getFreedomDifference() {
  if (!appState.workingPlan) return 0;
  return round2(getTotalPlanned(appState.realityPlan) - getTotalPlanned(appState.workingPlan));
}

function getFreedomMessage(difference = getFreedomDifference()) {
  if (difference > 0) return `You have increased your financial freedom by ${fmt(difference, 2)} for this month.`;
  if (difference < 0) return `You have decreased your financial freedom by ${fmt(Math.abs(difference), 2)} for this month.`;
  return 'Your working plan has not changed your financial freedom yet.';
}

function normalizeAccounts(data = {}) {
  return Object.fromEntries(
    Object.keys(EMPTY_ACCOUNTS).map(key => [key, round2(Number(data[key]) || 0)])
  );
}

function fmt(value, decimals = 0) {
  return '$' + Number(value).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function getAccountTotals() {
  const cash = round2(accountState.navyFederal + accountState.purdueFCU);
  const debt = round2(accountState.savorOne + accountState.oneKey);
  return { cash, debt, netWorth: round2(cash - debt) };
}

function setGreeting() {
  const hour = new Date().getHours();
  const el = document.getElementById('greeting-time');
  if (hour < 12) el.textContent = 'Good morning';
  else if (hour < 18) el.textContent = 'Good afternoon';
  else el.textContent = 'Good evening';
}

function setPlanMonthLabel() {
  const label = document.getElementById('plan-month-label');
  if (!label) return;

  const month = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  label.textContent = month.toUpperCase() + ' PLAN';
}

function setAccountsMessage(message, type = '') {
  accountsNote.textContent = message;
  accountsNote.classList.toggle('is-error', type === 'error');
  accountsNote.classList.toggle('is-success', type === 'success');
}

function setApplicationMode(mode) {
  appState.mode = mode;
  const isFreedom = mode === APP_MODES.FREEDOM;

  document.body.classList.toggle('freedom-mode', isFreedom);
  freedomBanner.classList.toggle('is-visible', isFreedom);
  freedomBanner.setAttribute('aria-hidden', String(!isFreedom));
  document.getElementById('freedom-impact-card').hidden = !isFreedom;
  modeToggle.classList.toggle('is-reality', isFreedom);
  modeToggle.querySelector('span').textContent = isFreedom ? 'Make It Real' : 'Freedom Mode';
  modeToggle.querySelector('i').className = `ti ${isFreedom ? 'ti-world' : 'ti-sparkles'}`;

  renderFreedomImpact();
  renderOverviewAccountSummary();
  renderPlan();
  renderTopSpending();
  renderTrendChart();
}

function runModeTransition(targetMode, callback) {
  const enteringFreedom = targetMode === APP_MODES.FREEDOM;
  const directionClass = enteringFreedom ? 'to-freedom' : 'to-reality';
  const root = document.documentElement;
  const finish = () => {
    modeTransition.className = 'mode-transition';
    root.classList.remove('mode-transitioning', directionClass);
    modeToggle.classList.remove('is-morphing');
  };

  root.classList.add('mode-transitioning', directionClass);
  modeTransition.className = `mode-transition is-active ${directionClass}`;
  modeToggle.classList.add('is-morphing');

  if (typeof document.startViewTransition === 'function') {
    const transition = document.startViewTransition(() => callback());
    transition.finished.finally(finish);
    return;
  }

  // Unsupported browsers retain fixed geometry and use the same quiet
  // atmosphere overlay while the state colors ease into place.
  callback();
  window.setTimeout(finish, 1200);
}

function startFreedomMode() {
  appState.realityPlan = { ...monthlyBudgetState };
  appState.workingPlan = { ...appState.realityPlan };
  appState.hasPendingChanges = false;
  runModeTransition(APP_MODES.FREEDOM, () => {
    setApplicationMode(APP_MODES.FREEDOM);
    if (localStorage.getItem('financialFridayHideFreedomIntro') !== 'true') {
      freedomIntro.hidden = false;
    }
  });
}

function returnToReality({ discard = false, animate = true } = {}) {
  const finish = () => {
    if (discard) monthlyBudgetState = { ...appState.realityPlan };
    appState.workingPlan = null;
    appState.hasPendingChanges = false;
    realityDialog.hidden = true;
    setApplicationMode(APP_MODES.REALITY);
  };

  if (animate && appState.mode === APP_MODES.FREEDOM) runModeTransition(APP_MODES.REALITY, finish);
  else finish();
}

function resetPlanningSession({ clearData = false } = {}) {
  if (clearData) {
    monthlyBudgetState = {};
    appState.realityPlan = {};
  } else if (Object.keys(appState.realityPlan).length) {
    monthlyBudgetState = { ...appState.realityPlan };
  }
  appState.workingPlan = null;
  appState.hasPendingChanges = false;
  realityDialog.hidden = true;
  freedomIntro.hidden = true;
  accountsLockedDialog.hidden = true;
  setApplicationMode(APP_MODES.REALITY);
}

function renderFreedomImpact() {
  if (appState.mode !== APP_MODES.FREEDOM) return;

  const difference = getFreedomDifference();
  const impactValue = document.getElementById('freedom-impact-value');
  const message = getFreedomMessage(difference);
  impactValue.textContent = `${difference > 0 ? '+' : difference < 0 ? '-' : ''}${fmt(Math.abs(difference), 2)}`;
  impactValue.className = difference > 0 ? 'is-positive' : difference < 0 ? 'is-negative' : '';
  document.getElementById('freedom-impact-copy').textContent = message;
  document.getElementById('freedom-impact-annual').textContent = `Annual impact: ${difference > 0 ? '+' : difference < 0 ? '-' : ''}${fmt(Math.abs(round2(difference * 12)), 2)}`;
  document.getElementById('freedom-banner-message').textContent = message;
}

function openRealityDialog() {
  if (!appState.hasPendingChanges) {
    returnToReality({ discard: true });
    return;
  }

  document.getElementById('reality-dialog-summary').textContent = getFreedomMessage();
  document.getElementById('reality-dialog-error').textContent = '';
  realityDialog.hidden = false;
}

async function commitWorkingPlan() {
  if (!appState.workingPlan) return;

  const commitButton = document.getElementById('reality-commit');
  const errorElement = document.getElementById('reality-dialog-error');
  commitButton.disabled = true;
  commitButton.textContent = 'Committing…';
  errorElement.textContent = '';

  try {
    const monthKey = new Date().toISOString().slice(0, 7);
    const updates = {};
    Object.entries(appState.workingPlan).forEach(([key, value]) => {
      if (key.endsWith('-budgeted') && value !== appState.realityPlan[key]) updates[key] = value;
    });

    if (Object.keys(updates).length) {
      await setDoc(doc(db, 'budget', 'monthlyBudget', 'months', monthKey), updates, { merge: true });
    }

    monthlyBudgetState = { ...appState.workingPlan };
    appState.realityPlan = { ...monthlyBudgetState };
    returnToReality();
  } catch (error) {
    console.error('Unable to commit the working plan:', error);
    errorElement.textContent = 'Unable to commit this plan. Check your connection and try again.';
  } finally {
    commitButton.disabled = false;
    commitButton.textContent = 'Commit Plan';
  }
}

modeToggle.addEventListener('click', () => {
  if (appState.mode === APP_MODES.REALITY) startFreedomMode();
  else openRealityDialog();
});

document.getElementById('freedom-guide-btn').addEventListener('click', () => {
  freedomIntro.hidden = false;
});

document.getElementById('freedom-intro-continue').addEventListener('click', () => {
  if (document.getElementById('freedom-intro-dismiss').checked) {
    localStorage.setItem('financialFridayHideFreedomIntro', 'true');
  }
  freedomIntro.hidden = true;
});

document.getElementById('reality-continue').addEventListener('click', () => {
  realityDialog.hidden = true;
});
document.getElementById('reality-discard').addEventListener('click', () => returnToReality({ discard: true }));
document.getElementById('reality-commit').addEventListener('click', commitWorkingPlan);

document.getElementById('accounts-locked-close')?.addEventListener('click', () => {
  accountsLockedDialog.hidden = true;
});

accountsLockedDialog?.addEventListener('click', event => {
  if (event.target === accountsLockedDialog) accountsLockedDialog.hidden = true;
});

async function attemptLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  loginError.textContent = '';

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Login failed:', error);
    loginError.textContent = 'Login failed — check email/password.';
  }
}

document.getElementById('login-btn').addEventListener('click', attemptLogin);
['login-email', 'login-password'].forEach(id => {
  document.getElementById(id).addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      attemptLogin();
    }
  });
});
document.getElementById('logout-btn').addEventListener('click', async () => {
  resetPlanningSession({ clearData: true });
  await signOut(auth);
});

document.querySelectorAll('.nav-item').forEach(button => {
  button.addEventListener('click', () => {
    if (button.dataset.view === 'accounts' && appState.mode === APP_MODES.FREEDOM) {
      button.classList.remove('is-shaking');
      void button.offsetWidth;
      button.classList.add('is-shaking');
      accountsLockedDialog.hidden = false;
      return;
    }
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));
    button.classList.add('active');
    document.getElementById('view-' + button.dataset.view).classList.add('active');
  });
});

onAuthStateChanged(auth, async user => {
  if (!user) {
    resetPlanningSession({ clearData: true });
    loginScreen.style.display = 'flex';
    appShell.classList.remove('active');
    return;
  }

  resetPlanningSession();
  loginScreen.style.display = 'none';
  appShell.classList.add('active');
  setGreeting();
  setPlanMonthLabel();

  try {
    await loadAppData();
    modeToggle.classList.add('is-inviting');
    window.setTimeout(() => modeToggle.classList.remove('is-inviting'), 30000);
  } catch (error) {
    console.error('Unable to load Financial Friday data:', error);
    setAccountsMessage('Unable to load account balances. Try refreshing the app.', 'error');
  }
});

async function loadAppData() {
  await Promise.all([
    loadAccountData(),
    loadWeeklyTrend(),
    loadMonthlyBudgetData()
  ]);

  refreshAccountViews();
}

async function loadAccountData() {
  const snapshot = await getDoc(ACCOUNT_DOC);
  accountState = snapshot.exists()
    ? normalizeAccounts(snapshot.data())
    : { ...EMPTY_ACCOUNTS };
}

async function loadWeeklyTrend() {
  const snapshot = await getDocs(
    query(collection(db, 'budget', 'weeklyLog', 'entries'), orderBy('date', 'asc'))
  );

  weeklyTrendHistory = [];
  snapshot.forEach(entry => {
    const week = entry.data();
    const weekCash = (Number(week.navyFederal) || 0) + (Number(week.purdueFCU) || 0);
    const weekDebt = (Number(week.savorOne) || 0) + (Number(week.oneKey) || 0);
    weeklyTrendHistory.push(round2(weekCash - weekDebt));
  });
}

async function loadMonthlyBudgetData() {
  const monthKey = new Date().toISOString().slice(0, 7);
  const snapshot = await getDoc(doc(db, 'budget', 'monthlyBudget', 'months', monthKey));
  monthlyBudgetState = snapshot.exists() ? snapshot.data() : {};
  appState.realityPlan = { ...monthlyBudgetState };
  appState.workingPlan = null;
  appState.hasPendingChanges = false;

  renderTopSpending();
  renderPlan();
}

function getBudgetValue(section, item, type, fallback = 0) {
  const key = `mb-${section}-${item}-${type}`;
  const value = Number(getActivePlan()[key]);

  if (Number.isFinite(value)) return round2(value);
  return round2(fallback);
}

function getPlanCategoryData(category) {
  const planned = getBudgetValue(
    category.section,
    category.item,
    'budgeted',
    category.defaultPlanned
  );
  const spent = getBudgetValue(category.section, category.item, 'actual', 0);
  const remaining = round2(planned - spent);
  const percent = planned > 0 ? (spent / planned) * 100 : spent > 0 ? 100 : 0;

  let status = 'healthy';
  if (remaining < 0 || (planned === 0 && spent > 0)) status = 'over';
  else if (percent >= 75) status = 'warning';

  return {
    ...category,
    planned,
    spent,
    remaining,
    percent,
    status
  };
}

function renderTopSpending() {
  const categories = PLAN_SECTIONS
    .flatMap(section => section.categories)
    .filter(category => category.section === 'purdue')
    .map(category => getPlanCategoryData(category))
    .filter(category => category.spent > 0)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);

  const iconMap = {
    groceries: 'ti-shopping-cart',
    gas: 'ti-gas-station',
    dining: 'ti-coffee',
    prescription: 'ti-pill',
    clothing: 'ti-shirt',
    pet: 'ti-paw',
    entertainment: 'ti-device-tv',
    amazon: 'ti-package',
    travel: 'ti-plane',
    misc: 'ti-dots'
  };

  const list = document.getElementById('top-spending-list');
  list.innerHTML = categories.length === 0
    ? '<p style="color:var(--text-faint); font-size:13px;">No spending logged yet this month.</p>'
    : categories.map(category => `
        <div class="spend-row">
          <div class="spend-icon">
            <i class="ti ${iconMap[category.item] || 'ti-dots'}" aria-hidden="true"></i>
          </div>
          <p class="s-name">${category.label}</p>
          <p class="s-amount">${fmt(category.spent)}</p>
        </div>
      `).join('');
}

function renderPlan() {
  const grid = document.getElementById('plan-section-grid');
  if (!grid) return;

  const sections = PLAN_SECTIONS.map(section => {
    const categories = section.categories.map(getPlanCategoryData);
    const totals = categories.reduce(
      (sum, category) => ({
        planned: round2(sum.planned + category.planned),
        spent: round2(sum.spent + category.spent),
        remaining: round2(sum.remaining + category.remaining)
      }),
      { planned: 0, spent: 0, remaining: 0 }
    );

    const percent = totals.planned > 0
      ? (totals.spent / totals.planned) * 100
      : totals.spent > 0 ? 100 : 0;
    const status = totals.remaining < 0
      ? 'over'
      : percent >= 75 ? 'warning' : 'healthy';

    return { ...section, categories, totals, percent, status };
  });

  const overall = sections.reduce(
    (sum, section) => ({
      planned: round2(sum.planned + section.totals.planned),
      spent: round2(sum.spent + section.totals.spent),
      remaining: round2(sum.remaining + section.totals.remaining)
    }),
    { planned: 0, spent: 0, remaining: 0 }
  );

  document.getElementById('plan-summary-planned').textContent = fmt(overall.planned, 2);
  document.getElementById('plan-summary-spent').textContent = fmt(overall.spent, 2);
  document.getElementById('plan-summary-remaining').textContent =
    (overall.remaining < 0 ? '-' : '') + fmt(Math.abs(overall.remaining), 2);

  const overallPercent = overall.planned > 0
    ? Math.min((overall.spent / overall.planned) * 100, 100)
    : overall.spent > 0 ? 100 : 0;
  const overallStatus = overall.remaining < 0
    ? 'over'
    : overallPercent >= 75 ? 'warning' : 'healthy';
  const summaryProgress = document.querySelector('.plan-summary-progress');
  summaryProgress.className = `plan-summary-progress is-${overallStatus}`;
  document.getElementById('plan-summary-progress-bar').style.width = `${overallPercent}%`;
  renderFreedomImpact();

  grid.innerHTML = sections.map(section => {
    const isCollapsed = collapsedPlanSections.has(section.key);
    const cappedPercent = Math.min(Math.max(section.percent, 0), 100);

    return `
      <article class="plan-card${section.accent ? ' plan-card-accent' : ''}${isCollapsed ? ' is-collapsed' : ''}" data-plan-section="${section.key}">
        <button
          class="plan-card-header plan-card-toggle"
          type="button"
          aria-expanded="${!isCollapsed}"
          aria-controls="plan-section-${section.key}"
        >
          <div class="plan-card-title">
            <span class="plan-card-icon">
              <i class="ti ${section.icon}" aria-hidden="true"></i>
            </span>
            <div>
              <p>${section.title}</p>
              <span>${section.subtitle}</span>
            </div>
          </div>
          <div class="plan-card-header-right">
            <div class="plan-card-total">
              <span>Remaining</span>
              <strong>${section.totals.remaining < 0 ? '-' : ''}${fmt(Math.abs(section.totals.remaining), 2)}</strong>
            </div>
            <i class="ti ti-chevron-down plan-card-chevron" aria-hidden="true"></i>
          </div>
          <div class="plan-card-summary-progress plan-progress is-${section.status}" aria-hidden="true">
            <span style="width:${cappedPercent}%"></span>
          </div>
          <div class="plan-card-summary-meta">
            <span>${fmt(section.totals.spent, 2)} spent</span>
            <span>${fmt(section.totals.planned, 2)} planned</span>
          </div>
        </button>
        <div class="plan-list" id="plan-section-${section.key}">
          ${section.categories.map(renderPlanRow).join('')}
        </div>
      </article>
    `;
  }).join('');
}

function renderPlanRow(category) {
  const cappedPercent = Math.min(Math.max(category.percent, 0), 100);
  const remainingLabel = category.remaining < 0 ? 'over' : 'left';
  const categoryKey = `${category.section}:${category.item}`;
  const updatedClass = lastUpdatedPlanKey === categoryKey ? ' is-just-updated' : '';

  return `
    <button
      class="plan-row plan-row-edit is-${category.status}${updatedClass}"
      type="button"
      data-plan-section="${category.section}"
      data-plan-item="${category.item}"
      data-plan-label="${category.label}"
      aria-label="Edit ${category.label} planned amount"
    >
      <div class="plan-row-top">
        <span class="plan-row-name">${category.label}</span>
        <div class="plan-row-remaining">
          <strong>${category.remaining < 0 ? '-' : ''}${fmt(Math.abs(category.remaining), 2)}</strong>
          <span>${remainingLabel}</span>
        </div>
      </div>
      <div class="plan-row-meta">
        <span>Spent <strong>${fmt(category.spent, 2)}</strong></span>
        <span>Planned <strong>${fmt(category.planned, 2)}</strong></span>
      </div>
      <div class="plan-progress is-${category.status}" aria-hidden="true">
        <span style="width:${cappedPercent}%"></span>
      </div>
    </button>
  `;
}


function findPlanCategory(section, item) {
  return PLAN_SECTIONS
    .flatMap(planSection => planSection.categories)
    .find(category => category.section === section && category.item === item);
}

function setPlanEditSavingState(isSaving) {
  isSavingPlanAmount = isSaving;
  planEditInput.disabled = isSaving;
  planEditCancel.disabled = isSaving;
  planEditSave.disabled = isSaving || !isPlanEditChanged();
  planEditSave.classList.toggle('is-saving', isSaving);
  planEditSave.setAttribute('aria-busy', String(isSaving));
}

function isPlanEditChanged() {
  if (!editingPlanCategory) return false;

  const value = Number(planEditInput.value);
  return Number.isFinite(value)
    && value >= 0
    && round2(value) !== editingPlanCategory.planned;
}

function validatePlanEditInput() {
  const rawValue = planEditInput.value.trim();
  const value = Number(rawValue);

  if (rawValue === '' || !Number.isFinite(value) || value < 0) {
    planEditError.textContent = 'Enter a valid amount of $0 or more.';
    planEditSave.disabled = true;
    return false;
  }

  planEditError.textContent = '';
  planEditSave.disabled = isSavingPlanAmount || !isPlanEditChanged();
  return true;
}

function openPlanEditSheet(section, item, label) {
  const category = findPlanCategory(section, item);
  if (!category) return;

  const data = getPlanCategoryData(category);
  editingPlanCategory = {
    section,
    item,
    label: label || category.label,
    planned: data.planned
  };

  document.getElementById('plan-edit-title').textContent = editingPlanCategory.label;
  document.getElementById('plan-edit-current').textContent = fmt(data.planned, 2);
  planEditInput.value = data.planned.toFixed(2);
  planEditError.textContent = '';
  planEditSheet.hidden = false;
  document.body.style.overflow = 'hidden';
  setPlanEditSavingState(false);

  requestAnimationFrame(() => {
    planEditInput.focus();
    planEditInput.select();
  });
}

function closePlanEditSheet(force = false) {
  if (isSavingPlanAmount && !force) return;

  planEditSheet.hidden = true;
  document.body.style.overflow = '';
  editingPlanCategory = null;
  planEditError.textContent = '';
}

async function savePlanEdit() {
  if (!editingPlanCategory || isSavingPlanAmount || !validatePlanEditInput()) return;

  const nextValue = round2(Number(planEditInput.value));
  const monthKey = new Date().toISOString().slice(0, 7);
  const fieldKey = `mb-${editingPlanCategory.section}-${editingPlanCategory.item}-budgeted`;
  const categoryKey = `${editingPlanCategory.section}:${editingPlanCategory.item}`;

  setPlanEditSavingState(true);

  if (appState.mode === APP_MODES.FREEDOM) {
    appState.workingPlan[fieldKey] = nextValue;
    appState.hasPendingChanges = Object.keys(appState.workingPlan).some(
      key => key.endsWith('-budgeted') && appState.workingPlan[key] !== appState.realityPlan[key]
    );
    lastUpdatedPlanKey = categoryKey;
    renderPlan();
    renderTopSpending();
    renderOverviewAccountSummary();
    renderTrendChart();
    setPlanEditSavingState(false);
    closePlanEditSheet(true);
    window.setTimeout(() => {
      if (lastUpdatedPlanKey === categoryKey) {
        lastUpdatedPlanKey = null;
        renderPlan();
      }
    }, 950);
    return;
  }

  try {
    await setDoc(
      doc(db, 'budget', 'monthlyBudget', 'months', monthKey),
      { [fieldKey]: nextValue },
      { merge: true }
    );

    monthlyBudgetState[fieldKey] = nextValue;
    appState.realityPlan[fieldKey] = nextValue;
    lastUpdatedPlanKey = categoryKey;
    renderPlan();
    renderTopSpending();
    closePlanEditSheet(true);

    window.setTimeout(() => {
      if (lastUpdatedPlanKey === categoryKey) {
        lastUpdatedPlanKey = null;
        renderPlan();
      }
    }, 950);
  } catch (error) {
    console.error('Unable to save planned amount:', error);
    planEditError.textContent = 'Unable to save this amount. Check your connection and try again.';
    setPlanEditSavingState(false);
  }
}

planEditInput?.addEventListener('input', validatePlanEditInput);
planEditInput?.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    savePlanEdit();
  }
});

document.getElementById('plan-edit-close')?.addEventListener('click', () => closePlanEditSheet());
planEditCancel?.addEventListener('click', () => closePlanEditSheet());
planEditSave?.addEventListener('click', savePlanEdit);

planEditSheet?.addEventListener('click', event => {
  if (event.target === planEditSheet) closePlanEditSheet();
});

function setAllPlanSectionsCollapsed(shouldCollapse) {
  PLAN_SECTIONS.forEach(section => {
    if (shouldCollapse) collapsedPlanSections.add(section.key);
    else collapsedPlanSections.delete(section.key);
  });

  localStorage.setItem(
    'financialFridayCollapsedPlanSections',
    JSON.stringify([...collapsedPlanSections])
  );

  renderPlan();
}

document.getElementById('plan-expand-all')?.addEventListener('click', () => {
  setAllPlanSectionsCollapsed(false);
});

document.getElementById('plan-collapse-all')?.addEventListener('click', () => {
  setAllPlanSectionsCollapsed(true);
});

document.getElementById('plan-section-grid')?.addEventListener('click', event => {
  const editRow = event.target.closest('.plan-row-edit');
  if (editRow) {
    openPlanEditSheet(
      editRow.dataset.planSection,
      editRow.dataset.planItem,
      editRow.dataset.planLabel
    );
    return;
  }

  const toggle = event.target.closest('.plan-card-toggle');
  if (!toggle) return;

  const card = toggle.closest('.plan-card');
  const sectionKey = card?.dataset.planSection;
  if (!card || !sectionKey) return;

  const willCollapse = !card.classList.contains('is-collapsed');
  card.classList.toggle('is-collapsed', willCollapse);
  toggle.setAttribute('aria-expanded', String(!willCollapse));

  if (willCollapse) collapsedPlanSections.add(sectionKey);
  else collapsedPlanSections.delete(sectionKey);

  localStorage.setItem(
    'financialFridayCollapsedPlanSections',
    JSON.stringify([...collapsedPlanSections])
  );
});

function refreshAccountViews() {
  renderAccounts();
  renderOverviewAccountSummary();
  renderTrendChart();
}

function renderAccounts() {
  Object.entries(accountState).forEach(([key, value]) => {
    const element = document.getElementById('account-' + key);
    if (element) element.textContent = fmt(value, 2);
  });

  const { cash, debt } = getAccountTotals();
  document.getElementById('account-total-cash').textContent = fmt(cash, 2);
  document.getElementById('account-total-debt').textContent = fmt(debt, 2);
}

function renderOverviewAccountSummary() {
  const { cash, debt, netWorth } = getAccountTotals();
  const isFreedom = appState.mode === APP_MODES.FREEDOM;
  const projectedNetWorth = round2(netWorth + (isFreedom ? getFreedomDifference() : 0));

  document.getElementById('hero-networth').textContent =
    (projectedNetWorth < 0 ? '-' : '') + fmt(Math.abs(projectedNetWorth));
  document.getElementById('hero-networth-label').textContent = isFreedom ? 'PROJECTED NET WORTH' : 'NET WORTH';
  document.getElementById('metric-cash').textContent = fmt(cash);
  document.getElementById('metric-debt').textContent = fmt(debt);

  const deltaElement = document.getElementById('hero-delta');
  if (weeklyTrendHistory.length === 0) {
    deltaElement.textContent = '';
    deltaElement.className = 'delta';
    return;
  }

  const delta = round2(projectedNetWorth - weeklyTrendHistory.at(-1));
  deltaElement.textContent = (delta >= 0 ? '▲ ' : '▼ ') + fmt(Math.abs(delta)) + ' this week';
  deltaElement.className = 'delta ' + (delta >= 0 ? 'up' : 'down');
}

function renderTrendChart() {
  const { netWorth } = getAccountTotals();
  const projectedNetWorth = round2(netWorth + (appState.mode === APP_MODES.FREEDOM ? getFreedomDifference() : 0));
  const trendData = [...weeklyTrendHistory, projectedNetWorth];

  if (trendChart) trendChart.destroy();

  trendChart = new Chart(document.getElementById('trend-chart'), {
    type: 'line',
    data: {
      labels: trendData.map(() => ''),
      datasets: [{
        data: trendData,
        borderColor: '#3fbf83',
        backgroundColor: 'rgba(63,191,131,0.12)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.35,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { display: false }, y: { display: false } }
    }
  });
}

function setActivePanel(panelName) {
  activePanel = panelName;

  document.querySelectorAll('.account-panel').forEach(panel => {
    const isFront = panel.dataset.panel === panelName;
    panel.classList.toggle('is-front', isFront);
    panel.classList.toggle('is-back', !isFront);
  });

  document.querySelectorAll('.carousel-dot').forEach(dot => {
    dot.classList.toggle('active', dot.dataset.targetPanel === panelName);
  });
}

function rotatePanel() {
  setActivePanel(activePanel === 'cash' ? 'debt' : 'cash');
}

document.getElementById('carousel-prev').addEventListener('click', rotatePanel);
document.getElementById('carousel-next').addEventListener('click', rotatePanel);

document.querySelectorAll('.carousel-dot').forEach(dot => {
  dot.addEventListener('click', () => setActivePanel(dot.dataset.targetPanel));
});

document.querySelectorAll('.account-panel').forEach(panel => {
  panel.addEventListener('click', event => {
    if (event.target.closest('.account-row')) return;
    setActivePanel(panel.dataset.panel);
  });

  panel.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setActivePanel(panel.dataset.panel);
    }
  });
});

const carousel = document.getElementById('account-carousel');
carousel.addEventListener('pointerdown', event => {
  swipeStartX = event.clientX;
});
carousel.addEventListener('pointerup', event => {
  if (swipeStartX === null) return;
  if (Math.abs(event.clientX - swipeStartX) > 45) rotatePanel();
  swipeStartX = null;
});
carousel.addEventListener('pointercancel', () => {
  swipeStartX = null;
});

function openBalanceModal(accountKey) {
  if (!(accountKey in accountState)) return;

  editingAccount = accountKey;
  document.getElementById('modal-title').textContent = accountLabels[accountKey];
  document.getElementById('modal-current-balance').textContent = fmt(accountState[accountKey], 2);
  modalInput.value = Number(accountState[accountKey]).toFixed(2);
  modalError.textContent = '';
  setSavingState(false);

  balanceModal.hidden = false;
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => {
    modalInput.focus();
    modalInput.select();
  });
}

function closeBalanceModal() {
  if (isSavingBalance) return;

  balanceModal.hidden = true;
  document.body.style.overflow = '';
  editingAccount = null;
  modalError.textContent = '';
}

function setSavingState(isSaving) {
  isSavingBalance = isSaving;
  modalSave.disabled = isSaving;
  modalCancel.disabled = isSaving;
  modalInput.disabled = isSaving;
  modalSave.classList.toggle('is-saving', isSaving);
  modalSave.setAttribute('aria-busy', String(isSaving));
}

async function saveEditedBalance() {
  if (!editingAccount || isSavingBalance) return;

  const rawValue = modalInput.value.trim();
  const nextValue = Number(rawValue);

  if (rawValue === '' || !Number.isFinite(nextValue) || nextValue < 0) {
    modalError.textContent = 'Enter a valid balance of $0 or more.';
    modalInput.focus();
    return;
  }

  const roundedValue = round2(nextValue);
  const previousValue = accountState[editingAccount];

  modalError.textContent = '';
  setSavingState(true);

  try {
    await setDoc(ACCOUNT_DOC, { [editingAccount]: roundedValue }, { merge: true });

    accountState[editingAccount] = roundedValue;
    refreshAccountViews();
    closeBalanceModalAfterSave();
    setAccountsMessage(
      `${accountLabels[editingAccount] ?? 'Account'} balance saved successfully.`,
      'success'
    );

    window.setTimeout(() => {
      if (accountsNote.classList.contains('is-success')) {
        setAccountsMessage('Balances are securely saved to your Financial Friday account.');
      }
    }, 3500);
  } catch (error) {
    console.error('Unable to save account balance:', error);
    accountState[editingAccount] = previousValue;
    modalError.textContent = 'Unable to save this balance. Check your connection and try again.';
    setSavingState(false);
  }
}

function closeBalanceModalAfterSave() {
  balanceModal.hidden = true;
  document.body.style.overflow = '';
  editingAccount = null;
  setSavingState(false);
}

document.querySelectorAll('.account-row').forEach(row => {
  row.addEventListener('click', event => {
    event.stopPropagation();
    openBalanceModal(row.dataset.account);
  });
});

document.getElementById('modal-close').addEventListener('click', closeBalanceModal);
modalCancel.addEventListener('click', closeBalanceModal);
modalSave.addEventListener('click', saveEditedBalance);

modalInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    saveEditedBalance();
  }
});

balanceModal.addEventListener('click', event => {
  if (event.target === balanceModal) closeBalanceModal();
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;

  if (!planEditSheet.hidden) {
    closePlanEditSheet();
    return;
  }

  if (!balanceModal.hidden) closeBalanceModal();
});

window.addEventListener('beforeunload', event => {
  if (appState.mode !== APP_MODES.FREEDOM || !appState.hasPendingChanges) return;
  event.preventDefault();
  event.returnValue = '';
});

[freedomIntro, realityDialog].forEach(backdrop => {
  backdrop?.addEventListener('click', event => {
    if (event.target !== backdrop) return;
    if (backdrop === freedomIntro) freedomIntro.hidden = true;
    if (backdrop === realityDialog) realityDialog.hidden = true;
  });
});

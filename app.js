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

const loginScreen = document.getElementById('login-screen');
const appShell = document.getElementById('app-shell');
const loginError = document.getElementById('login-error');
const balanceModal = document.getElementById('balance-modal');
const modalInput = document.getElementById('modal-new-balance');
const modalError = document.getElementById('modal-error');
const modalSave = document.getElementById('modal-save');
const modalCancel = document.getElementById('modal-cancel');
const accountsNote = document.querySelector('.accounts-note');

let accountState = { ...EMPTY_ACCOUNTS };
let weeklyTrendHistory = [];
let activePanel = 'cash';
let editingAccount = null;
let trendChart;
let swipeStartX = null;
let isSavingBalance = false;

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
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
document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));

document.querySelectorAll('.nav-item').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));
    button.classList.add('active');
    document.getElementById('view-' + button.dataset.view).classList.add('active');
  });
});

onAuthStateChanged(auth, async user => {
  if (!user) {
    loginScreen.style.display = 'flex';
    appShell.classList.remove('active');
    return;
  }

  loginScreen.style.display = 'none';
  appShell.classList.add('active');
  setGreeting();
  setPlanMonthLabel();

  try {
    await loadAppData();
  } catch (error) {
    console.error('Unable to load Financial Friday data:', error);
    setAccountsMessage('Unable to load account balances. Try refreshing the app.', 'error');
  }
});

async function loadAppData() {
  await Promise.all([
    loadAccountData(),
    loadWeeklyTrend(),
    loadTopSpending()
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

async function loadTopSpending() {
  const monthKey = new Date().toISOString().slice(0, 7);
  const snapshot = await getDoc(doc(db, 'budget', 'monthlyBudget', 'months', monthKey));
  const monthlyBudget = snapshot.exists() ? snapshot.data() : {};

  const categories = [
    { key: 'mb-purdue-groceries-actual', label: 'Groceries', icon: 'ti-shopping-cart' },
    { key: 'mb-purdue-gas-actual', label: 'Gas', icon: 'ti-gas-station' },
    { key: 'mb-purdue-dining-actual', label: 'Dining', icon: 'ti-coffee' },
    { key: 'mb-purdue-prescription-actual', label: 'Prescriptions', icon: 'ti-pill' },
    { key: 'mb-purdue-clothing-actual', label: 'Clothing', icon: 'ti-shirt' },
    { key: 'mb-purdue-pet-actual', label: 'Pet', icon: 'ti-paw' },
    { key: 'mb-purdue-entertainment-actual', label: 'Entertainment', icon: 'ti-device-tv' },
    { key: 'mb-purdue-amazon-actual', label: 'Amazon', icon: 'ti-package' },
    { key: 'mb-purdue-travel-actual', label: 'Travel', icon: 'ti-plane' },
    { key: 'mb-purdue-misc-actual', label: 'Misc', icon: 'ti-dots' }
  ];

  const topCategories = categories
    .map(category => ({ ...category, value: Number(monthlyBudget[category.key]) || 0 }))
    .filter(category => category.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const list = document.getElementById('top-spending-list');
  list.innerHTML = topCategories.length === 0
    ? '<p style="color:var(--text-faint); font-size:13px;">No spending logged yet this month.</p>'
    : topCategories.map(category => `
        <div class="spend-row">
          <div class="spend-icon">
            <i class="ti ${category.icon}" aria-hidden="true"></i>
          </div>
          <p class="s-name">${category.label}</p>
          <p class="s-amount">${fmt(category.value)}</p>
        </div>
      `).join('');
}

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

  document.getElementById('hero-networth').textContent =
    (netWorth < 0 ? '-' : '') + fmt(Math.abs(netWorth));
  document.getElementById('metric-cash').textContent = fmt(cash);
  document.getElementById('metric-debt').textContent = fmt(debt);

  const deltaElement = document.getElementById('hero-delta');
  if (weeklyTrendHistory.length === 0) {
    deltaElement.textContent = '';
    deltaElement.className = 'delta';
    return;
  }

  const delta = round2(netWorth - weeklyTrendHistory.at(-1));
  deltaElement.textContent = (delta >= 0 ? '▲ ' : '▼ ') + fmt(Math.abs(delta)) + ' this week';
  deltaElement.className = 'delta ' + (delta >= 0 ? 'up' : 'down');
}

function renderTrendChart() {
  const { netWorth } = getAccountTotals();
  const trendData = [...weeklyTrendHistory, netWorth];

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
  if (event.key === 'Escape' && !balanceModal.hidden) closeBalanceModal();
});

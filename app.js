import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

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

const loginScreen = document.getElementById('login-screen');
const appShell = document.getElementById('app-shell');
const loginError = document.getElementById('login-error');

const accountLabels = {
  navyFederal: 'Navy Federal',
  purdueFCU: 'Purdue Federal',
  savorOne: 'Capital One SavorOne',
  oneKey: 'Wells Fargo OneKey'
};

let accountState = { navyFederal: 0, purdueFCU: 0, savorOne: 0, oneKey: 0 };
let activePanel = 'cash';
let editingAccount = null;
let trendChart;
let swipeStartX = null;

function fmt(n, decimals = 0) {
  return '$' + Number(n).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function setGreeting() {
  const hour = new Date().getHours();
  const el = document.getElementById('greeting-time');
  if (hour < 12) el.textContent = 'Good morning';
  else if (hour < 18) el.textContent = 'Good afternoon';
  else el.textContent = 'Good evening';
}

async function attemptLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  loginError.textContent = '';
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    console.error('Login failed:', err);
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

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('view-' + btn.dataset.view).classList.add('active');
  });
});

onAuthStateChanged(auth, user => {
  if (user) {
    loginScreen.style.display = 'none';
    appShell.classList.add('active');
    setGreeting();
    loadOverview();
  } else {
    loginScreen.style.display = 'flex';
    appShell.classList.remove('active');
  }
});

async function loadOverview() {
  const acctSnap = await getDoc(doc(db, 'budget', 'accounts'));
  accountState = acctSnap.exists()
    ? { ...accountState, ...acctSnap.data() }
    : accountState;

  Object.keys(accountState).forEach(key => {
    accountState[key] = Number(accountState[key]) || 0;
  });

  renderAccounts();

  const cash = accountState.navyFederal + accountState.purdueFCU;
  const debt = accountState.savorOne + accountState.oneKey;
  const netWorth = cash - debt;

  document.getElementById('hero-networth').textContent = (netWorth < 0 ? '-' : '') + fmt(Math.abs(netWorth));
  document.getElementById('metric-cash').textContent = fmt(cash);
  document.getElementById('metric-debt').textContent = fmt(debt);

  const logSnap = await getDocs(query(collection(db, 'budget', 'weeklyLog', 'entries'), orderBy('date', 'asc')));
  const trendData = [];
  logSnap.forEach(entry => {
    const week = entry.data();
    const weekCash = (Number(week.navyFederal) || 0) + (Number(week.purdueFCU) || 0);
    const weekDebt = (Number(week.savorOne) || 0) + (Number(week.oneKey) || 0);
    trendData.push(weekCash - weekDebt);
  });
  trendData.push(netWorth);

  if (trendData.length >= 2) {
    const delta = trendData.at(-1) - trendData.at(-2);
    const deltaEl = document.getElementById('hero-delta');
    deltaEl.textContent = (delta >= 0 ? '▲ ' : '▼ ') + fmt(Math.abs(delta)) + ' this week';
    deltaEl.className = 'delta ' + (delta >= 0 ? 'up' : 'down');
  }

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

  const monthKey = new Date().toISOString().slice(0, 7);
  const mbSnap = await getDoc(doc(db, 'budget', 'monthlyBudget', 'months', monthKey));
  const mb = mbSnap.exists() ? mbSnap.data() : {};
  const spendCategories = [
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
  const top = spendCategories
    .map(category => ({ ...category, value: Number(mb[category.key]) || 0 }))
    .filter(category => category.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const listEl = document.getElementById('top-spending-list');
  listEl.innerHTML = top.length === 0
    ? '<p style="color:var(--text-faint); font-size:13px;">No spending logged yet this month.</p>'
    : top.map(category => `
        <div class="spend-row">
          <div class="spend-icon"><i class="ti ${category.icon}" aria-hidden="true"></i></div>
          <p class="s-name">${category.label}</p>
          <p class="s-amount">${fmt(category.value)}</p>
        </div>
      `).join('');
}

function renderAccounts() {
  Object.entries(accountState).forEach(([key, value]) => {
    const el = document.getElementById('account-' + key);
    if (el) el.textContent = fmt(value, 2);
  });
  document.getElementById('account-total-cash').textContent = fmt(accountState.navyFederal + accountState.purdueFCU, 2);
  document.getElementById('account-total-debt').textContent = fmt(accountState.savorOne + accountState.oneKey, 2);
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
carousel.addEventListener('pointerdown', event => { swipeStartX = event.clientX; });
carousel.addEventListener('pointerup', event => {
  if (swipeStartX === null) return;
  if (Math.abs(event.clientX - swipeStartX) > 45) rotatePanel();
  swipeStartX = null;
});
carousel.addEventListener('pointercancel', () => { swipeStartX = null; });

const balanceModal = document.getElementById('balance-modal');
const modalInput = document.getElementById('modal-new-balance');
const modalError = document.getElementById('modal-error');

function openBalanceModal(accountKey) {
  editingAccount = accountKey;
  document.getElementById('modal-title').textContent = accountLabels[accountKey];
  document.getElementById('modal-current-balance').textContent = fmt(accountState[accountKey], 2);
  modalInput.value = Number(accountState[accountKey]).toFixed(2);
  modalError.textContent = '';
  balanceModal.hidden = false;
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => modalInput.focus());
}

function closeBalanceModal() {
  balanceModal.hidden = true;
  document.body.style.overflow = '';
  editingAccount = null;
}

document.querySelectorAll('.account-row').forEach(row => {
  row.addEventListener('click', event => {
    event.stopPropagation();
    openBalanceModal(row.dataset.account);
  });
});
document.getElementById('modal-close').addEventListener('click', closeBalanceModal);
document.getElementById('modal-cancel').addEventListener('click', closeBalanceModal);
balanceModal.addEventListener('click', event => {
  if (event.target === balanceModal) closeBalanceModal();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !balanceModal.hidden) closeBalanceModal();
});

document.getElementById('modal-save').addEventListener('click', () => {
  const nextValue = Number(modalInput.value);
  if (!Number.isFinite(nextValue) || nextValue < 0) {
    modalError.textContent = 'Enter a valid balance of $0 or more.';
    return;
  }
  accountState[editingAccount] = Math.round(nextValue * 100) / 100;
  renderAccounts();
  closeBalanceModal();
});

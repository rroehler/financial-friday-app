import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
  import {
    getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut
  } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
  import {
    getFirestore, doc, getDoc, collection, query, orderBy, getDocs
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

  const loginScreen = document.getElementById('login-screen');
  const appShell = document.getElementById('app-shell');
  const loginError = document.getElementById('login-error');

  function fmt(n) {
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
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
      loginError.textContent = 'Login failed — check email/password.';
    }
  }
  document.getElementById('login-btn').addEventListener('click', attemptLogin);
  ['login-email', 'login-password'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); attemptLogin(); }
    });
  });
  document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('view-' + btn.dataset.view).classList.add('active');
    });
  });

  onAuthStateChanged(auth, (user) => {
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

  let trendChart;

  async function loadOverview() {
    const acctSnap = await getDoc(doc(db, 'budget', 'accounts'));
    const acct = acctSnap.exists() ? acctSnap.data() : { navyFederal: 0, purdueFCU: 0, savorOne: 0, oneKey: 0 };
    const cash = (Number(acct.navyFederal) || 0) + (Number(acct.purdueFCU) || 0);
    const debt = (Number(acct.savorOne) || 0) + (Number(acct.oneKey) || 0);
    const netWorth = cash - debt;

    document.getElementById('hero-networth').textContent = (netWorth < 0 ? '-' : '') + fmt(Math.abs(netWorth));
    document.getElementById('metric-cash').textContent = fmt(cash);
    document.getElementById('metric-debt').textContent = fmt(debt);

    const logSnap = await getDocs(query(collection(db, 'budget', 'weeklyLog', 'entries'), orderBy('date', 'asc')));
    const trendData = [];
    logSnap.forEach(d => {
      const w = d.data();
      const wc = (Number(w.navyFederal)||0) + (Number(w.purdueFCU)||0);
      const wd = (Number(w.savorOne)||0) + (Number(w.oneKey)||0);
      trendData.push(wc - wd);
    });
    trendData.push(netWorth);

    if (trendData.length >= 2) {
      const delta = trendData[trendData.length - 1] - trendData[trendData.length - 2];
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
      .map(c => ({ ...c, value: Number(mb[c.key]) || 0 }))
      .filter(c => c.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const listEl = document.getElementById('top-spending-list');
    listEl.innerHTML = top.length === 0
      ? '<p style="color:var(--text-faint); font-size:13px;">No spending logged yet this month.</p>'
      : top.map(c => `
        <div class="spend-row">
          <div class="spend-icon"><i class="ti ${c.icon}" aria-hidden="true"></i></div>
          <p class="s-name">${c.label}</p>
          <p class="s-amount">${fmt(c.value)}</p>
        </div>
      `).join('');
  }

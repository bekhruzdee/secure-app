const refs = {
  authView: document.getElementById('authView'),
  appView: document.getElementById('appView'),
  loginTab: document.getElementById('loginTab'),
  registerTab: document.getElementById('registerTab'),
  loginForm: document.getElementById('loginForm'),
  registerForm: document.getElementById('registerForm'),
  authStatus: document.getElementById('authStatus'),
  roleBadge: document.getElementById('roleBadge'),
  welcomeTitle: document.getElementById('welcomeTitle'),
  userPanel: document.getElementById('userPanel'),
  adminPanel: document.getElementById('adminPanel'),
  userTotalUsers: document.getElementById('userTotalUsers'),
  userStatusText: document.getElementById('userStatusText'),
  rangeLabel: document.getElementById('rangeLabel'),
  rangeSelect: document.getElementById('rangeSelect'),
  refreshBtn: document.getElementById('refreshBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  statusText: document.getElementById('statusText'),
  recentStatusText: document.getElementById('recentStatusText'),
  recentBody: document.getElementById('recentBody'),
  totalUsers: document.getElementById('totalUsers'),
  blockedXss: document.getElementById('blockedXss'),
  blockedCsrf: document.getElementById('blockedCsrf'),
  blockedSqli: document.getElementById('blockedSqli'),
  threatInfo: document.getElementById('threatInfo'),
  threatDetails: document.getElementById('threatDetails'),
  threatDist: document.getElementById('threatDist'),
  topPaths: document.getElementById('topPaths'),
  topIps: document.getElementById('topIps'),
  topStatsText: document.getElementById('topStatsText'),
};

const chartCtx = document.getElementById('timelineChart');
let timelineChart;
let csrfToken = '';
let refreshInFlight = null;
let accessToken = '';
const API_BASE = (() => {
  const stored = localStorage.getItem('api_base');
  if (stored) {
    return stored.replace(/\/$/, '');
  }

  if (window.location.protocol === 'file:' || window.location.port !== '3000') {
    return 'http://localhost:3000';
  }

  return '';
})();

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

function setStatus(text) {
  refs.statusText.textContent = text;
}

function setAuthStatus(text) {
  refs.authStatus.textContent = text;
}

function setRecentStatus(text) {
  refs.recentStatusText.textContent = text;
}

function switchAuthTab(tab) {
  const login = tab === 'login';
  refs.loginTab.classList.toggle('active', login);
  refs.registerTab.classList.toggle('active', !login);
  refs.loginForm.classList.toggle('hidden', !login);
  refs.registerForm.classList.toggle('hidden', login);
}

async function ensureCsrfToken() {
  if (csrfToken) {
    return csrfToken;
  }

  const response = await fetch(apiUrl('/auth/csrf-token'), {
    credentials: 'include',
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`CSRF token olib bo'lmadi (${response.status}): ${body}`);
  }

  const data = await response.json();
  csrfToken = data.csrfToken;
  return csrfToken;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`Request failed (${response.status}): ${body}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

function getAuthHeaders(extra = {}) {
  if (!accessToken) {
    return { ...extra };
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    ...extra,
  };
}

async function refreshSession() {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = postJson(apiUrl('/auth/refresh'), {})
    .then((result) => {
      if (result && result.access_token) {
        accessToken = result.access_token;
      }
      return result;
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

async function fetchAuthJson(url, options = {}, allowRefresh = true) {
  const requestOptions = {
    ...options,
    headers: getAuthHeaders(options.headers || {}),
  };

  try {
    return await fetchJson(url, requestOptions);
  } catch (error) {
    const status = Number(error?.status || 0);

    if (allowRefresh && status === 401) {
      await refreshSession();
      return fetchAuthJson(url, options, false);
    }

    throw error;
  }
}

async function postJson(url, body) {
  const token = await ensureCsrfToken();

  return fetchJson(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CSRF-Token': token,
    },
    body: JSON.stringify(body),
  });
}

function clearSession() {
  csrfToken = '';
  accessToken = '';
}

function updateCards(summary) {
  refs.totalUsers.textContent = summary.totalUsers;
  refs.blockedXss.textContent = summary.blocked.xss;
  refs.blockedCsrf.textContent = summary.blocked.csrf;
  refs.blockedSqli.textContent = summary.blocked.sqlInjection;
}

function showThreatInfo(threatType) {
  const items = document.querySelectorAll('.threat-item');
  items.forEach((item) => item.classList.add('hidden'));

  let infoId = 'xssInfo';
  let title = '🛡️ Security Guide';
  if (threatType === 'csrf') {
    infoId = 'csrfInfo';
  } else if (threatType === 'sql') {
    infoId = 'sqlInfo';
  }

  const info = document.getElementById(infoId);
  if (info) info.classList.remove('hidden');
}

function renderDistributionItem(label, count) {
  const div = document.createElement('div');
  div.className = 'dist-item';
  const percentage = Math.round((count / 100) * 100);
  div.innerHTML = `
    <span class="dist-label">${label} (${count})</span>
    <div class="dist-bar">
      <div class="dist-fill" style="width: ${Math.min(percentage, 100)}%"></div>
    </div>
  `;
  return div;
}

function renderDetailedStats(stats) {
  // Threat Distribution
  refs.threatDist.innerHTML = '';
  if (stats.typeDistribution && stats.typeDistribution.length > 0) {
    stats.typeDistribution.forEach((item) => {
      refs.threatDist.appendChild(
        renderDistributionItem(item.type.toUpperCase(), item.count),
      );
    });
  } else {
    refs.threatDist.innerHTML = '<p class="no-data">No threat data yet</p>';
  }

  // Top Paths
  refs.topPaths.innerHTML = '';
  if (stats.topPaths && stats.topPaths.length > 0) {
    stats.topPaths.forEach((item) => {
      refs.topPaths.appendChild(
        renderDistributionItem(item.path || '/unknown', item.count),
      );
    });
  } else {
    refs.topPaths.innerHTML = '<p class="no-data">No path data yet</p>';
  }

  // Top IPs
  refs.topIps.innerHTML = '';
  if (stats.topIps && stats.topIps.length > 0) {
    stats.topIps.forEach((item) => {
      refs.topIps.appendChild(renderDistributionItem(item.ip, item.count));
    });
  } else {
    refs.topIps.innerHTML = '<p class="no-data">No IP data yet</p>';
  }

  refs.topStatsText.textContent = `Total events: ${stats.totalEvents}`;
}

async function fetchDetailedStats(days) {
  try {
    return await fetchAuthJson(
      apiUrl(`/admin/metrics/detailed-stats?days=${encodeURIComponent(days)}`),
    );
  } catch (error) {
    console.error('Failed to fetch detailed stats:', error);
    return { typeDistribution: [], topPaths: [], topIps: [], totalEvents: 0 };
  }
}

function groupTimelineRows(rows) {
  const labelsSet = new Set();
  const grouped = {
    xss: {},
    csrf: {},
    sql_injection: {},
  };

  for (const row of rows) {
    if (!row || !row.bucket || !row.type || grouped[row.type] === undefined) {
      continue;
    }
    const label = new Date(row.bucket).toLocaleString();
    if (label === 'Invalid Date') {
      continue;
    }
    labelsSet.add(label);
    grouped[row.type][label] = Number(row.count) || 0;
  }

  const labels = Array.from(labelsSet).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );

  const toSeries = (type) => labels.map((label) => grouped[type][label] || 0);

  return {
    labels,
    xss: toSeries('xss'),
    csrf: toSeries('csrf'),
    sqlInjection: toSeries('sql_injection'),
  };
}

function renderChart(rows) {
  if (!chartCtx) {
    throw new Error('Timeline chart element not found');
  }

  const data = groupTimelineRows(rows);

  if (timelineChart) {
    timelineChart.destroy();
  }

  timelineChart = new Chart(chartCtx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: 'XSS blocked',
          data: data.xss,
          borderColor: '#d1495b',
          backgroundColor: 'rgba(209,73,91,0.15)',
          tension: 0.25,
          fill: true,
        },
        {
          label: 'CSRF blocked',
          data: data.csrf,
          borderColor: '#c77915',
          backgroundColor: 'rgba(199,121,21,0.15)',
          tension: 0.25,
          fill: true,
        },
        {
          label: 'SQL injection blocked',
          data: data.sqlInjection,
          borderColor: '#0f8b8d',
          backgroundColor: 'rgba(15,139,141,0.15)',
          tension: 0.25,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
        },
      },
      plugins: {
        legend: {
          position: 'top',
        },
      },
    },
  });
}

function renderRecentEvents(rows) {
  refs.recentBody.innerHTML = '';

  if (!rows.length) {
    refs.recentBody.innerHTML = '<tr><td colspan="5">No events found</td></tr>';
    return;
  }

  for (const row of rows) {
    const tr = document.createElement('tr');
    const timeTd = document.createElement('td');
    timeTd.textContent = new Date(row.createdAt).toLocaleString();

    const typeTd = document.createElement('td');
    const typePill = document.createElement('span');
    typePill.className = `event-type event-${row.type}`;
    typePill.textContent = row.type;
    typeTd.appendChild(typePill);

    const methodTd = document.createElement('td');
    methodTd.textContent = row.method;

    const pathTd = document.createElement('td');
    pathTd.className = 'path-cell';
    pathTd.textContent = row.path;

    const ipTd = document.createElement('td');
    ipTd.textContent = row.ip || '-';

    tr.append(timeTd, typeTd, methodTd, pathTd, ipTd);
    refs.recentBody.appendChild(tr);
  }
}

async function fetchUserCount() {
  const data = await fetchAuthJson(apiUrl('/users/count'));
  return Number(data.total || 0);
}

async function refreshAdminDashboard() {
  const days = refs.rangeSelect.value;
  setStatus('Loading metrics...');
  setRecentStatus('Loading recent events...');
  refs.topStatsText.textContent = 'Loading...';

  const [summaryRes, timelineRes, recentRes, detailedRes] =
    await Promise.allSettled([
      fetchAuthJson(
        apiUrl(`/admin/metrics/summary?days=${encodeURIComponent(days)}`),
      ),
      fetchAuthJson(
        apiUrl(
          `/admin/metrics/timeline?days=${encodeURIComponent(days)}&groupBy=day`,
        ),
      ),
      fetchAuthJson(apiUrl('/admin/metrics/recent?limit=30')),
      fetchDetailedStats(days),
    ]);

  const summary =
    summaryRes.status === 'fulfilled'
      ? summaryRes.value
      : { totalUsers: 0, blocked: { xss: 0, csrf: 0, sqlInjection: 0 } };
  const timeline = timelineRes.status === 'fulfilled' ? timelineRes.value : [];
  const recent = recentRes.status === 'fulfilled' ? recentRes.value : [];
  const detailedStats =
    detailedRes.status === 'fulfilled'
      ? detailedRes.value
      : { typeDistribution: [], topPaths: [], topIps: [], totalEvents: 0 };

  // 📊 Verify data in console
  console.log(
    `%c🔍 Security Data Verification (${new Date().toLocaleTimeString()})`,
    'color: #17324f; font-size: 14px; font-weight: bold;',
  );
  console.log(`Range: Last ${days} day(s)`);
  console.log('Summary:', summary);
  console.log('Timeline rows:', timeline.length);
  console.log('Recent events:', recent.length);
  console.log('Detailed stats:', detailedStats);

  updateCards(summary);
  renderChart(timeline);
  renderRecentEvents(recent);
  renderDetailedStats(detailedStats);

  const failedParts = [];
  if (summaryRes.status === 'rejected') failedParts.push('summary');
  if (timelineRes.status === 'rejected') failedParts.push('timeline');
  if (recentRes.status === 'rejected') failedParts.push('recent');
  if (detailedRes.status === 'rejected') failedParts.push('detailed-stats');

  if (failedParts.length) {
    setStatus(`⚠ Partial update: ${failedParts.join(', ')}`);
  } else {
    setStatus(`✅ Updated: ${new Date().toLocaleTimeString()}`);
  }

  setRecentStatus(`✅ Events analyzed: ${recent.length}`);
}

async function renderUserDashboard() {
  refs.userStatusText.textContent = 'Loading user metrics...';
  const totalUsers = await fetchUserCount();
  refs.userTotalUsers.textContent = String(totalUsers);
  refs.userStatusText.textContent = 'Authenticated';
}

async function showDashboardForUser(user) {
  refs.authView.classList.add('hidden');
  refs.appView.classList.remove('hidden');
  refs.welcomeTitle.textContent = `Welcome, ${user.username}`;

  const role = String(user.role || '').toLowerCase();
  const isAdmin = role === 'admin' || role === 'manager';

  refs.roleBadge.textContent = isAdmin ? 'Admin Session' : 'User Session';
  refs.adminPanel.classList.toggle('hidden', !isAdmin);
  refs.userPanel.classList.toggle('hidden', isAdmin);
  refs.rangeSelect.classList.toggle('hidden', !isAdmin);
  refs.rangeLabel.classList.toggle('hidden', !isAdmin);
  refs.refreshBtn.classList.toggle('hidden', !isAdmin);

  if (isAdmin) {
    try {
      await refreshAdminDashboard();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(message);
      setRecentStatus('Unable to load recent events');
    }
  } else {
    await renderUserDashboard();
  }
}

async function login(username, password) {
  const data = await fetchJson(apiUrl('/auth/login'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  accessToken = data.access_token || '';
  await showDashboardForUser(data.userData);
}

async function register(username, password) {
  await postJson(apiUrl('/auth/register'), { username, password });
}

async function restoreSession() {
  try {
    const me = await fetchAuthJson(apiUrl('/auth/me'));
    await showDashboardForUser(me);
  } catch (error) {
    clearSession();
    setAuthStatus('Session expired, login qayta qiling');
  }
}

refs.loginTab.addEventListener('click', () => switchAuthTab('login'));
refs.registerTab.addEventListener('click', () => switchAuthTab('register'));

refs.loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(refs.loginForm);

  try {
    setAuthStatus('Login in progress...');
    await login(form.get('username'), form.get('password'));
    setAuthStatus('Login success');
  } catch (error) {
    setAuthStatus(error.message);
  }
});

refs.registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(refs.registerForm);

  try {
    setAuthStatus('Register in progress...');
    await register(form.get('username'), form.get('password'));
    setAuthStatus('Register success, now login qiling');
    switchAuthTab('login');
  } catch (error) {
    setAuthStatus(error.message);
  }
});

refs.refreshBtn.addEventListener('click', async () => {
  try {
    await refreshAdminDashboard();
  } catch (error) {
    setStatus(error.message);
  }
});

// Threat card click handlers
const statsCards = document.querySelectorAll('[data-threat]');
statsCards.forEach((card) => {
  card.style.cursor = 'pointer';
  card.addEventListener('click', () => {
    const threatType = card.getAttribute('data-threat');
    showThreatInfo(threatType);
  });
  card.addEventListener('mouseenter', () => {
    card.style.opacity = '0.9';
  });
  card.addEventListener('mouseleave', () => {
    card.style.opacity = '1';
  });
});

refs.logoutBtn.addEventListener('click', async () => {
  try {
    const token = await ensureCsrfToken();
    await fetchJson(apiUrl('/auth/logout'), {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'CSRF-Token': token,
      },
    });
  } catch (error) {
    // Ignore logout error and clear local state anyway.
  } finally {
    clearSession();
    refs.appView.classList.add('hidden');
    refs.authView.classList.remove('hidden');
    setAuthStatus('Logged out');
  }
});

switchAuthTab('login');
setStatus('Waiting...');
setRecentStatus('Waiting...');
setAuthStatus('Ready');

// Initialize threat detail panel with XSS info
if (refs.threatDetails) {
  showThreatInfo('xss');
}

restoreSession();

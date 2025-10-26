const statusCard = {
  connection: document.getElementById('connection-status'),
  lastHeartbeat: document.getElementById('last-heartbeat'),
  ping: document.getElementById('ws-ping'),
  guildCount: document.getElementById('guild-count'),
  guildNames: document.getElementById('guild-names'),
  uptime: document.getElementById('uptime'),
  startedAt: document.getElementById('started-at'),
  sidebarDot: document.getElementById('sidebar-status'),
  sidebarText: document.getElementById('sidebar-status-text')
};

const consoleEl = document.getElementById('action-console');
const diagnosticsList = document.getElementById('diagnostics-list');
const environmentList = document.getElementById('environment-list');
const recentEventsList = document.getElementById('recent-events');

const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.forEach((lnk) => lnk.classList.remove('active'));
    link.classList.add('active');
  });
});

function setStatusIndicator(status) {
  const statusMap = {
    online: { text: 'Online', className: 'success' },
    offline: { text: 'Offline', className: 'error' },
    connecting: { text: 'Connecting…', className: 'warning' }
  };

  const meta = statusMap[status] || statusMap.connecting;
  statusCard.sidebarDot.style.background =
    meta.className === 'success'
      ? 'var(--success)'
      : meta.className === 'error'
      ? 'var(--danger)'
      : 'var(--warning)';
  statusCard.sidebarDot.style.boxShadow =
    meta.className === 'success'
      ? '0 0 12px rgba(34, 197, 94, 0.45)'
      : meta.className === 'error'
      ? '0 0 12px rgba(248, 113, 113, 0.45)'
      : '0 0 12px rgba(250, 204, 21, 0.45)';
  statusCard.sidebarText.textContent = meta.text;
}

function writeConsole(message, type = 'info') {
  const prefix =
    type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  const text = `[${new Date().toLocaleTimeString()}] ${prefix} ${message}`;
  consoleEl.textContent = `${text}\n\n${consoleEl.textContent}`.trim();
}

async function fetchJSON(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || response.statusText);
  }
  return response.json();
}

function updateList(element, items) {
  element.innerHTML = '';
  if (!items.length) {
    const li = document.createElement('li');
    li.textContent = 'No data available.';
    li.classList.add('warning');
    element.appendChild(li);
    return;
  }

  items.forEach(({ label, value, className }) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${label}:</strong> ${value}`;
    if (className) li.classList.add(className);
    element.appendChild(li);
  });
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return '—';
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffSec = Math.max(Math.floor(diffMs / 1000), 0);
  const hours = Math.floor(diffSec / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;
  const parts = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  parts.push(`${seconds}s ago`);
  return parts.join(' ');
}

async function refreshStatus() {
  try {
    const data = await fetchJSON('/api/status');
    const guildNames = Array.isArray(data.guilds?.names) ? data.guilds.names : [];
    const events = Array.isArray(data.recentEvents) ? data.recentEvents : [];

    statusCard.connection.textContent = (data.status || 'offline').toUpperCase();
    statusCard.lastHeartbeat.textContent = `Last heartbeat: ${formatRelativeTime(
      data.lastHeartbeat
    )}`;
    statusCard.ping.textContent =
      data.wsPing !== null && data.wsPing !== undefined ? `${data.wsPing} ms` : '—';
    statusCard.guildCount.textContent = data.guilds?.total ?? '—';
    statusCard.guildNames.textContent = guildNames.join(', ') || '—';
    statusCard.uptime.textContent = data.uptime?.human ?? '—';
    statusCard.startedAt.textContent = `Started: ${data.uptime?.startedAt ?? '—'}`;
    setStatusIndicator(data.status === 'online' ? 'online' : 'offline');

    updateList(diagnosticsList, [
      { label: 'Ready', value: data.ready ? 'Yes' : 'No', className: data.ready ? 'success' : 'warning' },
      { label: 'Latency', value: data.wsPing != null ? `${data.wsPing} ms` : 'Unavailable' },
      { label: 'Commands Loaded', value: data.commandsLoaded },
      { label: 'Memory Usage', value: data.memory.heapUsed }
    ]);

    updateList(environmentList, [
      { label: 'Node Version', value: data.environment.node },
      { label: 'Platform', value: data.environment.platform },
      { label: 'Process Uptime', value: data.environment.processUptime }
    ]);

    updateList(
      recentEventsList,
      events.map((evt) => ({
        label: evt.type,
        value: evt.detail,
        className: evt.level
      }))
    );

    writeConsole('Status updated successfully.', 'success');
  } catch (error) {
    writeConsole(`Failed to refresh status: ${error.message}`, 'error');
    setStatusIndicator('offline');
  }
}

async function performAction(endpoint, successMessage) {
  try {
    const data = await fetchJSON(endpoint, { method: 'POST' });
    const events = Array.isArray(data.events) ? data.events : [];
    writeConsole(successMessage, 'success');
    if (events.length) {
      updateList(
        recentEventsList,
        events.map((evt) => ({
          label: evt.type,
          value: evt.detail,
          className: evt.level
        }))
      );
    }
    await refreshStatus();
  } catch (error) {
    writeConsole(error.message || 'Action failed', 'error');
  }
}

async function runHealthCheck() {
  try {
    const data = await fetchJSON('/api/health-check');
    const events = Array.isArray(data.events) ? data.events : [];
    writeConsole(`Health check: ${data.summary}`, data.ok ? 'success' : 'warning');
    updateList(
      recentEventsList,
      events.map((evt) => ({
        label: evt.type,
        value: evt.detail,
        className: evt.level
      }))
    );
  } catch (error) {
    writeConsole(`Health check failed: ${error.message}`, 'error');
  }
}

document.getElementById('refresh-status').addEventListener('click', refreshStatus);
document.getElementById('reload-commands').addEventListener('click', () =>
  performAction('/api/reload-commands', 'Commands reloaded successfully.')
);
document.getElementById('sync-guilds').addEventListener('click', () =>
  performAction('/api/sync-guilds', 'Guild cache refreshed.')
);
document.getElementById('trigger-health-check').addEventListener('click', runHealthCheck);

refreshStatus();
setInterval(refreshStatus, 30_000);

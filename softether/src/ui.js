'use strict';

import { state, setAuth } from './state.js';
import { api } from './api.js';

const $ = (id) => document.getElementById(id);

// ─── Global status ──────────────────────────────────
export function showGlobalStatus(text, type = 'info') {
  const bar = $('global-status');
  const icon = $('global-status-icon');
  const textEl = $('global-status-text');
  const closeBtn = $('global-status-close');
  if (!bar || !icon || !textEl) return;
  bar.classList.remove('info', 'success', 'warning', 'error');
  bar.classList.add(type);
  icon.textContent = { info: 'ℹ', success: '✓', warning: '⚠', error: '✗' }[type] || 'ℹ';
  textEl.textContent = text;
  bar.classList.remove('hidden');
  if (closeBtn) closeBtn.onclick = () => bar.classList.add('hidden');
}

export function setStatus(text) {
  const el = $('status');
  if (el) el.textContent = text;
  if (text) {
    let type = 'info';
    const t = text.toLowerCase();
    if (t.includes('error') || t.includes('failed')) type = 'error';
    else if (t.includes('success') || t.includes('created') || t.includes('updated') || t.includes('deleted')) type = 'success';
    else if (t.includes('warning') || t.includes('select')) type = 'warning';
    showGlobalStatus(text, type);
  }
}

export function setLogsStatus(text) {
  const el = $('logs-status');
  if (el) el.textContent = text;
}

// ─── Tabs ─────────────────────────────────────────────
export function initTabs() {
  const tabs = document.querySelectorAll('#tabs button');
  tabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.tab;
      tabs.forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.add('hidden'));
      btn.classList.add('active');
      const panel = $('tab-' + name);
      if (panel) panel.classList.remove('hidden');
      state.activeTab = name;
    });
  });
}

export function setTabsEnabled(enabled) {
  document.querySelectorAll('#tabs button').forEach((btn) => {
    if (btn.dataset.tab !== 'login') btn.disabled = !enabled;
  });
}

// ─── Login ────────────────────────────────────────────
export function initLogin(onSuccess) {
  const loginBtn = $('login-btn');
  if (!loginBtn) return;
  loginBtn.addEventListener('click', async () => {
    const host = $('host').value.replace(/\/+$/, '');
    const password = $('password').value;
    if (!password) { setStatus('Enter admin password.'); return; }
    setStatus('Connecting...');
    try {
      setAuth(host, password);
      await api.test();
      setStatus('Login successful.');
      if (onSuccess) await onSuccess();
      setTabsEnabled(true);
    } catch (err) {
      setStatus('Login failed: ' + err.message);
    }
  });
}

// ─── Help functions ─────────────────────────────────
const HUB_TYPES = { 0: 'Standalone', 1: 'Static', 2: 'Dynamic' };
const AUTH_TYPES = { 0: 'Anonymous', 1: 'Password (SHA-0)', 2: 'Password (Plain)', 3: 'Certificate' };

function hubTypeLabel(value) { return HUB_TYPES[value] || 'Unknown'; }
function authTypeLabel(value) { return AUTH_TYPES[value] || 'Unknown'; }

function formatDate(dt) {
  if (!dt) return '—';
  try {
    return new Date(dt).toLocaleString('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  } catch (e) { return dt; }
}

// ─── V-Hub ────────────────────────────────────────────
let selectedHub = null;

export function initHubsTab() {
  const refreshBtn = $('hubs-refresh');
  const newBtn = $('hubs-new');
  const editBtn = $('hubs-edit');
  const deleteBtn = $('hubs-delete');

  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      setStatus('Loading hubs...');
      try {
        const result = await api.enumHub();
        renderHubs(result.HubList || []);
        setStatus('Hubs loaded.');
      } catch (err) { setStatus('Error: ' + err.message); }
    });
  }

  if (newBtn) newBtn.addEventListener('click', () => openHubModal(null));
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      if (!selectedHub) { setStatus('Select a hub first.'); return; }
      openHubModal(selectedHub);
    });
  }
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (!selectedHub) { setStatus('Select a hub first.'); return; }
      if (!confirm('Delete hub "' + selectedHub.HubName_str + '"? This cannot be undone!')) return;
      setStatus('Deleting ' + selectedHub.HubName_str + '...');
      try {
        await api.deleteHub(selectedHub.HubName_str);
        setStatus('Deleted: ' + selectedHub.HubName_str);
        selectedHub = null; editBtn.disabled = true; deleteBtn.disabled = true;
        refreshBtn.click();
      } catch (err) { setStatus('Delete error: ' + err.message); }
    });
  }
}

export function renderHubs(hubs) {
  state.hubs = hubs;
  const sel = $('users-hub');
  if (sel) {
    sel.innerHTML = '';
    hubs.forEach((h) => {
      const opt = document.createElement('option');
      opt.value = h.HubName_str; opt.textContent = h.HubName_str;
      sel.appendChild(opt);
    });
  }

  const tbody = document.querySelector('#hubs-table tbody');
  if (tbody) {
    tbody.innerHTML = '';
    hubs.forEach((h) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="radio" name="hub-select" value="${h.HubName_str}"></td>
        <td>${h.Online_bool ? '✅' : '❌'}</td>
        <td>${h.HubName_str}</td>
        <td>${hubTypeLabel(h.HubType_u32)}</td>
        <td>${h.NumUsers_u32}</td>
        <td>${h.NumSessions_u32}</td>
        <td>${h.NumGroups_u32}</td>
        <td>${h.NumLogin_u32}</td>
        <td>${formatDate(h.LastLoginTime_dt)}</td>
      `;
      const radio = tr.querySelector('input[type="radio"]');
      radio.addEventListener('change', () => {
        selectedHub = h;
        $('hubs-edit').disabled = false;
        $('hubs-delete').disabled = false;
      });
      tbody.appendChild(tr);
    });
  }
}

// ─── Users ────────────────────────────────────────────
let selectedUser = null;

export function initUsersTab() {
  const refreshBtn = $('users-refresh');
  const newBtn = $('users-new');
  const deleteBtn = $('users-delete');

  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      const hub = $('users-hub').value;
      if (!hub) { setStatus('Select a hub.'); return; }
      setStatus('Loading users...');
      try {
        const result = await api.enumUser(hub);
        renderUsers(result.UserList || []);
        setStatus('Users loaded.');
      } catch (err) { setStatus('Error: ' + err.message); }
    });
  }

  if (newBtn) {
    newBtn.addEventListener('click', () => {
      const hub = $('users-hub').value;
      if (!hub) { setStatus('Select a hub first.'); return; }
      openUserModal(null, hub);
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (!selectedUser) { setStatus('Select a user first.'); return; }
      if (!confirm('Delete user "' + selectedUser.Name_str + '"?')) return;
      const hub = $('users-hub').value;
      try {
        await api.deleteUser(hub, selectedUser.Name_str);
        setStatus('Deleted: ' + selectedUser.Name_str);
        selectedUser = null; deleteBtn.disabled = true;
        refreshBtn.click();
      } catch (err) { setStatus('Delete error: ' + err.message); }
    });
  }
}

export function renderUsers(users) {
  state.users = users;
  const total = users.length;
  const blocked = users.filter(u => u.DenyAccess_bool).length;
  const active = total - blocked;

  if ($('users-stat-total')) $('users-stat-total').textContent = total;
  if ($('users-stat-active')) $('users-stat-active').textContent = active;
  if ($('users-stat-blocked')) $('users-stat-blocked').textContent = blocked;

  const tbody = document.querySelector('#users-table tbody');
  if (tbody) {
    tbody.innerHTML = '';
    users.forEach((u) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="radio" name="user-select" value="${u.Name_str}"></td>
        <td>${u.DenyAccess_bool ? '❌' : '✅'}</td>
        <td>${u.Name_str}</td>
        <td>${u.Realname_utf || '—'}</td>
        <td>${u.GroupName_str || '—'}</td>
        <td>${u.Note_utf || '—'}</td>
        <td>${authTypeLabel(u.AuthType_u32)}</td>
        <td>${u.NumLogin_u32}</td>
        <td>${formatDate(u.LastLoginTime_dt)}</td>
        <td>${u.IsExpiresFilled_bool ? formatDate(u.Expires_dt) : 'No Expiration'}</td>
      `;
      const radio = tr.querySelector('input[type="radio"]');
      radio.addEventListener('change', () => {
        selectedUser = u;
        $('users-delete').disabled = false;
      });
      tbody.appendChild(tr);
    });
  }
}

// ─── Logs ─────────────────────────────────────────────
let cachedLogs = null, currentPage = 0;
const LOGS_PER_PAGE = 10;
let currentPageContent = '';

export function initLogsTab() {
  const refreshBtn = $('logs-refresh');
  const mergeBtn = $('logs-merge');
  const prevBtn = $('logs-prev');
  const nextBtn = $('logs-next');
  const copyBtn = $('logs-copy');
  const fileInput = $('logs-file');
  const searchInput = $('logs-search');
  const searchBtn = $('logs-search-btn');
  const clearSearchBtn = $('logs-clear-search');

  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      setLogsStatus('Loading log files...');
      try {
        const result = await api.enumLogFile();
        cachedLogs = (result.LogFiles || []).sort((a, b) => (b.FilePath_str || '').localeCompare(a.FilePath_str || ''));
        currentPage = 0; updatePageInfo();
        renderLogs(cachedLogs);
        setLogsStatus('Loaded ' + cachedLogs.length + ' log files.');
      } catch (err) { setLogsStatus('Error: ' + err.message); }
    });
  }

  if (mergeBtn) mergeBtn.addEventListener('click', async () => { await loadPage(currentPage); applySearchIfAny(); });
  if (prevBtn) prevBtn.addEventListener('click', async () => { if (currentPage > 0) { currentPage--; updatePageInfo(); await loadPage(currentPage); applySearchIfAny(); } });
  if (nextBtn) nextBtn.addEventListener('click', async () => {
    if (cachedLogs && currentPage < Math.ceil(cachedLogs.length / LOGS_PER_PAGE) - 1) {
      currentPage++; updatePageInfo(); await loadPage(currentPage); applySearchIfAny();
    }
  });
  if (searchBtn) searchBtn.addEventListener('click', applySearchIfAny);
  if (searchInput) searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') applySearchIfAny(); });
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if ($('logs-content')) $('logs-content').textContent = currentPageContent;
      setLogsStatus('Search cleared');
    });
  }
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const content = $('logs-content').textContent;
      if (!content) return;
      try {
        await navigator.clipboard.writeText(content);
        setLogsStatus('Copied to clipboard.');
      } catch (err) { setLogsStatus('Copy error: ' + err.message); }
    });
  }
  if (fileInput) fileInput.addEventListener('change', async () => { if (fileInput.value) await loadSingleLog(fileInput.value); });
}

function applySearchIfAny() {
  const searchInput = $('logs-search');
  if (!searchInput || !searchInput.value.trim()) return;
  const query = searchInput.value.trim().toLowerCase();
  if (!currentPageContent) { setLogsStatus('No content loaded.'); return; }

  const lines = currentPageContent.split('\n').filter(l => l.toLowerCase().includes(query));
  if (lines.length === 0) {
    $('logs-content').textContent = '=== No matches for "' + query + '" in current page ===\n\n(Click "Sledećih 10" to search next page)';
    setLogsStatus('0 matches');
  } else {
    $('logs-content').textContent = `=== ${lines.length} matches for "${query}" ===\n\n` + lines.join('\n');
    setLogsStatus(lines.length + ' matches');
  }
}

function updatePageInfo() {
  const pageInfo = $('logs-page-info');
  if (pageInfo) {
    const totalPages = cachedLogs ? Math.ceil(cachedLogs.length / LOGS_PER_PAGE) : 0;
    pageInfo.textContent = 'Strana ' + (currentPage + 1) + '/' + (totalPages || 1);
  }
}

async function loadPage(page) {
  if (!cachedLogs || cachedLogs.length === 0) return;
  const pageFiles = cachedLogs.slice(page * LOGS_PER_PAGE, (page + 1) * LOGS_PER_PAGE);
  setLogsStatus('Loading page ' + (page + 1) + '...');
  const chunks = [];
  for (const f of pageFiles) {
    const name = f.FilePath_str || f.FilePath || f;
    try {
      const r = await api.readLogFile(name, 0, 65536);
      chunks.push('=== ' + name + ' ===\n' + atob(r.Buffer_bin || ''));
    } catch (e) { chunks.push('=== ' + name + ' === (error)'); }
  }
  currentPageContent = chunks.join('\n\n');
  $('logs-content').textContent = currentPageContent;
  setLogsStatus('Page ' + (page + 1) + ' loaded.');
}

async function loadSingleLog(name) {
  setLogsStatus('Reading ' + name + '...');
  try {
    const result = await api.readLogFile(name, 0, 65536);
    currentPageContent = atob(result.Buffer_bin || '');
    $('logs-content').textContent = currentPageContent;
    setLogsStatus('Loaded ' + name);
  } catch (err) { setLogsStatus('Error: ' + err.message); }
}

export function renderLogs(logs) {
  state.logs = logs;
  const datalist = $('logs-list');
  if (datalist) {
    datalist.innerHTML = '';
    logs.forEach((f) => {
      const opt = document.createElement('option');
      opt.value = f.FilePath_str || f.FilePath || f;
      datalist.appendChild(opt);
    });
  }
}

// ─── Hub Modal ────────────────────────────────────────
 async function openHubModal(hub) {
  const modal = $('hub-modal');
  if (!modal) return;

  $('hub-modal-title').textContent = hub ? 'Edit Hub — ' + hub.HubName_str : 'New Hub';
  $('hub-modal-name').value = hub ? hub.HubName_str : '';
  $('hub-modal-name').disabled = !!hub;
  $('hub-modal-type').value = hub ? hub.HubType_u32 : 0;
  $('hub-modal-online').checked = hub ? hub.Online_bool : true;
   if (hub) {
    try {
      const fullHub = await api.getHub(hub.HubName_str);
      $('hub-modal-maxsession').value = fullHub.MaxSession_u32 || 0;
    } catch (e) {
      $('hub-modal-maxsession').value = 0;
    }
  } else {
    $('hub-modal-maxsession').value = 0;
  } 
  $('hub-modal-noenum').checked = hub ? hub.NoEnum_bool : false;
  $('hub-modal-adminpass').value = '';
  $('hub-modal-adminpass-confirm').value = '';

  modal.classList.remove('hidden');

  const saveBtn = $('hub-modal-save');
  const cancelBtn = $('hub-modal-cancel');
  const newSave = saveBtn.cloneNode(true);
  const newCancel = cancelBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newSave, saveBtn);
  cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

  newCancel.addEventListener('click', () => modal.classList.add('hidden'));

  newSave.addEventListener('click', async () => {
    const name = $('hub-modal-name').value.trim();
    if (!name) return;
    if ($('hub-modal-adminpass').value !== $('hub-modal-adminpass-confirm').value) {
      setStatus('Passwords do not match.'); return;
    }

    const params = {
      HubName_str: name,
      HubType_u32: parseInt($('hub-modal-type').value, 10),
      Online_bool: $('hub-modal-online').checked,
      MaxSession_u32: parseInt($('hub-modal-maxsession').value, 10) || 0,
      NoEnum_bool: $('hub-modal-noenum').checked,
    };
    if ($('hub-modal-adminpass').value) params.AdminPasswordPlainText_str = $('hub-modal-adminpass').value;

    try {
      if (hub) await api.setHub(params);
      else await api.createHub(params);
      setStatus('Hub saved.');
      modal.classList.add('hidden');
      $('hubs-refresh').click();
    } catch (err) { setStatus('Error: ' + err.message); }
  });
}

// ─── User Modal (New only) ────────────────────────────
function openUserModal(user, hub) {
  const modal = $('user-modal');
  if (!modal) return;

  $('user-modal-title').textContent = 'New User';
  $('user-modal-name').value = '';
  $('user-modal-realname').value = '';
  $('user-modal-group').value = '';
  $('user-modal-note').value = '';
  $('user-modal-authtype').value = 1;
  $('user-modal-password').value = '';
  $('user-modal-deny').checked = false;

  modal.classList.remove('hidden');

  const saveBtn = $('user-modal-save');
  const cancelBtn = $('user-modal-cancel');
  const newSave = saveBtn.cloneNode(true);
  const newCancel = cancelBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newSave, saveBtn);
  cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

  newCancel.addEventListener('click', () => modal.classList.add('hidden'));

  newSave.addEventListener('click', async () => {
    const name = $('user-modal-name').value.trim();
    if (!name) { setStatus('Enter user name.'); return; }

    const newUser = {
      Name_str: name,
      Realname_utf: $('user-modal-realname').value.trim(),
      GroupName_str: $('user-modal-group').value.trim(),
      Note_utf: $('user-modal-note').value.trim(),
      AuthType_u32: parseInt($('user-modal-authtype').value, 10),
      DenyAccess_bool: $('user-modal-deny').checked,
      Expires_dt: '1970-01-01T00:00:00.000Z',
      IsExpiresFilled_bool: false,
      policy: [],
    };

    const pass = $('user-modal-password').value;
    if (newUser.AuthType_u32 === 1 || newUser.AuthType_u32 === 2) {
      if (pass) newUser.Auth_Password_str = pass;
    }

    try {
      await api.createUser(hub, newUser);
      setStatus('User created: ' + name);
      modal.classList.add('hidden');
      $('users-refresh').click();
    } catch (err) { setStatus('Error: ' + err.message); }
  });
}

// ─── Server Tab ───────────────────────────────────────
export function initServerTab() {
  const refreshBtn = $('server-refresh');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      setStatus('Loading server info...');
      
      try {
        // 1. Take info about server
        const info = await api.getServerInfo();
        $('server-name').textContent = info.ServerHostName_str || '—';
        $('server-version').textContent = info.ServerVersionString_str || '—';
        $('server-os').textContent = info.OsProductName_str || '—';

        // 2. Take list of  ports
        const ports = await api.enumListener();
        const tbody = document.querySelector('#server-ports-table tbody');
        if (tbody) {
          tbody.innerHTML = '';
          (ports.ListenerList || []).forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>${p.Ports_u32}</td>
              <td>${p.Enables_bool ? '✅ Enabled' : '❌ Disabled'}</td>
            `;
            tbody.appendChild(tr);
          });
        }

        // 3. Take a list of bridges
        try {
          const bridges = await api.enumLocalBridge();
          const bTbody = document.querySelector('#server-bridges-table tbody');
          if (bTbody) {
            bTbody.innerHTML = '';
            (bridges.LocalBridgeList || []).forEach(b => {
              const tr = document.createElement('tr');
              tr.innerHTML = `
                <td>${b.HubNameLB_str || '—'}</td>
                <td>${b.DeviceName_str || '—'}</td>
                <td>${b.TapMode_bool ? 'TAP' : 'Direct'}</td>
                <td>${b.Online_bool ? '✅ Online' : '❌ Offline'}</td>
              `;
              bTbody.appendChild(tr);
            });
          }
        } catch (e) {
          console.warn('Local Bridge error:', e.message);
        }

        setStatus('Server info loaded.');
      } catch (err) {
        setStatus('Error: ' + err.message);
      }
    });
  }
}

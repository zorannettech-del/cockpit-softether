'use strict';

import { state } from './state.js';
import { api } from './api.js';

const $ = (id) => document.getElementById(id);

export function initDashboard() {
  const refreshBtn = $('dashboard-refresh');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', refreshDashboard);
  }

  const openLogsBtn = $('dashboard-open-logs');
  if (openLogsBtn) {
    openLogsBtn.addEventListener('click', () => {
      const logsBtn = document.querySelector('#tabs button[data-tab="logs"]');
      if (logsBtn) logsBtn.click();
    });
  }
}

export async function refreshDashboard() {
  const statusEl = $('dashboard-status');
  if (statusEl) statusEl.textContent = 'Loading...';

  try {
    // 1. Server status
    const status = await api.getServerStatus();

    setText('dashboard-hubs', status.NumHubTotal_u32 || 0);
    setText('dashboard-users', status.NumUsers_u32 || 0);
    setText('dashboard-sessions', status.NumSessionsTotal_u32 || 0);

    // 2. Server info, hostname
    const info = await api.getServerInfo();
    const version = info.ServerVersionString_str || 'unknown';
    const hostname = info.ServerHostName_str || 'unknown';
    const buildDate = (info.ServerBuildDate_dt || '').split('T')[0];

    if (statusEl) {
      statusEl.textContent = hostname + ' — ' + version + ' (' + buildDate + ')';
    }

    // 3. Recent logs
    await loadRecentLogs();

  } catch (err) {
    if (statusEl) statusEl.textContent = 'Error: ' + err.message;
  }
}

async function loadRecentLogs() {
  const logsEl = $('dashboard-logs');
  if (!logsEl) return;

  try {
    const files = await api.enumLogFile();
    const list = files.LogFiles || [];
    if (list.length === 0) {
      logsEl.textContent = 'No log files.';
      return;
    }

    const firstName = list[0].FilePath_str || list[0].FilePath || '';
    if (!firstName) {
      logsEl.textContent = 'No file path.';
      return;
    }

    const result = await api.readLogFile(firstName, 0, 4096);

    let content = '';
    try {
      content = atob(result.Buffer_bin || '');
    } catch (e) {
      content = '(cannot decode log)';
    }

    const lines = content.split('\n').filter((l) => l.trim()).slice(-20);
    logsEl.textContent = lines.join('\n') || 'No entries.';
  } catch (err) {
    logsEl.textContent = 'Error loading logs: ' + err.message;
  }
}

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}

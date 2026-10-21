'use strict';

import { state } from './state.js';
import { api } from './api.js';
import * as ui from './ui.js';
import * as dashboard from './dashboard.js';

function init() {
  // debug
  // window.api = api;
  //window.state = state;

  // Start sinhro. theme
  try {
    const parentHtml = window.parent.document.documentElement;
    const isDark = parentHtml.classList.contains('pf-theme-dark');
    document.documentElement.classList.toggle('pf-theme-dark', isDark);
  } catch (e) {
    // cross-origin
  }

  // folow
  try {
    const parentHtml = window.parent.document.documentElement;
    const observer = new MutationObserver(() => {
      const isDark = parentHtml.classList.contains('pf-theme-dark');
      document.documentElement.classList.toggle('pf-theme-dark', isDark);
    });
    observer.observe(parentHtml, {
      attributes: true,
      attributeFilter: ['class'],
    });
  } catch (e) {
    // cross-origin 
  }

  ui.initTabs();
  ui.initHubsTab();
  ui.initUsersTab();
  ui.initLogsTab();
  ui.initServerTab();
  dashboard.initDashboard();
  ui.setTabsEnabled(false);

  ui.initLogin(async () => {
  try {
    const result = await api.enumHub();
    const hubs = result.HubList || [];
    state.hubs = hubs;
    ui.renderHubs(hubs);

    const dashBtn = document.querySelector('#tabs button[data-tab="dashboard"]');
    if (dashBtn) dashBtn.click();
    dashboard.refreshDashboard();
  } catch (err) {
    ui.setStatus('Login OK, but EnumHub failed: ' + err.message);
  }
});

}

// DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

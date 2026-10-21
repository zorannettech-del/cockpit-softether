'use strict';

export const state = {
  host: 'https://127.0.0.1:5555',
  password: '',
  currentHub: null,
  hubs: [],
  users: [],
  logs: [],
  sessions: [],
  activeTab: 'login',
};

export function setAuth(host, password) {
  state.host = host.replace(/\/+$/, '');
  state.password = password;
}

export function clearAuth() {
  state.password = '';
  state.currentHub = null;
  state.hubs = [];
  state.users = [];
  state.logs = [];
  state.sessions = [];
}

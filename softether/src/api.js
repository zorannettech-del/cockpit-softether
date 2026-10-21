'use strict';

  import { state } from './state.js';

  // ─── RPC call ────────────────────────────────────────
  async function rpc(method, params = {}, hub = null) {
  const finalParams = hub
    ? { ...params, HubName_str: hub }
    : params;

  const args = [
    'curl', '-k', '-s', '-X', 'POST',
    '-H', 'Content-Type: application/json',
    '-H', 'X-VPNADMIN-PASSWORD: ' + state.password,
  ];

  const payload = JSON.stringify({
    jsonrpc: '2.0',
    id: '1',
    method: method,
    params: finalParams,
  });

  args.push('--data-binary', payload, state.host + '/api/');

  const out = await cockpit.spawn(args, {
    superuser: 'try',
    err: 'message',
  });

  let data;
  try {
    data = JSON.parse(out);
  } catch (e) {
    throw new Error('Invalid JSON from server: ' + out.slice(0, 200));
  }

  if (data.error) {
    throw new Error('RPC ' + method + ' failed: ' + JSON.stringify(data.error));
  }

  return data.result;
 }

  // ─── API ──────────────────────────────────────────────
  export const api = {
  // ─── Server ──────────────────────────────────────────
  test: function () {
    return rpc('Test', { IntValue_u32: 0 });
  },

  getServerInfo: function () {
    return rpc('GetServerInfo');
  },

  getServerStatus: function () {
    return rpc('GetServerStatus');
  },
  enumListener: function () {
    return rpc('EnumListener');
  },
  enumLocalBridge: function () {
    return rpc('EnumLocalBridge');
  },

  // ─── Virtual Hub ─────────────────────────────────────
  enumHub: function () {
    return rpc('EnumHub');
  },

  getHub: function (hub) {
    return rpc('GetHub', {}, hub);
  },

  getHubStatus: function (hub) {
    return rpc('GetHubStatus', {}, hub);
  },

  // ─── Hub Management ──────────────────────────────────
  createHub: function (params) {
    return rpc('CreateHub', params);
  },

  setHub: function (params) {
    return rpc('SetHub', params);
  },

  deleteHub: function (hub) {
    return rpc('DeleteHub', { HubName_str: hub });
  },

  // ─── Users ───────────────────────────────────────────
  enumUser: function (hub) {
    return rpc('EnumUser', {}, hub);
  },

  getUser: function (hub, name) {
    return rpc('GetUser', { Name_str: name }, hub);
  },

  setUser: function (hub, user) {
    return rpc('SetUser', { User: user }, hub);
  },

  createUser: function (hub, user) {
  const payload = {
    HubName_str: hub,
    Name_str: user.Name_str,
    Realname_utf: user.Realname_utf || '',
    Note_utf: user.Note_utf || '',
    AuthType_u32: user.AuthType_u32,
    UsePolicy_bool: true,
    'policy:Access_bool': true,
    'policy:MaxConnection_u32': 32,
    'policy:TimeOut_u32': 20,
  };

  if (user.Auth_Password_str) {
    payload.Auth_Password_str = user.Auth_Password_str;
  }

  return rpc('CreateUser', payload, hub);

  },

  deleteUser: function (hub, name) {
    return rpc('DeleteUser', { Name_str: name }, hub);
  },

  // ─── Sessions ────────────────────────────────────────
  enumSession: function (hub) {
    return rpc('EnumSession', {}, hub);
  },

  // ─── Logs ────────────────────────────────────────────
  enumLogFile: function () {
    return rpc('EnumLogFile');
  },

  readLogFile: function (filePath, offset, size) {
    return rpc('ReadLogFile', {
      FilePath_str: filePath,
      Offset_u32: offset || 0,
      Size_u32: size || 65536,
    });
  },

  readLogFileFull: function (filePath, maxBytes) {
    return rpc('ReadLogFile', {
      FilePath_str: filePath,
      Offset_u32: 0,
      Size_u32: maxBytes || 1048576,
    });
  },
};

# SoftEther VPN - Cockpit Plugin

A modern, web-based management interface for SoftEther VPN, built as a plugin for [Cockpit](https://cockpit-project.org/). 

## 🎯 Motivation
SoftEther VPN is an incredibly powerful and lightweight (14MB) VPN server. However, the official graphical management tool (Windows Manager) only runs on Windows. This project aims to provide a native, web-based, cross-platform alternative for Linux administrators, allowing them to manage their VPN infrastructure directly from the browser.

## ✨ Features
- **Dashboard:** Quick overview of server status, hubs, and active sessions.
- **Server Info:** View server details, active listening ports, and local bridge configurations (Read-only).
- **Virtual Hubs (V-Hub):** View hub statistics, create new hubs, edit existing ones, and delete them.
- **Users:** View detailed user lists, create new users, and delete existing users.
- **Logs:** Advanced log viewer with pagination (10 files per page) and deep search capabilities within the loaded logs.
- **Global Status Bar:** Real-time feedback on all actions (Success, Error, Warning).

## ⚠️ Known Limitations (SoftEther JSON-RPC API)
We believe in transparency. SoftEther's JSON-RPC API has several documented bugs and limitations. Because of this, some features are intentionally disabled:
- **Edit User (Disabled):** The `SetUser` API call is fundamentally flawed (resets user data if not sent perfectly). We are waiting for an official fix from the SoftEther team.
- **Modifying Ports/Bridges (Disabled):** The JSON-RPC API does not support `EnableListener`/`DisableListener` (returns Error 33).
- **V-Hub Type Changing:** Can only be changed on Clustered VPN Servers.

## 🚀 Roadmap & Current Status
We are actively developing this project. Here is what we are working on:

- [ ] **PatternFly Migration:** We are preparing to migrate the current UI to Red Hat's PatternFly design system for a more native Cockpit look and feel.
- [ ] **Wait for Upstream Fixes:** We are waiting for the SoftEther team to provide a more accessible and stable JSON-RPC API (specifically fixing `SetUser` and `Listener` modifications).
- [ ] **Continuous Development:** We will continue to improve the existing WebUI, adding more features as soon as the SoftEther API allows it.
- [ ] **User Policy Editor:** Planned once the `SetUser` API is fixed upstream.
- [ ] **Multi-language support (i18n):** Coming in future releases.

## 🛠️ Installation
1. Clone this repository into your Cockpit plugins directory:
   ```bash
   git clone https://github.com/your-username/cockpit-softether.git /usr/share/cockpit/softether
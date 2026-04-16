<div align="center">
  <img src="https://myprox.app/logo.png" alt="MyProx Logo" width="120" />
  <h1>MyProxmox (MyProx)</h1>
  <p><strong>The modern, secure, and beautiful mobile companion for Proxmox Virtual Environment & Backup Server.</strong></p>

  <p>
    <a href="https://github.com/MyProxmox/myprox/actions"><img src="https://github.com/MyProxmox/myprox/workflows/Backend%20CI/badge.svg" alt="Backend Build"></a>
    <a href="https://github.com/MyProxmox/myprox/actions"><img src="https://github.com/MyProxmox/myprox/workflows/Mobile%20CI/badge.svg" alt="Mobile Build"></a>
    <a href="https://myprox.app"><img src="https://img.shields.io/badge/Website-myprox.app-purple.svg" alt="Website"></a>
  </p>
</div>

---

## 📱 About MyProx

MyProx is a comprehensive ecosystem designed to manage your Proxmox Homelab or Production infrastructure directly from your iOS or Android device. It uses bank-grade AES-256 encryption and a zero-trust architecture to ensure your local infrastructure remains safe.

### ✨ Key Features

- **PVE & PBS Support**: Manage VMs, LXC containers, and Backup datastores seamlessly.
- **Native Action Console**: Start, stop, and reboot VMs remotely.
- **VNC & SPICE Mobile Console**: Full graphical access from your smartphone.
- **Live System Diagnostics**: Real-time graphs for CPU, RAM, and storage utilization.
- **Zero-Trust Cloud Relay**: Secure remote access without exposing port 8006 to the internet.
- **iCloud Sync**: Automatically backup your server configurations to your Apple ID.
- **Push Notifications**: Receive alerts for node outages or backup failures.

---

## 🏗️ Architecture

This repository is a **Monorepo** containing all the microservices and frontends that power MyProx.

| Component | Description | Technologies |
| :--- | :--- | :--- |
| 📁 `mobile/` | The cross-platform mobile application. | React Native, Expo, Zustand |
| 📁 `backend/` | The core API managing users, subscriptions & cloud tunnels. | Node.js, Express, PostgreSQL, Stripe |
| 📁 `website/` | The public marketing website (myprox.app). | Next.js, React, CSS Modules |
| 📁 `agent/` | The lightweight binary installed on user's PVE nodes. | Golang |
| 📁 `relay/` | The high-performance WebSocket relay server. | Golang, Redis |

---

## 🚀 Deployment (Production)

The entire backend infrastructure is containerized and deployed via Docker Compose and secured behind Cloudflare Tunnels.

```bash
# Clone the repository
git clone https://github.com/MyProxmox/myprox.git
cd myprox

# Set environment variables
cp .env.production.example .env.production

# Deploy using Docker Compose
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 📄 License & Legal

Copyright © 2026 MyProxmox. All rights reserved. 

*Disclaimer: MyProx is an independent software application and is not affiliated with, endorsed by, or sponsored by Server Release GmbH or the official Proxmox project.*

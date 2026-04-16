# Plan Phase 6 — Console VNC & Gestion du Serveur (Updates)

Ce plan décrit les prochaines étapes pour intégrer des fonctionnalités d'administration avancées du serveur Proxmox dans MyProx.

## Objectifs 🎯
1. **Console VNC** : Pouvoir interagir avec les écrans des VMs et containers (QEMU/LXC) directement depuis l'application mobile.
2. **Paramètres du Serveur (Node)** : Afficher les informations globales du nœud Proxmox.
3. **Mise à jour (Updates)** : Lister et appliquer les mises à jour système du nœud Proxmox disponibles via APT.

---

## 1. Console VNC (NoVNC)

### Approche Technique
Le moyen le plus fiable et performant d'intégrer la console sur mobile est d'utiliser un composant `WebView` (via `react-native-webview`) qui charge l'interface NoVNC native de Proxmox.

*   **Mode Local** : L'URL ciblera directement l'IP locale (ex: `https://[IP]:8006/?console=[kvm|lxc]&novnc=1&vmid=[ID]&node=[NODE]`).
*   **Mode Cloud** : Le comportement exact devra être adapté. Si le Cloud Relay proxyfie le websocket NoVNC, nous l'utiliserons. Sinon, nous pourrons passer par une route backend qui génère un ticket VNC et expose un WebSocket.

### Modifications Backend (`ProxmoxService.ts` & `vms.ts`)
*   **[NOUVEAU]** `POST /api/v1/servers/:serverId/vms/:vmid/vnc`
    *   Crée un ticket d'accès VNC via l'API Proxmox (`POST /nodes/{node}/{type}/{vmid}/vncproxy`).
    *   Retourne les informations nécessaires : `ticket`, `port`, `cert`, et URL.

### Modifications Mobile
*   **[NOUVEAU]** Installation de `react-native-webview`.
*   **[NOUVEAU]** Composant `VncScreen.tsx` : Ouvre la webview en mode paysage forcée (via `expo-screen-orientation`) avec un clavier virtuel superposé en option.
*   **[MODIF]** `VMDetailsScreen.tsx` : Ajout d'un 4ème bouton `Console` dans le bloc d'actions.

---

## 2. Paramètres & Statut du Nœud (Node)

### Modifications Backend (`servers.ts` & `ProxmoxService.ts`)
Actuellement, nous ne gérons les serveurs qu'en tant que points d'entrée. Nous devons exposer les statistiques globales du serveur hôte :
*   **[NOUVEAU]** `GET /api/v1/servers/:serverId/status` : Retourne l'état global (`GET /api2/json/nodes/{node}/status`) tel que l'uptime du serveur, l'usage total CPU, RAM, Swap et le Load Average.

### Modifications Mobile
*   **[NOUVEAU]** Ajout d'un écran `ServerSettingsScreen.tsx` (accessible depuis un bouton ⚙️ sur le `DashboardScreen` pour le serveur ciblé).
*   *Design* : Jauges globales (CPU/RAM du serveur), version de Proxmox.

---

## 3. Gestion des Mises à jour (APT)

### Approche Technique
Proxmox expose une API dédiée pour l'outil de paquets APT.

### Modifications Backend
*   **[NOUVEAU]** `GET /api/v1/servers/:serverId/updates` : Récupère la liste des paquets à mettre à jour (`GET /nodes/{node}/apt/update`).
*   **[NOUVEAU]** `POST /api/v1/servers/:serverId/updates/refresh` : Lance une recherche des mises à jour (`POST /nodes/{node}/apt/update`).

### Modifications Mobile
*   **[NOUVEAU]** Intégration sur la page `ServerSettingsScreen` (ou un sous-onglet `System Updates`).
*   Affichage d'un badge rouge si des mises à jour sont disponibles.
*   Liste scrollable des paquets concernés (nom, date, version courante, nouvelle version).
*   Bouton "Actualiser" (Refresh).
*   *(Note) L'application d'updates majeurs via API peut être risquée : nous nous concentrerons pour l'instant sur la notification visuelle et le rafraîchissement, l'application via commande APT nécessitant potentiellement une confirmation et gestion des timeout API.*

---

## 💡 User Review Required

> [!WARNING]
> **Expérience VNC Cloud** : Le mode Local fonctionnera bien via WebView car le terminal mobile tape directement sur le réseau du Proxmox.
> **Question pour le mode Cloud** : Le relay proxy actuel MyProx transfère les requêtes HTTP. Les websockets VNC de Proxmox (le protocole novnc) sont difficiles à proxyfier ! Souhaitez-vous que la Console VNC ne soit dispo **qu'en mode Local** pour l'instant, ou devons-nous impérativement prévoir un proxy complet WebSocket VNC dans l'agent MyProx ?

> [!IMPORTANT]
> **Updates Automatiques** : Souhaitez-vous un bouton pour forcer l'installation de toutes les mises à jour (équivalent `apt-get dist-upgrade`) depuis l'appli mobile, malgré les risques d'interruption réseau sur mobile pendant l'update ? Ou préférez-vous que l'application soit uniquement "Read-Only / Alertes" pour les mises à jour ?

Validez ce plan ou vos préférences et nous pourrons commencer le développement !

# MyProx — Roadmap & TODO

Dernière mise à jour : 2026-04-16  
Source de vérité : analyse du codebase + phase6.md + phase7.md + lessons.md

---

## ✅ Fait (vérifié dans le code)

### App Mobile
- [x] Auth — register / login / logout / refresh token
- [x] Dashboard serveurs avec animations spring
- [x] Liste VMs & Containers (tabs)
- [x] Start / Stop / Restart VM et Container
- [x] VMDetailsScreen — stats + actions + bouton VNC
- [x] VncScreen — NoVNC via WebView, rotation landscape automatique
- [x] ServerSettingsScreen — statut nœud / APT updates / cluster logs
- [x] OnboardingScreen — mode local/cloud toggle + agent token affiché
- [x] SettingsScreen — plan info, dark mode toggle, logout
- [x] ErrorBoundary
- [x] Dark mode complet (`useTheme` + `appStore`)
- [x] i18n fr/en (`i18n.ts`)
- [x] TrialModal (upsell plan limit)
- [x] `eas.json` configuré (dev / preview / production)
- [x] `app.json` — bundleId `com.myprox.app`, version 1.0.0

### Backend
- [x] Auth routes (register, login, logout, refresh)
- [x] Servers routes (list, add local/cloud, delete, mode toggle)
- [x] VMs routes (list, action, vnc-ticket)
- [x] Node routes (status, storage, APT updates, upgrade, logs)
- [x] Cloud routes (relay-status, regenerate-token)
- [x] Users routes, Subscriptions routes, Stripe routes
- [x] Rate limiter (désactivé en dev)
- [x] Middleware auth JWT
- [x] ProxmoxService — auth form-urlencoded, toutes les actions VM/CT
- [x] CloudProxmoxService — même interface via relay tunnel
- [x] RelayService — proxy + isAgentConnected
- [x] Encryption AES-256-CBC pour mots de passe Proxmox
- [x] Seed dev (`npm run seed`) → compte test@test.test + serveur HomeProx

### Relay & Agent
- [x] Relay Go — WebSocket hub, auth JWT, proxy HTTP→WS, métriques
- [x] Agent Go — reconnexion auto, re-auth Proxmox sur 401, concurrence goroutines
- [x] `AGENT_SETUP.md` — guide déploiement complet

### Infrastructure
- [x] Docker Compose complet (postgres + redis + api + relay)
- [x] Migrations DB 001→004
- [x] CI/CD GitHub Actions (test → build GHCR → deploy SSH)
- [x] Production déployée via Cloudflare Tunnel
- [x] Site vitrine Next.js — landing, pricing, docs, tous composants

---

## ⏳ À faire

### 🔴 Priorité haute — fonctionnalités manquantes visibles

#### 1. Delete Server (UI manquante — route existe)
- [ ] Swipe-to-delete ou bouton poubelle dans DashboardScreen sur ServerCard
- [ ] Alert de confirmation avant suppression
- [ ] `serverStore.deleteServer` existe déjà ✓, route `DELETE /api/v1/servers/:id` existe ✓

#### 2. Badge offline nœud sur Dashboard
- [ ] Appel périodique à `/node/status` en arrière-plan (ou via refresh)
- [ ] Badge rouge "Hors-ligne" sur ServerCard si le nœud ne répond pas
- [ ] Mentionné dans `phase7.md` mais pas implémenté

#### 3. Monitoring RRD — graphes CPU/RAM temps réel par VM
- [ ] Backend : `GET /api/v1/servers/:id/vms/:vmid/stats?node=X&type=qemu` → appel Proxmox `/nodes/{node}/qemu/{vmid}/rrddata`
- [ ] Mobile : barres ou graphe simple dans VMDetailsScreen (sans dépendance lourde)
- [ ] Mentionné dans `phase7.md` comme fonctionnalité phare ("Real-time CPU & RAM")

#### 4. Tests Backend (CI passe mais ne teste rien)
- [ ] `backend/src/__tests__/auth.test.ts` — register, login (duplicate token bug → `lessons.md`), logout
- [ ] `backend/src/__tests__/servers.test.ts` — add local, list, delete
- [ ] `backend/src/__tests__/vms.test.ts` — list, action start/stop
- [ ] Jest + supertest déjà dans `package.json` ✓, config `jest.config.ts` à créer

---

### 🟡 Priorité moyenne

#### 5. PBS — Proxmox Backup Server
- [ ] OnboardingScreen : toggle PVE / PBS (champ `server_type` en DB ✓)
- [ ] Backend : routes PBS
  - `GET /api/v1/servers/:id/datastores` → `/api2/json/nodes/{node}/storage` (type=pbs)
  - `GET /api/v1/servers/:id/tasks` → logs GC / Prune / Verify
- [ ] Dashboard : badge 🖥️ PVE vs 💾 PBS sur ServerCard
- [ ] Plan limits : Free = 1 PBS, Premium = illimité (mentionné dans `phase7.md`)
- [ ] Mettre à jour PricingTable du site vitrine si nécessaire

#### 6. Push Notifications
- [ ] `expo-notifications` dans le mobile
- [ ] Backend : `POST /api/v1/notifications/register` — enregistre le push token
- [ ] Backend : logique d'envoi via Expo Push API
- [ ] Alertes : nœud offline, mise à jour Proxmox disponible, erreur backup PBS
- [ ] Prérequis : compte Apple Developer actif (APNs) + Firebase (Android)

#### 7. Refresh token agent (UI manquante — route existe)
- [ ] Bouton "Régénérer le token" dans ServerSettingsScreen pour serveurs cloud
- [ ] Afficher le nouveau token + option copier
- [ ] Route `POST /api/v1/cloud/regenerate-token/:id` existe ✓

---

### 🟢 Priorité basse

#### 8. iCloud Sync (Premium)
- [ ] `expo-secure-store` + iCloud KVS (`@react-native-community/async-storage` avec iCloud)
- [ ] Restauration auto des serveurs sur nouvel appareil Apple (même Apple ID)
- [ ] Limité au compte Apple de l'utilisateur — zéro accès backend

#### 9. Animations UI complémentaires
- [ ] Skeleton loader DashboardScreen (remplacer ActivityIndicator)
- [ ] Haptic feedback sur actions VM (`expo-haptics`)
- [ ] Transition entre tabs VMListScreen

#### 10. Fix mineur : relay/pkg/relay/relay.go
- [ ] `RegisterAgent` utilise `interface{ Close() error }` au lieu de `*websocket.Conn`
  → non bloquant car jamais appelé, mais à corriger pour cohérence

#### 11. EAS Build — TestFlight & Google Play
- [ ] `eas.json` est configuré ✓, `app.json` bundleId est défini ✓
- [ ] Lancer `eas build --profile production --platform ios` (nécessite Expo account)
- [ ] Soumettre à TestFlight via `eas submit --platform ios`
- [ ] Build Android APK → Google Play Beta

---

## 🔧 CI/CD — Secrets GitHub à configurer

`Settings → Secrets and variables → Actions` du repo `MyProxmox/myprox`.

### Secrets (chiffrés)
| Nom | Valeur |
|-----|--------|
| `DEPLOY_PRIVATE_KEY` | Contenu clé SSH privée (ex: `cat ~/.ssh/myprox_deploy`) |

### Variables (non-chiffrées)
| Nom | Exemple |
|-----|---------|
| `DEPLOY_HOST` | IP du VPS (ex: `51.x.x.x`) |
| `DEPLOY_USER` | User SSH (ex: `ubuntu`) |

### Générer une clé dédiée
```bash
ssh-keygen -t ed25519 -f ~/.ssh/myprox_deploy -C "github-actions"
ssh-copy-id -i ~/.ssh/myprox_deploy.pub user@VPS_IP
```

### .env sur le VPS (jamais dans le repo)
```env
DATABASE_URL=postgresql://myprox_user:PASS@postgres:5432/myprox
JWT_SECRET=...              # min 32 chars
JWT_REFRESH_SECRET=...
ENCRYPTION_KEY=...          # exactement 32 chars
API_RELAY_SECRET=...
NODE_ENV=production
CORS_ORIGINS=https://myprox.app
```

---

## 📋 Ordre d'exécution recommandé

| # | Tâche | Effort | Impact |
|---|-------|--------|--------|
| 1 | Delete server UI | 30 min | Fonctionnalité basique manquante |
| 2 | Monitoring RRD | 2h | Très attendu — "real-time monitoring" |
| 3 | Badge offline nœud | 1h | UX qualité prod |
| 4 | Tests backend | 3h | Débloque CI réel |
| 5 | PBS support | 4h | Différenciateur fort |
| 6 | EAS Build iOS | 1h | TestFlight dès que prêt |
| 7 | Push notifications | 4h | Nécessite Apple Developer ($99/an) |
| 8 | iCloud sync | 3h | Premium feature |

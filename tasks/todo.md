# MyProx — Roadmap & TODO

Dernière mise à jour : 2026-04-16

---

## ✅ Fait

### Phase 1 — MVP Local
- [x] Auth (register / login / logout / refresh token)
- [x] Dashboard serveurs
- [x] Liste VMs & Containers
- [x] Start / Stop / Restart VM et Container
- [x] VMDetailsScreen (stats + actions)
- [x] ErrorBoundary
- [x] Rate limiter (désactivé en dev)
- [x] Compte de test seed (`test@test.test` / `test`)

### Phase 2 — Cloud Relay
- [x] Relay Go (WebSocket tunnel)
- [x] Agent local Go (NAT traversal)
- [x] Mode local/cloud par serveur
- [x] CloudProxmoxService (même interface que local)
- [x] Agent token généré à l'ajout d'un serveur cloud
- [x] Route relay-status

### Phase 7 (partiel)
- [x] Console VNC (NoVNC via WebView, rotation landscape)
- [x] Node Status — CPU, RAM, stockage
- [x] APT Updates — liste paquets + upgrade avec confirmation
- [x] Cluster Logs — lecture `/cluster/log`
- [x] ServerSettingsScreen (3 onglets : Statut / Mises à jour / Logs)
- [x] Migration DB `server_type` pour PBS

### DevOps
- [x] Docker Compose (postgres + redis + api + relay)
- [x] CI/CD GitHub Actions (test → build → deploy SSH)
- [x] Dark mode complet
- [x] i18n (fr/en)
- [x] Production déployée via Cloudflare Tunnel

---

## ⏳ À faire

### 🔴 Priorité haute

#### Delete Server (quick win)
- [ ] Bouton "Supprimer" dans DashboardScreen (swipe ou long press sur ServerCard)
- [ ] Confirmation Alert avant suppression
- [ ] Route backend `DELETE /api/v1/servers/:id` existe déjà ✓
- [ ] Mettre à jour `serverStore.deleteServer`

#### Monitoring RRD (valeur immédiate)
- [ ] Backend : `GET /api/v1/servers/:id/vms/:vmid/stats` — appel Proxmox `/nodes/{node}/qemu/{vmid}/rrddata`
- [ ] Mobile : mini-graphe CPU/RAM dans VMDetailsScreen (barres simples ou `victory-native`)

#### Tests Backend (CI ne vérifie rien sans eux)
- [ ] `auth.test.ts` — register, login, refresh, logout
- [ ] `servers.test.ts` — add (local), list, delete
- [ ] `vms.test.ts` — list VMs, action start/stop
- [ ] Config Jest + supertest déjà dans `package.json` ✓

---

### 🟡 Priorité moyenne

#### PBS — Proxmox Backup Server
- [ ] Étendre formulaire OnboardingScreen : toggle PVE / PBS
- [ ] Backend : routes PBS — `/datastores`, logs GC/Prune/Verify
- [ ] Dashboard : badge distinctif 🖥️ PVE vs 💾 PBS
- [ ] Champ `server_type` déjà en DB ✓

#### Push Notifications
- [ ] Intégration `expo-notifications`
- [ ] Backend : endpoint d'envoi via Expo Push API
- [ ] Alertes : nœud offline, mise à jour dispo
- [ ] Prérequis : compte Apple Developer actif (APNs)

#### Refresh token agent cloud
- [ ] Bouton "Régénérer le token" dans ServerSettingsScreen (cloud mode)
- [ ] Route `POST /api/v1/cloud/regenerate-token/:id` existe déjà ✓

---

### 🟢 Priorité basse

#### Site Vitrine (`/website`)
Structure Next.js existante : `page.tsx`, `pricing/`, `docs/`
- [ ] Landing page : hero section, features (tunnel, VNC, PBS), screenshots app, CTA download
- [ ] Pricing page : Free vs Premium, bouton Stripe checkout
- [ ] Docs page : guide install agent local, variables d'env, self-hosting

#### Animations UI
- [ ] Transition entre tabs dans VMListScreen
- [ ] Skeleton loader sur DashboardScreen (pendant fetchServers)
- [ ] Haptic feedback sur actions VM (start/stop)

#### TestFlight & Google Play Beta
- [ ] `eas.json` configuré (preview + production profiles)
- [ ] `app.json` : bundle ID, version, icônes finales
- [ ] Build iOS → EAS Cloud → TestFlight
- [ ] Build Android → EAS Cloud → Google Play Beta
- [ ] Prérequis : compte Expo EAS + Apple Developer + Google Play Console

---

## 🔧 CI/CD — Secrets GitHub à configurer

Aller dans `Settings → Secrets and variables → Actions` du repo `MyProxmox/myprox`.

### Secrets (chiffrés)
| Nom | Valeur |
|-----|--------|
| `DEPLOY_PRIVATE_KEY` | Contenu de la clé SSH privée (ex: `~/.ssh/myprox_deploy`) |

### Variables (non-chiffrées)
| Nom | Valeur |
|-----|--------|
| `DEPLOY_HOST` | IP du VPS de production (ex: `51.x.x.x`) |
| `DEPLOY_USER` | Utilisateur SSH (ex: `ubuntu` ou `root`) |

### Générer une clé dédiée deploy
```bash
ssh-keygen -t ed25519 -f ~/.ssh/myprox_deploy -C "github-actions"
# Copier la clé publique sur le VPS :
ssh-copy-id -i ~/.ssh/myprox_deploy.pub user@VPS_IP
```

### .env sur le VPS (à créer manuellement)
Fichier `~/myprox/.env` — jamais dans le repo :
```env
DATABASE_URL=postgresql://myprox_user:PASS@postgres:5432/myprox
JWT_SECRET=...           # min 32 chars
JWT_REFRESH_SECRET=...
ENCRYPTION_KEY=...       # exactement 32 chars
API_RELAY_SECRET=...
NODE_ENV=production
CORS_ORIGINS=https://myprox.app
```

---

## 📋 Ordre d'exécution suggéré

1. **Delete server** — 30 min, quick win visible
2. **Monitoring RRD** — graphes dans VMDetails, très demandé
3. **Tests backend** — débloque le CI proprement
4. **PBS support** — différenciateur fort
5. **Site vitrine** — nécessaire avant beta publique
6. **EAS Build** — TestFlight en dernier
7. **Push notifications** — nécessite Apple Developer ($99/an)

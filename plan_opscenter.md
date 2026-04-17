# MyProx — Ops Center : Plan d'Implémentation

## Vision

L'**Ops Center** est une interface web de gestion complète, séparée du site vitrine, accessible via `ops.myprox.app` (ou `localhost:3002` en dev). Elle permet à l'utilisateur de piloter l'intégralité de son infrastructure Proxmox depuis un navigateur — avec la même fluidité que l'app mobile, mais avec plus de puissance et de surface d'affichage.

> C'est le "cockpit" de MyProx : dashboard temps réel, gestion VMs/LXC, monitoring nœuds, backups PBS, console VNC, logs — le tout dans une UI moderne et cohérente.

---

## Architecture technique

### Positionnement dans le monorepo

```
myprox/
├── backend/        ← API Node.js existante (réutilisée telle quelle)
├── relay/          ← Go relay existant
├── website/        ← Site vitrine marketing (Next.js)
├── mobile/         ← App React Native
├── ops/            ← 🆕 Ops Center (Next.js App Router)
└── docker-compose.yml  ← à étendre avec le nouveau service
```

### Stack

| Couche | Choix | Raison |
|---|---|---|
| Framework | **Next.js 15** (App Router) | SSR/SSG, routing, même stack que website |
| Auth | JWT Bearer via le backend existant | Réutilisation totale |
| UI | Tailwind CSS + shadcn/ui | Composants riches, cohérence visuelle |
| Charts | **Recharts** | Léger, composable, React natif |
| Terminal/Console | **xterm.js** | Standard industrie pour les consoles web |
| Temps réel | **SSE** (Server-Sent Events) via l'API | Monitoring live sans WebSocket complexe |
| State | **Zustand** | Même lib que le mobile |
| Icons | **Lucide React** | Même lib que le website |

### Intégration avec l'API existante

L'Ops Center consomme **la même API** que l'app mobile — aucun backend nouveau n'est nécessaire. Les routes déjà disponibles couvrent presque tout :

```
✅ /api/auth/*          Authentification
✅ /api/servers/*       Gestion serveurs Proxmox
✅ /api/vms/*           VMs et LXC (list, actions, tickets VNC)
✅ /api/nodes/*         Statut nœuds, APT, logs cluster
✅ /api/pbs/*           Proxmox Backup Server
✅ /api/users/*         Gestion utilisateurs (admin)
⚠️  /api/nodes/metrics  À ajouter : SSE pour streaming métriques temps réel
```

---

## Phases d'implémentation

### Phase 1 — Foundation (Sprint 1)
**Scaffolding, auth, layout de base**

#### Structure du projet `ops/`

```
ops/
├── app/
│   ├── layout.tsx          ← Layout global (sidebar + header)
│   ├── (auth)/
│   │   └── login/page.tsx  ← Page de connexion
│   └── (dashboard)/
│       ├── layout.tsx      ← Layout protégé avec auth check
│       ├── page.tsx        ← Dashboard principal
│       └── ...
├── components/
│   ├── Sidebar.tsx         ← Navigation latérale
│   ├── Header.tsx          ← Header avec user menu
│   └── ui/                 ← shadcn/ui components
├── lib/
│   ├── api.ts              ← Client axios vers le backend
│   ├── auth.ts             ← Gestion tokens JWT
│   └── store.ts            ← Zustand global state
├── package.json
└── Dockerfile
```

**Livrables phase 1 :**
- [ ] Projet Next.js initialisé dans `ops/`
- [ ] Page login avec JWT (réutilise l'endpoint `/api/auth/login`)
- [ ] Layout sidebar responsive (dark/light mode)
- [ ] Route guard middleware (redirect si non authentifié)
- [ ] Service Docker ajouté dans `docker-compose.yml` (port 3002)
- [ ] Cloudflare Tunnel configuré pour `ops.myprox.app`

---

### Phase 2 — Dashboard Global (Sprint 2)
**Vue d'ensemble de l'infrastructure**

#### Page `/` — Overview

```
┌─────────────────────────────────────────────────────┐
│  🟢 3 serveurs  |  12 VMs actives  |  2 updates     │
├──────────┬──────────────────────────────────────────┤
│          │  CPU Global    RAM Global    Storage      │
│ Sidebar  │  [====  42%]  [======60%]  [===  35%]   │
│          ├──────────────────────────────────────────┤
│          │  Serveurs                                 │
│          │  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│          │  │ pve-01  │ │ pve-02  │ │ pve-03  │   │
│          │  │ 🟢 Online│ │ 🟢 Online│ │ 🔴 Offline│  │
│          │  └─────────┘ └─────────┘ └─────────┘   │
│          ├──────────────────────────────────────────┤
│          │  Activité récente (15 derniers events)    │
└──────────┴──────────────────────────────────────────┘
```

**Widgets :**
- **Stat cards** : serveurs total/online, VMs running, RAM globale, updates disponibles
- **Server cards** : statut ping, CPU/RAM mini-bars, lien rapide
- **Activity feed** : logs cluster temps réel (SSE)
- **Alerts** : VMs hors ligne, disques > 85%

---

### Phase 3 — Gestion VMs & LXC (Sprint 3)
**Cœur de l'Ops Center**

#### Page `/vms` — Liste unifiée

- Tableau avec colonnes : Nom, Type (VM/LXC), Serveur, Nœud, Status, CPU%, RAM, Disk, Actions
- Filtres : par serveur, par status, par type
- Recherche full-text
- Actions en masse (start/stop/restart multi-sélection)
- Tri par colonne

#### Page `/vms/[serverId]/[vmid]` — Détail VM

```
┌─────────────────────────────────────────────────────┐
│  ubuntu-web-01  │  VM 101  │  🟢 Running             │
├──────────────┬──────────────────────────────────────┤
│  [▶ Start]   │  Vue synthétique                     │
│  [■ Stop]    │  CPU: [chart 1h] │ RAM: [chart 1h]   │
│  [↺ Restart] │  Network I/O     │ Disk I/O           │
│  [📸 Snap]   ├──────────────────────────────────────┤
│  [🖥 Console]│  Onglets: Config │ Network │ Snapshots│
└──────────────┴──────────────────────────────────────┘
```

**Fonctionnalités :**
- Charts CPU/RAM en temps réel (RRD data via API)
- Actions : start/stop/restart/pause/hibernate
- **Console VNC** intégrée dans la page via iframe noVNC (Proxmox expose noVNC nativement)
- Gestion snapshots : liste, créer, rollback, supprimer
- Configuration : vcpu, mémoire (lecture seule dans un premier temps)

---

### Phase 4 — Monitoring Nœuds (Sprint 4)
**Visibilité fine sur chaque hyperviseur**

#### Page `/nodes` — Vue globale nœuds

- Cards par nœud avec : CPU%, RAM%, uptime, version PVE, load average
- État des services Proxmox

#### Page `/nodes/[serverId]` — Détail nœud

**Onglet Statut :**
- Graphiques historiques CPU, RAM, SWAP (1h/6h/24h/7j)
- Storage pools avec barre de progression
- Network interfaces (rx/tx)
- Informations système : kernel, version PVE

**Onglet Mises à jour APT :**
- Liste des paquets à mettre à jour
- Bouton `apt dist-upgrade` avec confirmation
- Historique des upgrades

**Onglet Logs :**
- Cluster task log avec filtres (error/warning/info)
- Export en `.txt`

---

### Phase 5 — Backup & Storage PBS (Sprint 5)
**Gestion des sauvegardes**

#### Page `/backups` — Overview PBS

- Connexions PBS configurées
- Jobs de backup : liste, statut, prochaine exécution
- Stockage PBS : utilisé/total par datastore

#### Page `/backups/[pbsId]` — Détail PBS

- Inventaire des backups par VM/LXC
- Actions : restore, delete, verify
- Logs des jobs récents
- Planification (cron schedule visualisé)

---

### Phase 6 — Temps réel & Alertes (Sprint 6)
**Live monitoring**

#### Nouveau endpoint SSE backend

```typescript
// GET /api/nodes/:serverId/stream
// Content-Type: text/event-stream
// Emit every 5s: { cpu, mem, netin, netout, timestamp }
```

**Alertes configurables :**
- CPU > seuil pendant X minutes
- RAM > seuil
- VM hors ligne
- Disque > 85%
- Backup échoué

**Notifications :**
- In-app (toast + badge dans sidebar)
- Futur : Push via webhook configurable

---

### Phase 7 — Administration (Sprint 7)
**Gestion utilisateurs et paramètres**

#### Page `/settings`

- Gestion des connexions Proxmox (ajout/modif/suppression serveurs)
- Clés API PBS
- Préférences (thème, langue, timezone)

#### Page `/users` *(admin only)*

- Liste utilisateurs MyProx
- Rôles : admin/user
- Quotas (VMs max, RAM max)
- Réinitialisation mot de passe

---

## Design System

### Palette (dark first)

| Token | Valeur |
|---|---|
| `--bg` | `#09090f` |
| `--surface` | `#111118` |
| `--surface-2` | `#1a1a24` |
| `--border` | `#27272f` |
| `--accent` | `#7C3AED` (violet MyProx) |
| `--success` | `#10B981` |
| `--warning` | `#F59E0B` |
| `--error` | `#EF4444` |

### Navigation latérale

```
[Logo MyProx]
────────────────────
 Tableau de bord
 VMs & LXC
 Nœuds
 Backups
 Monitoring
────────────────────
 Paramètres
 Utilisateurs
────────────────────
[Avatar] [Déconnexion]
```

---

## Plan Docker & Déploiement

### Ajout dans `docker-compose.yml`

```yaml
ops:
  build:
    context: ./ops
    dockerfile: Dockerfile
  ports:
    - "3002:3002"
  environment:
    NEXT_PUBLIC_API_URL: ${API_URL:-http://localhost:3000}
  restart: unless-stopped
```

### Cloudflare Tunnel (à ajouter dans `cloudflare/config.yml`)

```yaml
- hostname: ops.myprox.app
  service: http://ops:3002
```

---

## Ordre de priorité

| Priorité | Phase | Valeur utilisateur |
|---|---|---|
| 🔴 P1 | Phase 1 : Foundation + Auth | Indispensable |
| 🔴 P1 | Phase 2 : Dashboard | Point d'entrée |
| 🟠 P2 | Phase 3 : VMs/LXC | Fonctionnalité core |
| 🟠 P2 | Phase 4 : Nœuds | Monitoring essentiel |
| 🟡 P3 | Phase 5 : Backups PBS | Valeur ajoutée forte |
| 🟡 P3 | Phase 6 : Temps réel | UX premium |
| 🟢 P4 | Phase 7 : Admin | Nécessaire en prod |

---

## Questions ouvertes

> [!IMPORTANT]
> **Authentification web** : Les tokens JWT de l'app mobile peuvent être réutilisés. Mais pour la web app, il est plus sécurisé d'utiliser des **cookies HttpOnly** (résistants au XSS). À décider avant Phase 1.

> [!IMPORTANT]
> **Accès multi-utilisateurs** : L'Ops Center est-il exclusivement pour l'admin propriétaire, ou d'autres utilisateurs MyProx peuvent-ils y accéder avec des permissions restreintes ? Impacte fortement la Phase 7.

> [!NOTE]
> **Console VNC** : En prod (via Cloudflare Tunnel avec SSL valide sur `ops.myprox.app`), la console noVNC fonctionnera nativement via iframe — pas le même problème que l'app mobile avec les certs auto-signés.

> [!NOTE]
> **Début d'implémentation** : On peut commencer la Phase 1 tout de suite dès votre accord. Estimation Phase 1+2 : ~2h de développement.

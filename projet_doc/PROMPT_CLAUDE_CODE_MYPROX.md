# 🚀 PROMPT COMPLET - MyProx Application Mobile

## CONTEXTE DU PROJET

**MyProx** est une application mobile (iOS/Android) révolutionnaire permettant de gérer ses infrastructures Proxmox n'importe où dans le monde. L'app fonctionne selon deux modes :

1. **Mode Local** : Gestion du Proxmox sur le réseau local uniquement (pas d'accès externe)
2. **Mode Cloud Premium** : Accès sécurisé au Proxmox depuis n'importe où via les serveurs de MyProx

---

## ARCHITECTURE GLOBALE

```
┌─────────────────────────────────────────────────────────────┐
│                    UTILISATEURS FINAUX                       │
│  (iOS + Android via React Native / Flutter)                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │    Application Mobile MyProx (v1)       │
        │  - Dashboard des VMs/Containers         │
        │  - Démarrage/Arrêt machines             │
        │  - Monitoring basique                   │
        │  - Gestion d'accès (Local/Cloud)        │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │      API Principale (Node.js/Go)        │
        │  - Authentification utilisateurs        │
        │  - Gestion des abonnements              │
        │  - Routage vers Proxmox                 │
        │  - Logs & Monitoring                    │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │   Service Cloud Relay (Tunnel sécurisé) │
        │  - WebSocket Reverse Proxy              │
        │  - Chiffrement end-to-end               │
        │  - Rate limiting                        │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │  Proxmox des Utilisateurs (en local)    │
        │  - Communique via API REST native       │
        └─────────────────────────────────────────┘
```

---

## 1️⃣ APPLICATION MOBILE - TECHSTACK & FEATURES

### Choix technologique : **React Native avec Expo**

**Pourquoi React Native ?**
- Un seul codebase pour iOS et Android
- Compilable sur Mac M4 (native support)
- Communauté très active
- Possible de compiler en EAS Cloud ou localement
- Hot reload pour dev rapide

### Stack complet
```
Frontend         : React Native (Expo)
State Mgmt       : Zustand ou Redux
HTTP Client      : Axios + Interceptors (JWT auth)
Secure Storage   : react-native-keychain (Keychain iOS, Keystore Android)
Navigation       : React Navigation
UI Kit           : Native Base ou React Native Paper
Push Notif       : Expo Notifications (optionnel v1)
WebSocket        : ws library (mode cloud)
Charts           : react-native-chart-kit (monitoring)
```

### Installation & Setup Initial
```bash
# Sur Mac M4
npx create-expo-app MyProx
cd MyProx
npm install axios zustand react-native-keychain @react-navigation/native
npx expo install expo-secure-store

# Lancer dev
npx expo start

# Compiler pour TestFlight/Beta
npx eas build --platform ios
npx eas build --platform android
```

### Dockerisation de l'App (optionnel pour dev)
```dockerfile
# Dockerfile.dev (optionnel - pour CI/CD)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install -g eas-cli
RUN npm install
COPY . .
CMD ["npx", "expo", "start"]
```

L'app elle-même tourne sur le téléphone (iOS/Android), mais tu peux dockeriser ton environnement de build local si besoin.

### Features MVPs (Minimum Viable Product)

#### ÉCRAN 1 : Authentication
- [ ] Login email/password
- [ ] Création compte
- [ ] Oubli de mot de passe
- [ ] Stockage sécurisé token JWT (SecureStore)
- [ ] Deep link pour OAuth (optionnel v1)

#### ÉCRAN 2 : Onboarding / Configuration
- [ ] Choix : Mode Local OU Mode Cloud
- [ ] **Si Mode Local**
  - Input : IP Proxmox locale
  - Input : Username/Password (stockés localement chiffrés)
  - Test connexion
- [ ] **Si Mode Cloud**
  - Clé API CloudRelay générée automatiquement
  - Code de pairing QR (optionnel)
  - Synchronisation avec le compte MyProx

#### ÉCRAN 3 : Dashboard Principal
- [ ] Liste des serveurs Proxmox connectés (max 1 pour free, ∞ pour premium)
- [ ] Pour chaque serveur :
  - Nom du serveur
  - Nombre de VMs
  - Nombre de Containers
  - CPU usage (%)
  - RAM usage (%)
  - Statut de connexion (green/red)
- [ ] Pull-to-refresh
- [ ] Notifications en temps réel (optionnel v1)

#### ÉCRAN 4 : Liste VMs/Containers
- [ ] Filtre par serveur
- [ ] Filtre par type (VM/Container)
- [ ] Statut (running/stopped/paused)
- [ ] Pour chaque :
  - Nom
  - vCPU
  - RAM allouée
  - Disque allouée
  - État (bouton toggle start/stop)
  - Bouton détails

#### ÉCRAN 5 : Détails VM/Container
- [ ] Console (sortie logs en temps réel) - optionnel v1
- [ ] CPU/RAM live (graphique)
- [ ] Actions : Start/Stop/Restart/Delete (avec confirmation)
- [ ] Configurations basiques visibles

#### ÉCRAN 6 : Paramètres (Settings)
- [ ] Profil utilisateur
- [ ] Gestion des serveurs connectés (ajouter/supprimer)
- [ ] Mode Local ↔ Cloud (changement)
- [ ] Abonnement (afficher plan : Free/Premium)
- [ ] Logs & Diagnostic
- [ ] Déconnexion

---

## 2️⃣ SERVEUR API PRINCIPAL

### Stack : **Node.js + Express** (ou Go pour plus de perf)

### Architecture
```
backend/
├── src/
│   ├── auth/               # JWT, sessions, OAuth
│   ├── users/              # Gestion utilisateurs
│   ├── subscriptions/       # Plans Free/Premium
│   ├── proxmox/            # Interface Proxmox API
│   ├── cloudRelay/         # Relay vers serveurs distants
│   ├── webhooks/           # Événements (optionnel)
│   └── middleware/         # Auth, rate limit, CORS
├── database/               # PostgreSQL
├── .env                    # Secrets
└── docker-compose.yml
```

### Endpoints Essentiels

```
POST   /api/v1/auth/register          # Créer compte
POST   /api/v1/auth/login             # Login
POST   /api/v1/auth/refresh           # Refresh token
POST   /api/v1/auth/logout            # Logout

GET    /api/v1/user/profile           # Info utilisateur
PUT    /api/v1/user/profile           # Modifier profil

GET    /api/v1/servers                # Liste serveurs connectés
POST   /api/v1/servers                # Ajouter serveur (Local ou Cloud)
DELETE /api/v1/servers/:id            # Supprimer serveur
PUT    /api/v1/servers/:id/mode       # Basculer Local ↔ Cloud

GET    /api/v1/servers/:id/vms        # Liste VMs/Containers
GET    /api/v1/servers/:id/vms/:vmid  # Détails VM
POST   /api/v1/servers/:id/vms/:vmid/start
POST   /api/v1/servers/:id/vms/:vmid/stop
POST   /api/v1/servers/:id/vms/:vmid/restart
DELETE /api/v1/servers/:id/vms/:vmid

GET    /api/v1/subscriptions/plan     # Plan actuellement actif
POST   /api/v1/subscriptions/upgrade  # Passer à Premium (Stripe)
GET    /api/v1/subscriptions/invoice  # Factures

GET    /api/v1/cloud/relay-status     # Statut relay cloud
POST   /api/v1/cloud/pair-device      # Pairing QR code
```

### Database Schema (PostgreSQL)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  plan VARCHAR DEFAULT 'free', -- free, premium
  stripe_customer_id VARCHAR,
  stripe_subscription_id VARCHAR,
  servers_limit INT DEFAULT 1, -- 1 pour free, unlimited pour premium
  expires_at TIMESTAMP,
  created_at TIMESTAMP
);

-- Servers (Proxmox)
CREATE TABLE proxmox_servers (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR NOT NULL,
  mode VARCHAR DEFAULT 'local', -- local, cloud
  local_ip VARCHAR,
  local_username VARCHAR,
  local_password_encrypted TEXT,
  cloud_api_key VARCHAR,
  cloud_relay_server UUID REFERENCES cloud_relays(id),
  verified BOOLEAN DEFAULT FALSE,
  last_sync TIMESTAMP,
  created_at TIMESTAMP
);

-- Cloud Relays (serveurs relay)
CREATE TABLE cloud_relays (
  id UUID PRIMARY KEY,
  region VARCHAR, -- eu-1, us-1, etc.
  hostname VARCHAR UNIQUE,
  ip_address INET,
  capacity INT DEFAULT 1000, -- nombre de tunnels simultanés
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP
);

-- Sessions/Auth
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token_jwt VARCHAR UNIQUE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP
);
```

---

## 3️⃣ SERVICE CLOUD RELAY

### Stack : **Golang + Envoy Proxy** (ou Rust)

### Responsabilités
- Établir tunnels sécurisés (TLS 1.3)
- Reverse proxy les requêtes de l'app vers le Proxmox local
- Chiffrer les données en transit
- Rate limiting par utilisateur
- Monitoring & logs

### Architecture Simple
```
App Mobile (cloud mode)
    ↓
API Principale (authentifie)
    ↓
Cloud Relay (crée tunnel WebSocket chiffré)
    ↓
Proxmox Local (répond via tunnel)
```

### Exemple basique (Golang)
```go
// Tunnel WebSocket sécurisé
ws://relay.myprox.com/tunnel/{user_id}/{server_id}

// Requête de l'app :
POST /servers/proxmox-1/vms/100/status
→ Routée via tunnel sécurisé
→ Vers Proxmox local
```

---

## 4️⃣ SITE VITRINE (myprox.com)

### Stack : **Next.js + Tailwind**

### Pages
- [ ] Landing page (présentation features)
- [ ] Pricing (Free vs Premium)
- [ ] Documentation (API, intégration)
- [ ] Blog (tutoriels, features updates)
- [ ] Dashboard utilisateur (après login)
- [ ] Download (iOS/Android links)

### SEO & Marketing
- [ ] Open source badge sur GitHub
- [ ] Docs ouvertes sur ReadTheDocs
- [ ] Posts r/homelab, r/selfhosted
- [ ] Twitter/X updates
- [ ] Newsletter Substack (optionnel)

---

## 5️⃣ INFRASTRUCTURE & DÉPLOIEMENT

### Machines recommandées (VPS)

```
VPS 1 : API Principale + Database
├─ CPU : 2 vCPU
├─ RAM : 4GB
├─ OS : Ubuntu 22.04 LTS
├─ Services : Node.js, PostgreSQL, Redis
└─ Coût : ~10-20€/mois

VPS 2 : Cloud Relay (EU)
├─ CPU : 4 vCPU
├─ RAM : 8GB
├─ OS : Ubuntu 22.04 LTS
├─ Services : Golang relay, Envoy
└─ Coût : ~20-40€/mois

VPS 3 : Cloud Relay (US) - optionnel
├─ Même config que VPS 2
└─ Coût : ~20-40€/mois

VPS 4 : Site Vitrine
├─ CPU : 1 vCPU
├─ RAM : 2GB
├─ OS : Ubuntu 22.04 LTS
├─ Services : Next.js, Nginx
└─ Coût : ~5-10€/mois

CDN + Monitoring : Cloudflare + Sentry (~50€/mois)

TOTAL INITIAL : ~100-150€/mois
```

### Docker Compose (Dev + Prod)

**Structure complète avec tous les services** :

```yaml
version: '3.8'

services:
  # Base de données
  postgres:
    image: postgres:15-alpine
    container_name: myprox-db
    environment:
      POSTGRES_DB: myprox
      POSTGRES_USER: myprox_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U myprox_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Cache
  redis:
    image: redis:7-alpine
    container_name: myprox-cache
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s

  # API Principale
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: myprox-api
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: ${NODE_ENV:-development}
      DATABASE_URL: postgresql://myprox_user:${DB_PASSWORD}@postgres:5432/myprox
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      STRIPE_API_KEY: ${STRIPE_API_KEY}
      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET}
      RELAY_API_URL: http://relay:8080
      CORS_ORIGINS: ${CORS_ORIGINS:-http://localhost:3001}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/node_modules
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Cloud Relay (WebSocket tunnel)
  relay:
    build:
      context: ./relay
      dockerfile: Dockerfile
    container_name: myprox-relay
    ports:
      - "8080:8080"
      - "9090:9090" # Metrics Prometheus (optionnel)
    environment:
      RELAY_REGION: ${RELAY_REGION:-eu-1}
      RELAY_HOSTNAME: ${RELAY_HOSTNAME:-relay.myprox.local}
      API_URL: http://api:3000
      LOG_LEVEL: ${LOG_LEVEL:-info}
      MAX_CONNECTIONS: 1000
      TUNNEL_TIMEOUT: 300
    depends_on:
      - api
    volumes:
      - ./relay:/app
      - /app/target # Golang builds
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s

  # Website (Next.js) - optionnel pour MVP
  website:
    build:
      context: ./website
      dockerfile: Dockerfile
    container_name: myprox-website
    ports:
      - "3001:3000"
    environment:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://localhost:3000}
      NEXT_PUBLIC_STRIPE_KEY: ${NEXT_PUBLIC_STRIPE_KEY}
    depends_on:
      - api
    volumes:
      - ./website:/app
      - /app/.next
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s

volumes:
  postgres_data:
  redis_data:

networks:
  default:
    name: myprox-network
```

**Fichier `.env.example`** (à copier en `.env` localement) :
```bash
# Database
DB_PASSWORD=your_secure_password_here

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars

# Stripe (optionnel pour MVP)
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Relay
RELAY_REGION=eu-1
RELAY_HOSTNAME=relay.myprox.local

# CORS
CORS_ORIGINS=http://localhost:3001,https://myprox.com

# Node
NODE_ENV=development
LOG_LEVEL=debug

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_KEY=pk_test_...
```

**Lancer tout localement** :
```bash
# Dev complet (tous les services)
docker-compose up -d

# Voir les logs
docker-compose logs -f api

# Arrêter
docker-compose down

# Reset volumes (attention !)
docker-compose down -v
```

### Dockerfiles individuels

**backend/Dockerfile** (Node.js API) :
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY . .

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

CMD ["npm", "start"]
```

**relay/Dockerfile** (Golang) :
```dockerfile
# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /build

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o relay-server ./cmd/main.go

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates curl

WORKDIR /root/

COPY --from=builder /build/relay-server .

EXPOSE 8080 9090

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["./relay-server"]
```

**website/Dockerfile** (Next.js) :
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production

EXPOSE 3000

CMD ["npm", "start"]
```

### Déploiement Production (VPS)

**Sur ta VPS avec Docker** :
```bash
# 1. Clone le repo
git clone https://github.com/yourusername/myprox.git
cd myprox

# 2. Copie et configure .env
cp .env.example .env
# Édite .env avec tes secrets Stripe, JWT, etc.

# 3. Build et lance en production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 4. Logs
docker-compose logs -f api relay

# 5. Backup DB
docker-compose exec postgres pg_dump -U myprox_user myprox > backup.sql
```

**docker-compose.prod.yml** (override pour production) :
```yaml
version: '3.8'
services:
  postgres:
    restart: always
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U myprox_user"]
      interval: 30s
      timeout: 10s
      retries: 5

  api:
    restart: always
    environment:
      NODE_ENV: production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/v1/health"]
      interval: 60s
      timeout: 10s
      retries: 3

  relay:
    restart: always
    environment:
      LOG_LEVEL: warn

  website:
    restart: always

volumes:
  postgres_prod_data:
```

### CI/CD (GitHub Actions avec Docker)

```yaml
name: Build & Deploy MyProx

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME_API: ${{ github.repository }}/api
  IMAGE_NAME_RELAY: ${{ github.repository }}/relay
  IMAGE_NAME_WEBSITE: ${{ github.repository }}/website

jobs:
  # Test Phase
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd backend
          npm ci

      - name: Run tests
        run: |
          cd backend
          npm run test
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/myprox_test
          JWT_SECRET: test-secret-key-32-chars-minimum

      - name: Run linting
        run: |
          cd backend
          npm run lint

  # Build Docker images
  build:
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'push'
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata (API)
        id: meta-api
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME_API }}
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha

      - name: Build and push API image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: ${{ steps.meta-api.outputs.tags }}
          labels: ${{ steps.meta-api.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Extract metadata (Relay)
        id: meta-relay
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME_RELAY }}
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=sha

      - name: Build and push Relay image
        uses: docker/build-push-action@v5
        with:
          context: ./relay
          push: true
          tags: ${{ steps.meta-relay.outputs.tags }}
          labels: ${{ steps.meta-relay.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Extract metadata (Website)
        id: meta-website
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME_WEBSITE }}
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=sha

      - name: Build and push Website image
        uses: docker/build-push-action@v5
        with:
          context: ./website
          push: true
          tags: ${{ steps.meta-website.outputs.tags }}
          labels: ${{ steps.meta-website.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # Deploy Phase
  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to production
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_PRIVATE_KEY }}
          DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
          DEPLOY_USER: ${{ secrets.DEPLOY_USER }}
        run: |
          mkdir -p ~/.ssh
          echo "$DEPLOY_KEY" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -H $DEPLOY_HOST >> ~/.ssh/known_hosts

          ssh -i ~/.ssh/deploy_key $DEPLOY_USER@$DEPLOY_HOST << 'EOF'
          cd ~/myprox
          git pull origin main
          docker-compose -f docker-compose.yml -f docker-compose.prod.yml pull
          docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
          docker-compose exec -T api npm run migrate
          EOF
```

**Secrets à ajouter dans GitHub Settings** :
```
DEPLOY_PRIVATE_KEY      # Clé SSH de déploiement
DEPLOY_HOST             # IP/domaine VPS
DEPLOY_USER             # Utilisateur VPS (ex: deploy)
```

---

## STRUCTURE DU PROJET (Repository)

```
myprox/
├── mobile/                          # App React Native (Expo)
│   ├── app.json                     # Config Expo
│   ├── eas.json                     # EAS Build config (iOS/Android builds)
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts            # Axios + interceptors JWT
│   │   │   ├── auth.ts              # Login, register, refresh
│   │   │   ├── servers.ts           # Serveurs Proxmox
│   │   │   └── vms.ts               # VMs, containers, actions
│   │   ├── screens/
│   │   │   ├── AuthScreen.tsx       # Login + Register
│   │   │   ├── OnboardingScreen.tsx # Config Local vs Cloud
│   │   │   ├── DashboardScreen.tsx  # Dashboard principal
│   │   │   ├── ServersScreen.tsx    # Liste serveurs
│   │   │   ├── VMListScreen.tsx     # VMs/Containers
│   │   │   ├── VMDetailsScreen.tsx  # Détails + actions
│   │   │   └── SettingsScreen.tsx   # Profil, plan, logout
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── ServerCard.tsx
│   │   │   ├── VMCard.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── store/
│   │   │   ├── authStore.ts         # Zustand - Auth state
│   │   │   ├── serverStore.ts       # Zustand - Servers
│   │   │   └── appStore.ts          # App global state
│   │   ├── utils/
│   │   │   ├── secureStorage.ts     # Keychain wrapper
│   │   │   ├── formatting.ts        # Format CPU%, RAM, etc.
│   │   │   └── constants.ts         # URLs, timeouts, etc.
│   │   ├── navigation/
│   │   │   ├── AuthNavigator.tsx    # Stack si pas logged in
│   │   │   ├── AppNavigator.tsx     # Tabs si logged in
│   │   │   └── RootNavigator.tsx    # Route entre les 2
│   │   └── App.tsx                  # Root component
│   └── __tests__/
│       ├── auth.test.ts
│       ├── servers.test.ts
│       └── api.test.ts
│
├── backend/                         # Node.js API
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── server.ts                # Express app setup
│   │   ├── config/
│   │   │   ├── database.ts          # PostgreSQL connection
│   │   │   ├── redis.ts             # Redis client
│   │   │   └── secrets.ts           # Env vars validation
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── servers.routes.ts
│   │   │   ├── vms.routes.ts
│   │   │   ├── subscriptions.routes.ts
│   │   │   └── health.routes.ts
│   │   ├── controllers/
│   │   │   ├── AuthController.ts
│   │   │   ├── ServerController.ts
│   │   │   └── SubscriptionController.ts
│   │   ├── services/
│   │   │   ├── ProxmoxService.ts    # Appels API Proxmox
│   │   │   ├── AuthService.ts       # JWT, password hash
│   │   │   ├── StripeService.ts
│   │   │   └── RelayService.ts      # Communique avec relay
│   │   ├── middleware/
│   │   │   ├── auth.ts              # Verify JWT
│   │   │   ├── rateLimiter.ts       # Rate limiting
│   │   │   ├── errorHandler.ts
│   │   │   └── logger.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── ProxmoxServer.ts
│   │   │   ├── Subscription.ts
│   │   │   └── Session.ts
│   │   └── utils/
│   │       ├── jwt.ts
│   │       ├── encryption.ts        # Chiffrer passwords Proxmox
│   │       └── validation.ts
│   ├── migrations/                  # Knex migrations
│   │   ├── 001_create_users.ts
│   │   ├── 002_create_proxmox_servers.ts
│   │   └── 003_create_subscriptions.ts
│   ├── scripts/
│   │   └── init-db.sql
│   └── __tests__/
│       ├── auth.test.ts
│       ├── servers.test.ts
│       └── proxmox.test.ts
│
├── relay/                           # Golang Cloud Relay
│   ├── Dockerfile
│   ├── go.mod
│   ├── go.sum
│   ├── cmd/
│   │   └── main.go                  # Entrypoint
│   └── pkg/
│       ├── tunnel/
│       │   ├── websocket.go         # WebSocket server
│       │   ├── reverseproxy.go      # Reverse proxy TLS
│       │   └── auth.go              # Verify JWT
│       ├── relay/
│       │   ├── relay.go             # Core relay logic
│       │   └── connection.go        # Tunnel management
│       ├── metrics/
│       │   └── prometheus.go        # Monitoring
│       └── config/
│           └── config.go            # Load env vars
│
├── website/                         # Next.js Landing page
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.js
│   ├── app/
│   │   ├── page.tsx                 # Landing
│   │   ├── pricing/page.tsx
│   │   ├── docs/page.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── Hero.tsx
│   │   ├── PricingTable.tsx
│   │   └── Features.tsx
│   ├── public/
│   │   └── logo.png
│   └── styles/
│       └── globals.css
│
├── docker-compose.yml               # Dev local
├── docker-compose.prod.yml          # Prod overrides
├── .env.example                     # Template variables
├── .gitignore
├── .github/
│   └── workflows/
│       └── ci-cd.yml                # GitHub Actions
├── README.md
├── ARCHITECTURE.md                  # Doc architecture
└── LICENSE                          # MIT License
```

---

## 6️⃣ SÉCURITÉ & COMPLIANCE

### Chiffrement
- [ ] JWT pour auth (HS256 ou RS256)
- [ ] TLS 1.3 pour tous les transports
- [ ] AES-256-GCM pour données sensibles (passwords Proxmox)
- [ ] HPKP (HTTP Public Key Pinning) optionnel
- [ ] CSP (Content Security Policy)

### Authentification
- [ ] Email + Password (bcrypt)
- [ ] 2FA TOTP (Google Authenticator) - optionnel v1
- [ ] OAuth Google/GitHub (optionnel v1)

### Données utilisateur
- [ ] RGPD compliant (droit à l'oubli)
- [ ] Logs des accès
- [ ] Audit trail des actions

---

## 7️⃣ MONETISATION

### Plan FREE
- **1 serveur dans le Cloud** (via MyProx relay)
- **5 serveurs en Mode Local** (accès LAN uniquement, illimité)
- Pas de support prioritaire
- Limite bande passante cloud (10GB/mois)
- Pas de pub (pas de tracking)

**Exemple usager FREE** : 
- Peut connecter 5 Proxmox locaux à son réseau (pas d'accès externe)
- Peut en ajouter 1 via le cloud relay MyProx (accès de partout)
- Parfait pour tests, homelab, petites infra

### Plan PREMIUM ($9.99/mois ou $99/an)
- **Serveurs illimités** (local ET cloud combinés)
- **Bande passante illimitée** sur le cloud relay
- **Priorité support 24/7**
- Accès API complet
- Private Cloud Relay (optionnel futur)
- Analytics avancées
- Uptime SLA (99.9%)

**Exemple usager PREMIUM** :
- 50+ serveurs Proxmox, tous accessibles en cloud
- Gestion d'infra distribuée (EU + US + ASIA)
- Monitoring temps réel sans limite

### Paiement
- **Stripe** pour carte bancaire (principal)
- **Paddle** pour alternative (optionnel v2)
- **Apple In-App Purchase** pour iOS (optionnel v2)
- Factures auto via email
- Annulation flexible (pas d'engagement)

### Enforcement côté Backend
```javascript
// Pseudo-code : vérifier plan utilisateur
const user = await getUser(userId);
const serverCount = await countServers(userId);

if (user.plan === 'free') {
  // Limite : 1 cloud + 5 local max
  const cloudServers = serverCount.cloud;  // doit être ≤ 1
  const localServers = serverCount.local;  // doit être ≤ 5
  
  if (cloudServers > 1 || localServers > 5) {
    throw new Error('Upgrade to Premium for more servers');
  }
  
  // Limite bande passante : 10GB/mois
  const usage = await getCloudBandwidth(userId, currentMonth);
  if (usage > 10 * 1024 * 1024 * 1024) {
    throw new Error('Bandwidth limit reached, upgrade to Premium');
  }
}
```

---

## 8️⃣ TIMELINE DE DÉVELOPPEMENT

### Phase 0 : Setup (2 jours)
- [ ] Initialiser repo GitHub
- [ ] Configurer secrets + VPS
- [ ] Database + API basique

### Phase 1 : MVP App Mobile (7-10 jours)
- [ ] Authentification
- [ ] Mode Local (connexion manuelle + stockage)
- [ ] Dashboard basique
- [ ] Liste VMs
- [ ] Start/Stop actions

### Phase 2 : Mode Cloud (5-7 jours)
- [ ] Relay cloud (Golang)
- [ ] Pairing app ↔ cloud
- [ ] Authentification cloud
- [ ] Tunnel sécurisé

### Phase 3 : Polishing (3-5 jours)
- [ ] Monitoring CPU/RAM
- [ ] Error handling complet
- [ ] Animations UI
- [ ] Tests

### Phase 4 : Site Vitrine (2-3 jours)
- [ ] Landing page
- [ ] Pricing page
- [ ] Documentation basique

### Phase 5 : TestFlight/Beta (2 jours)
- [ ] Build iOS sur EAS Cloud
- [ ] Build Android sur EAS Cloud
- [ ] Distribution TestFlight/Google Play Beta

**TOTAL : ~20-30 jours développement solo** (réaliste pour POC solide)

---

## 9️⃣ OPEN SOURCE STRATEGY

### Licencing
- [ ] MIT License (permissif)
- [ ] Code source public sur GitHub
- [ ] Secrets NOT inclus (cf `.env.example`)

### Transparence
- [ ] Roadmap public (GitHub Issues)
- [ ] Changelogs détaillés
- [ ] RFC (Request For Comments) pour features majeures
- [ ] Community contributions bienvenues

### Monetisation du code ouvert
- [ ] APP gratuite mais features premium payantes
- [ ] Cloud relay payant (self-hosting gratuit possible)
- [ ] Support professionnel (optionnel)

---

## 🔟 POINTS CLÉS À CLARIFIER AVANT DE COMMENCER

### Q1: Quelle framework mobile exactement ?
- **Recommandation : React Native (Expo)** - Plus rapide dev, compilable Mac M4
- Alternative : Flutter (Dart) - Plus performant mais apprentissage Dart
- Éviter : SwiftUI + Kotlin natif (2x dev, mais future option)

### Q2: Proxmox version support ?
- Tester sur Proxmox 7.x et 8.x minimum
- API REST stable depuis PVE 5.0
- Prévoir breaking changes pour versions futures

### Q3: Stockage des credentials Proxmox en local ?
- **Chiffrement obligatoire** : react-native-keychain (iOS Keychain, Android Keystore)
- Jamais en plaintext

### Q4: Scaling cloud relays ?
- Kubernetes (overkill pour v1)
- **Recommandation : Docker Compose multi-machine** + Nginx load balancer
- Upgrade vers K8s si >100 users actifs

### Q5: Monitoring & Logs ?
- **Sentry** pour errors (free tier = 5000 events/mois)
- **Prometheus** + **Grafana** pour infra
- **ELK Stack** optionnel si traffic explosif

### Q6: Backup & Disaster Recovery ?
- PostgreSQL backups quotidiens (S3)
- Secrets chiffrés dans Vault
- CDN Cloudflare (cache assets statiques)

### Q7: Support multiple Proxmox à la fois (version final) ?
- Free : 1 serveur
- Premium : illimité (déjà intégré)

---

## 📚 RESSOURCES & DOCS RÉFÉRENCÉES

- Proxmox API : https://pve.proxmox.com/wiki/Proxmox_VE_API2
- React Native Expo : https://docs.expo.dev/
- React Native Keychain : https://github.com/react-native-keychain/react-native-keychain
- Stripe React Native : https://github.com/stripe/stripe-react-native
- JWT.io : https://jwt.io/
- Next.js : https://nextjs.org/docs

---

## ✅ CHECKLIST AVANT PREMIER PROMPT À CLAUDE CODE

- [ ] Tu as un Mac M4 prêt
- [ ] Tu as un compte GitHub
- [ ] Tu as des VPS loués (Hetzner / Linode / DigitalOcean)
- [ ] Tu as un domaine myprox.com
- [ ] Tu as un compte Stripe
- [ ] Tu as décidé : React Native (Expo) ou Flutter ?
- [ ] Tu as créé un repo GitHub privé
- [ ] Tu veux commencer par Phase 1 (MVP Local) ou Phase 2 (Cloud direct) ?

---

## 🎯 PROMPT À DONNER À CLAUDE CODE

Une fois ce document lu et validé, voici le prompt simplifié :

```
Tu es expert en développement mobile et backend.
Je développe MyProx, une app pour gérer Proxmox depuis son téléphone.

ARCHITECTURE :
- App Mobile : React Native + Expo (compilable sur Mac M4)
- Backend API : Node.js + PostgreSQL
- Cloud Relay : Golang + WebSocket
- Website : Next.js

PHASE 1 - MVP LOCAL (démarrer par ici) :
1. Setup Expo project + structure de base
2. Écrans : Auth, Config Local, Dashboard, List VMs, VM Details, Settings
3. API Express : /auth, /servers, /vms, endpoints basiques
4. PostgreSQL : schema users, subscriptions, proxmox_servers
5. Test connexion manuelle à un Proxmox local
6. Actions : Start/Stop/Restart machines

CONTRAINTES :
- Code modulable (prêt pour Cloud Relay après)
- Tests unitaires basiques
- Error handling complet
- Secrets en .env
- Prêt pour TestFlight/Beta en fin de Phase 1

Commence par la structure complète du projet et scaffolding initial.
```

---

**Document créé pour MyProx v1.0 POC - Avril 2026**

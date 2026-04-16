# MyProx Phase 1 MVP - Task Tracker

## TÂCHE 1 : Scaffolding & Infrastructure
- [x] `.gitignore`
- [x] `.env.example`
- [x] `docker-compose.yml`
- [x] `tasks/todo.md`

## TÂCHE 2 : Backend Setup
- [x] `backend/package.json`
- [x] `backend/tsconfig.json`
- [x] `backend/Dockerfile`
- [x] `backend/src/config/database.ts`
- [x] `backend/src/config/redis.ts`
- [x] `backend/src/config/secrets.ts`
- [x] `backend/src/utils/jwt.ts`
- [x] `backend/src/utils/encryption.ts`

## TÂCHE 3 : Backend Auth + Migrations
- [x] `backend/migrations/001_init.sql`
- [x] `backend/migrations/002_servers.sql`
- [x] `backend/migrations/003_cloud.sql`
- [x] `backend/src/middleware/auth.ts`
- [x] `backend/src/routes/auth.ts` (+ fix session dedup bug)

## TÂCHE 4 : Backend Servers & VMs
- [x] `backend/src/services/ProxmoxService.ts`
- [x] `backend/src/services/CloudProxmoxService.ts`
- [x] `backend/src/services/RelayService.ts`
- [x] `backend/src/routes/servers.ts` (+ PUT /:id/mode)
- [x] `backend/src/routes/vms.ts` (+ GET /:vmid, DELETE /:vmid, LXC actions)
- [x] `backend/src/routes/users.ts`
- [x] `backend/src/routes/subscriptions.ts`
- [x] `backend/src/routes/cloud.ts`
- [x] `backend/src/server.ts`

## TÂCHE 5 : Mobile Expo Setup
- [x] create-expo-app
- [x] dépendances installées
- [x] `mobile/app.json` mis à jour

## TÂCHE 6 : Mobile Stores
- [x] `mobile/src/store/authStore.ts`
- [x] `mobile/src/store/serverStore.ts`
- [x] `mobile/src/store/appStore.ts`

## TÂCHE 7 : Mobile Screens
- [x] `mobile/src/screens/AuthScreen.tsx`
- [x] `mobile/src/screens/DashboardScreen.tsx`
- [x] `mobile/src/screens/OnboardingScreen.tsx` (+ fix Clipboard expo)
- [x] `mobile/src/screens/VMListScreen.tsx`
- [x] `mobile/src/screens/VMDetailsScreen.tsx` (+ fix TS props)
- [x] `mobile/src/screens/SettingsScreen.tsx`

## TÂCHE 8 : Mobile Components
- [x] `mobile/src/components/ErrorBoundary.tsx`
- [x] `mobile/src/components/ServerCard.tsx`
- [x] `mobile/src/components/VMCard.tsx`
- [x] `mobile/src/components/LoadingSpinner.tsx`

## TÂCHE 9 : Mobile Navigation + App.tsx
- [x] `mobile/src/navigation/RootNavigator.tsx`
- [x] `mobile/App.tsx`

## TÂCHE 10 : Relay & Agent (Go)
- [x] `relay/` structure complète
- [x] `relay/go.sum` généré
- [x] `agent/go.sum` généré

## ✅ Checklist de Validation
- [x] `docker-compose up -d` = OK (postgres + redis + api + relay all healthy)
- [x] `curl http://localhost:3000/api/v1/health` = 200
- [x] Register/Login = OK
- [x] GET /api/v1/user/profile = OK
- [x] GET /api/v1/subscriptions/plan = OK
- [x] `npx tsc --noEmit` mobile = 0 erreur
- [x] `npx tsc --noEmit` backend = 0 erreur

## 📋 Review — Phase 1 Complétée (2026-04-16)

### Ce qui a été fait
- Analyse exhaustive du projet vs specs `projet_doc/`
- Génération des `go.sum` (relay + agent) → builds Docker débloqués
- Correction bug login: session duplicate → single-session policy appliquée
- Fix `Clipboard` déprécié → `expo-clipboard` (async API)
- Ajout endpoints manquants: `PUT /servers/:id/mode`, `GET/DELETE /servers/:id/vms/:vmid`
- Ajout fichiers manquants: `redis.ts`, `secrets.ts`, `appStore.ts`, `LoadingSpinner.tsx`
- 0 erreurs TypeScript backend + mobile

### Points d'attention pour la suite (Phase 2)
- `DELETE /servers/:id/vms/:vmid` retourne 501 — implement via `ProxmoxService.deleteVM()`
- `POST /cloud/pair-device` (QR pairing) non implémenté — Phase 2
- Stripe / subscriptions → Phase 2
- Tests unitaires → Phase 3
- Voir `tasks/lessons.md` pour les leçons de cette session

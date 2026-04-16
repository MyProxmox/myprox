# MyProx — Guide de Build (EAS)

Ce guide explique comment builder et distribuer l'app MyProx via **Expo Application Services (EAS)**.

---

## Prérequis

```bash
# Installer EAS CLI
npm install -g eas-cli

# Se connecter à son compte Expo
eas login

# Configurer le projet (si pas déjà fait)
eas build:configure
```

---

## Profils de build

| Profil | Usage | Distribution |
|--------|-------|-------------|
| `development` | Test sur device physique | Interne |
| `preview` | Test sur simulateur iOS | Interne |
| `production` | App Store / Play Store | Public |

---

## Commandes

### Build iOS (TestFlight)

```bash
# Build preview pour simulateur
eas build --platform ios --profile preview

# Build production pour App Store
eas build --platform ios --profile production

# Soumettre à TestFlight après build
eas submit --platform ios --latest
```

### Build Android

```bash
# Build APK pour test direct
eas build --platform android --profile production

# Soumettre au Play Store
eas submit --platform android --latest
```

### Build les deux en même temps

```bash
eas build --platform all --profile production
```

---

## Identifiants

| Clé | Valeur |
|-----|--------|
| Bundle ID iOS | `com.myprox.app` |
| Package Android | `com.myprox.app` |
| Expo slug | `myprox` |

---

## Workflow TestFlight complet

```bash
# 1. S'assurer que la version est à jour dans app.json
#    "version": "1.0.0"

# 2. Incrémenter le build number (optionnel, EAS le gère auto)
#    "buildNumber": "1" (iOS)
#    "versionCode": 1 (Android)

# 3. Lancer le build production iOS
eas build --platform ios --profile production

# 4. Soumettre à App Store Connect (TestFlight)
eas submit --platform ios --latest

# 5. Dans App Store Connect :
#    - Ajouter des testeurs
#    - Activer le test externe si nécessaire
```

---

## Variables d'environnement en build

Pour configurer l'URL de l'API selon l'environnement, utiliser EAS Secrets :

```bash
# Ajouter un secret EAS (remplace la valeur dans app.json extras)
eas secret:create --scope project --name API_URL --value https://api.myprox.app

# Lister les secrets
eas secret:list
```

Dans le code :
```typescript
// mobile/src/utils/constants.ts
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
```

---

## Changelog

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-04-16 | Phase 1 MVP — Auth, Local Mode, VMs |

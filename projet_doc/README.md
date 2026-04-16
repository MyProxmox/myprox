# 🚀 MyProx - Gestion Proxmox Mobile

**MyProx** est une application mobile révolutionnaire permettant de gérer vos infrastructures Proxmox n'importe où dans le monde.

---

## 📋 Résumé du Projet

### Concept
- **App mobile** iOS/Android pour gérer Proxmox
- **2 modes de fonctionnement** :
  1. **Mode Local** : Accès au Proxmox sur le réseau local (gratuit)
  2. **Mode Cloud Premium** : Accès sécurisé via tunnel (payant $9.99/mois)
- **Open source** avec monétisation transparente

### Monétisation
| Plan | Serveurs Cloud | Serveurs Local | Bandpassante Cloud | Prix |
|------|---|---|---|---|
| **Free** | 1 | 5 | 10 GB/mois | Gratuit |
| **Premium** | ∞ | ∞ | Illimité | $9.99/mois |

---

## 🛠 Tech Stack (Phase 1)

```
Frontend     │ React Native + Expo (compilable Mac M4)
Backend      │ Node.js + Express + PostgreSQL
Relay Cloud  │ Golang + WebSocket (Phase 2)
Website      │ Next.js (optionnel Phase 1)
Infra        │ Docker + Docker Compose
```

---

## 📁 Documents Fournis

Tu trouveras 2 fichiers principaux :

### 1. `PROMPT_CLAUDE_CODE_MYPROX.md` (Référence complète)
- Architecture générale
- Tous les détails techniques
- Database schemas
- Infrastructure AWS/VPS
- Stratégie open-source
- **À consulter pour les détails non couverts**

### 2. `PROMPT_FINAL_CLAUDE_CODE.md` (À utiliser avec Claude Code)
- **Prêt à copier-coller dans Claude Code**
- Décomposé en 10 tâches claires
- Code d'exemple complet
- Étapes de validation
- **C'est celui-là que tu vas utiliser pour développer**

---

## 🚀 Comment Démarrer

### Préparation (avant Claude Code)

```bash
# 1. Cloner le repo (crée un repo GitHub vide d'abord)
git clone https://github.com/ton-username/myprox.git
cd myprox

# 2. Lancer Docker localement
docker-compose up -d

# 3. Vérifier que ça marche
curl http://localhost:3000/api/v1/health
# → Doit retourner : { "status": "ok" }
```

### Avec Claude Code

```bash
# Terminal 1 : Services (DB, API)
docker-compose up -d

# Terminal 2 : Lancer Expo
cd mobile
npx expo start
```

**Puis copie-colle le contenu de `PROMPT_FINAL_CLAUDE_CODE.md` dans Claude Code** et suis les tâches 1 par 1.

---

## 📊 Timeline (Réaliste)

| Phase | Durée | Résultat |
|-------|-------|----------|
| **Phase 0** | 2 jours | Setup initial + Repo + Docker |
| **Phase 1** | 7-10 jours | MVP Local (Auth + Dashboard + VMs) |
| **Phase 2** | 5-7 jours | Mode Cloud (Relay + Tunnel) |
| **Phase 3** | 3-5 jours | Polish (Monitoring + Tests) |
| **Phase 4** | 2-3 jours | Site Vitrine |
| **Phase 5** | 2 jours | TestFlight/Beta |
| **TOTAL** | ~20-30 jours | **POC solide + Beta** |

---

## 🎯 Phase 1 - MVP Local (Tu es ici)

### Features attendues
- ✅ Authentification (Register/Login/Logout)
- ✅ Ajouter un serveur Proxmox local (IP + credentials)
- ✅ Dashboard avec liste des serveurs
- ✅ Voir tous les VMs/Containers
- ✅ Actions : Start/Stop/Restart
- ✅ Monitoring basique (afficher l'état)

### Non-requis Phase 1
- ❌ Mode Cloud (→ Phase 2)
- ❌ Analytics avancées
- ❌ 2FA
- ❌ Website vitrine
- ❌ Console VNC/SPICE

---

## 📱 Architecture High-Level

```
┌─────────────────────────────────────┐
│  React Native App (Expo)            │
│  - Auth • Dashboard • VMs Control   │
└──────────────┬──────────────────────┘
               │
        ┌──────▼──────┐
        │   Mode Local │  (no cloud)
        └──────┬──────┘
               │
    ┌──────────▼──────────┐
    │  User's Proxmox     │
    │  (Local LAN only)   │
    └─────────────────────┘
```

**Phase 2 ajoutera** :
```
    ┌──────────────┐
    │  Mode Cloud  │  (Premium)
    └──────┬───────┘
           │
    ┌──────▼─────────┐
    │ Cloud Relay    │  (Golang)
    │ WebSocket TLS  │  (Encrypted tunnel)
    └──────┬─────────┘
           │
    ┌──────▼──────────────┐
    │ User's Proxmox      │
    │ (Anywhere on Earth) │
    └─────────────────────┘
```

---

## 🔐 Sécurité (Phase 1)

- ✅ JWT authentication (15min access token)
- ✅ bcryptjs password hashing
- ✅ react-native-keychain (stocker credentials Proxmox)
- ✅ HTTPS obligatoire en production
- ❌ 2FA (Phase 2)
- ❌ OAuth (Phase 2)

---

## 📦 Monétisation

### Free Plan
- **1 serveur** accessible via le cloud relay MyProx
- **5 serveurs** accessibles en mode local uniquement
- Limite de 10 GB de bande passante/mois
- Parfait pour : tester, homelab, petites infra

### Premium Plan ($9.99/mois)
- **Serveurs illimités** (local + cloud combinés)
- Bande passante **illimitée**
- Accès API complet
- Support prioritaire 24/7
- SLA 99.9%

### Implémentation
Le backend applique ces limites automatiquement :
```javascript
if (user.plan === 'free') {
  if (cloudServers > 1 || localServers > 5) {
    throw new Error('Upgrade to Premium');
  }
}
```

---

## ✅ Checklist Avant de Commencer

- [ ] Tu as un Mac M4 (ou équivalent ARM)
- [ ] Docker Desktop installé
- [ ] Node.js 18+ installé
- [ ] Compte GitHub créé
- [ ] Repo privé créé : `https://github.com/ton-user/myprox`
- [ ] Au moins 1 serveur Proxmox local pour tester (virtuel ou physique)
- [ ] Stripe account créé (optionnel pour MVP, obligatoire pour Phase 2)
- [ ] VPS loué (optionnel pour Phase 1, obligatoire après)
  - Hetzner, Linode, ou DigitalOcean (~15€/mois min)

---

## 🎓 Comment Utiliser Ce Prompt

### Étape 1 : Lire ce README
✅ Fait !

### Étape 2 : Valider l'architecture
Lis le `PROMPT_CLAUDE_CODE_MYPROX.md` en entier et assure-toi que tu acceptes :
- Tech stack (React Native + Node.js + Docker)
- Monétisation (Free vs Premium)
- Structure du projet
- Timeline (~20-30 jours)

### Étape 3 : Lancer Claude Code
1. Ouvre Claude Code
2. Copie-colle le contenu de `PROMPT_FINAL_CLAUDE_CODE.md`
3. Suis les tâches 1 par 1
4. Valide à la fin de chaque tâche

### Étape 4 : Déployer en Production
Une fois Phase 1 terminée (7-10 jours) :
- Build sur EAS Cloud (TestFlight iOS + Google Play Beta Android)
- Lancer les VPS pour l'API + Relay (optionnel, peut rester local pour MVP)
- Publier sur GitHub (code public, secrets privés)

---

## 🐛 Debugging Common Issues

### "docker-compose: command not found"
```bash
# Installe Docker Desktop ou utilise :
docker compose up -d  # (sans tiret)
```

### "Port 3000 already in use"
```bash
# Change le port dans docker-compose.yml :
ports:
  - "3001:3000"  # ← utilise 3001 au lieu de 3000
```

### "PostgreSQL connection refused"
```bash
# Attends que PostgreSQL soit ready (~5 secondes)
docker-compose logs postgres
# Doit voir : "database system is ready to accept connections"
```

### "Expo app ne compile pas"
```bash
# Clear cache Expo
npx expo start --clear

# Ou depuis zero
rm -rf node_modules package-lock.json
npm install
npx expo start
```

---

## 📚 Ressources Utiles

| Ressource | URL |
|-----------|-----|
| Proxmox API Docs | https://pve.proxmox.com/wiki/Proxmox_VE_API2 |
| React Native Expo | https://docs.expo.dev/ |
| Node.js + Express | https://expressjs.com/ |
| PostgreSQL Docs | https://www.postgresql.org/docs/ |
| Docker Compose | https://docs.docker.com/compose/ |
| JWT.io | https://jwt.io/ |

---

## 🎯 What's Next After Phase 1?

Une fois Phase 1 (MVP Local) validée :

### Phase 2 : Cloud Relay (5-7 jours)
- Implémenter le Golang relay (tunnel WebSocket)
- Pairing device (QR code)
- Test tunnel end-to-end

### Phase 3 : Polish (3-5 jours)
- Monitoring CPU/RAM live
- Tests unitaires complets
- Gestion d'erreurs robuste
- Animations UI

### Phase 4 : Site Vitrine (2-3 jours)
- Landing page Next.js
- Pricing page
- Documentation API

### Phase 5 : Beta (2 jours)
- Build TestFlight (iOS)
- Build Google Play Beta (Android)
- Inviter 50 beta testers

---

## ❓ Questions Fréquentes

**Q: Pourquoi React Native et pas Flutter?**
A: React Native compile sur Mac M4, itération plus rapide, plus grand marché. Flutter c'est pour v2.

**Q: Combien ça coûte pour héberger MyProx?**
A: MVP ~50€/mois (1 API VPS + 1 Relay VPS). Scale à ~200€/mois avec 1000 users.

**Q: Proxmox 7 ou 8?**
A: Support les 2. API compatible. Test sur 8.x en priorité.

**Q: Faut-il un vrai serveur Proxmox pour développer?**
A: Non! Proxmox peut tourner en VM (VMware/VirtualBox). 4GB RAM suffit.

**Q: Comment on gère les utilisateurs sans serveur cloud?**
A: Phase 1 = local uniquement (pas de cloud relay), donc pas besoin. Phase 2 on ajoute le relay.

---

## 📞 Support

Si tu bloques :
1. Relis le prompt correspondant
2. Vérifie les logs Docker : `docker-compose logs api`
3. Check la console Expo : `npx expo start`
4. Pose une question clairement avec le contexte

---

## 📄 License

MIT License - Code ouvert, transparence totale.

---

**Créé Avril 2026 • MyProx v1.0 MVP**

**Tu es prêt ? → Ouvre `PROMPT_FINAL_CLAUDE_CODE.md` et lance Claude Code ! 🚀**

# Guide de déploiement — MyProx Agent Local

Ce guide explique comment connecter un serveur Proxmox au relay cloud MyProx via l'agent Go.

## Architecture

```
📱 App Mobile → 🌐 API Backend → ☁ Relay (Go)
                                        ↓  WebSocket
                               🖥 Agent (Go) → 🧱 Proxmox
```

L'**agent** tourne sur le même réseau local que Proxmox. Il ouvre une connexion WebSocket persistante vers le relay cloud. Toutes les requêtes Proxmox passent à travers ce tunnel chiffré.

---

## Étapes

### 1. Obtenir un token agent depuis l'app

1. Ouvrez l'app MyProx
2. Tapez **+** (ajouter un serveur)
3. Choisissez le mode **Cloud**
4. Renseignez le nom, l'IP Proxmox, l'utilisateur et le mot de passe
5. L'app affiche un **Agent Token** → copiez-le

Ou via l'API :
```bash
curl -X POST http://localhost:3000/api/v1/servers \
  -H "Authorization: Bearer <votre_access_token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"mon-proxmox","ip":"10.0.0.10","username":"root@pam","password":"motdepasse","mode":"cloud"}'
```

La réponse contient `agentToken`.

---

### 2. Lancer l'agent via Docker

Sur la machine qui a accès à votre Proxmox (peut être la même), créez un `.env.agent` :

```env
RELAY_URL=ws://<ip-ou-domaine-relay>:8080/agent/connect
AGENT_TOKEN=<token-obtenu-à-létape-1>
PROXMOX_URL=https://10.0.0.10:8006/api2/json
PROXMOX_USER=root@pam
PROXMOX_PASS=motdepasse
```

Puis lancez :
```bash
docker build -t myprox-agent ./agent
docker run -d --name myprox-agent --env-file .env.agent --restart unless-stopped myprox-agent
```

---

### 3. Vérifier la connexion

Depuis l'API :
```bash
curl http://localhost:3000/api/v1/cloud/relay-status/<server-id> \
  -H "Authorization: Bearer <votre_access_token>"
# Réponse attendue : {"connected": true, "relay_url": "..."}
```

Depuis le relay directement :
```bash
curl http://localhost:8080/status/<server-id>
# Réponse attendue : {"connected": true}
```

---

### 4. Tester le tunnel complet

```bash
# Lister les VMs via le tunnel cloud
curl http://localhost:3000/api/v1/servers/<server-id>/vms \
  -H "Authorization: Bearer <votre_access_token>"
```

Si la connexion tunnel fonctionne, vous obtiendrez la liste des VMs de votre Proxmox distant.

---

## Variables d'environnement de l'agent

| Variable | Exemple | Description |
|----------|---------|-------------|
| `RELAY_URL` | `ws://relay.myprox.app:8080/agent/connect` | URL WebSocket du relay |
| `AGENT_TOKEN` | `eyJ...` | JWT généré par l'API backend |
| `PROXMOX_URL` | `https://10.0.0.10:8006/api2/json` | URL de l'API Proxmox locale |
| `PROXMOX_USER` | `root@pam` | Utilisateur Proxmox |
| `PROXMOX_PASS` | `motdepasse` | Mot de passe Proxmox |

> **Sécurité** : L'agent accepte les certificats auto-signés Proxmox (InsecureSkipVerify). En production, pointez vers un Proxmox avec un certificat valide ou configurez la CA.

---

## Comportement de l'agent

- **Reconnexion automatique** : Si la connexion relay est perdue, l'agent se reconnecte toutes les 5 secondes
- **Re-auth Proxmox** : Si Proxmox retourne 401, l'agent se ré-authentifie automatiquement
- **Concurrence** : Chaque requête est traitée dans une goroutine séparée (haute performance)
- **Timeout** : Le relay coupe les requêtes sans réponse après 30 secondes

---

## Métriques relay

Le relay expose un endpoint interne de métriques :
```bash
curl http://localhost:8080/metrics
# {"agents_connected": 1, "requests_proxied": 42, "requests_failed": 0}
```

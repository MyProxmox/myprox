# Guide Cloudflare Tunnel — MyProx

Cloudflare Tunnel permet d'exposer vos services locaux sur Internet via un tunnel sécurisé, sans ouvrir de ports sur votre box/serveur. Cloudflare gère le SSL automatiquement.

## Architecture

```
Internet → Cloudflare Edge (SSL ✓) → cloudflared (tunnel) → Services Docker internes
                                           ↓
                              myprox.app        → website:3001
                              api.myprox.app    → api:3000
                              relay.myprox.app  → relay:8080
```

---

## Étape 1 — Créer le tunnel dans le Dashboard Cloudflare

1. Connectez-vous sur [dash.cloudflare.com](https://dash.cloudflare.com)
2. Dans le menu gauche : **Zero Trust** → **Networks** → **Tunnels**
3. Cliquez **Create a tunnel** → **Cloudflared**
4. Donnez-lui un nom : `myprox-production`
5. **Notez le `TUNNEL_TOKEN`** affiché (format long, commence par `eyJ...`)

---

## Étape 2 — Configurer les routes DNS (Public Hostnames)

Dans la configuration du tunnel, onglet **Public Hostname** :

| Subdomain | Domain | Service |
|-----------|--------|---------|
| `@` (root) | `myprox.app` | `http://website:3001` |
| `api` | `myprox.app` | `http://api:3000` |
| `relay` | `myprox.app` | `http://relay:8080` |
| `ops` | `myprox.app` | `http://ops:3002` |

Cloudflare crée automatiquement les enregistrements DNS CNAME.

---

## Étape 3 — Configurer le token dans `.env.production`

```env
CLOUDFLARE_TUNNEL_TOKEN=eyJ...votre_token_complet...
```

---

## Étape 4 — Lancer les services

```bash
# Copier et remplir le fichier de config production
cp .env.production.example .env.production
nano .env.production

# Déployer avec le docker-compose de production
./scripts/deploy.sh
```

Le service `cloudflared` dans `docker-compose.yml` va automatiquement se connecter au tunnel avec le token.

---

## Vérification

```bash
# Dans le Dashboard Cloudflare → Tunnels : statut "Healthy"
# Ou tester directement :
curl https://api.myprox.app/api/v1/health
# Réponse attendue : {"status":"ok","timestamp":"..."}
```

---

## Notes importantes

- **TLS** : Cloudflare termine SSL côté edge. En interne, le trafic est HTTP (non chiffré mais dans un réseau Docker privé).
- **WebSocket** (relay) : Cloudflare supporte les WebSockets nativement. Activez **WebSocket** dans les paramètres du hostname `relay.myprox.app`.
- **Stripe webhooks** : L'URL webhook Stripe doit pointer vers `https://api.myprox.app/api/v1/stripe/webhook`.
- **Pas de port 80/443** exposé sur le serveur — Cloudflare gère tout.

---

## Configuration WebSocket pour le Relay

Dans le Dashboard Cloudflare → **Tunnels** → votre tunnel → **Public Hostname** → `relay.myprox.app` :
- Cliquez sur le hostname → **Additional application settings**
- Activez **HTTP/2** et **WebSocket**

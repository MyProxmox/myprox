#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  MyProx — Deploy script (production)
#  Usage: ./scripts/deploy.sh [--no-build]
# ═══════════════════════════════════════════════════════════════════
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_BASE="$ROOT_DIR/docker-compose.yml"
COMPOSE_PROD="$ROOT_DIR/docker-compose.prod.yml"
ENV_FILE="$ROOT_DIR/.env.production"
NO_BUILD="${1:-}"

cd "$ROOT_DIR"

echo ""
echo "🚀 MyProx Deploy — $(date '+%Y-%m-%d %H:%M:%S')"
echo "══════════════════════════════════════════"

# ── Check prerequisites ──────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "❌ Docker not found. Install Docker first."
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ .env.production not found!"
  echo "   cp .env.production.example .env.production"
  echo "   Fill in all required variables."
  exit 1
fi

# ── Validate required env vars ───────────────────────────────────────
source "$ENV_FILE"
REQUIRED_VARS=(
  JWT_SECRET JWT_REFRESH_SECRET ENCRYPTION_KEY
  POSTGRES_PASSWORD DATABASE_URL
  STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET STRIPE_PRICE_ID_PREMIUM
  CLOUDFLARE_TUNNEL_TOKEN
)
MISSING=0
for var in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!var:-}" || "${!var}" == *"CHANGE_ME"* || "${!var}" == *"<YOUR_"* ]]; then
    echo "❌ Missing or placeholder value: $var"
    MISSING=1
  fi
done
[[ $MISSING -eq 1 ]] && { echo "Fix the variables above in .env.production"; exit 1; }

echo "✅ Environment variables validated"

# ── Pull latest (if git repo) ─────────────────────────────────────────
if [[ -d "$ROOT_DIR/.git" ]]; then
  echo "📥 Pulling latest changes..."
  git pull --ff-only || echo "⚠️  Git pull failed — continuing with current code"
fi

# ── Build & deploy ────────────────────────────────────────────────────
DC="docker compose --env-file $ENV_FILE -f $COMPOSE_BASE -f $COMPOSE_PROD"

if [[ "$NO_BUILD" == "--no-build" ]]; then
  echo "⚡ Skipping build (--no-build)"
else
  echo "🔨 Building images..."
  $DC build --parallel
fi

echo "🔄 Bringing services up..."
$DC up -d

echo ""
echo "✅ Deployed! Waiting for health checks..."
sleep 5

# ── Quick health check ─────────────────────────────────────────────────
"$SCRIPT_DIR/health-check.sh" || echo "⚠️  Some health checks failed — check logs"

echo ""
echo "📋 Service status:"
$DC ps
echo ""
echo "🌐 Your app should be accessible at:"
echo "   https://myprox.app          (landing page)"
echo "   https://api.myprox.app/api/v1/health"
echo "   https://relay.myprox.app    (relay)"

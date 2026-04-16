#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  MyProx — Health Check script
#  Usage: ./scripts/health-check.sh
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail

API_URL="${API_BASE_URL:-http://localhost:3000}"
WEBSITE_URL="${WEBSITE_URL:-http://localhost:3001}"
RELAY_URL="${RELAY_BASE_URL:-http://localhost:8080}"
TIMEOUT=10
PASS=0
FAIL=0

check() {
  local name="$1"
  local url="$2"
  local expected="${3:-200}"

  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$url" 2>/dev/null || echo "000")

  if [[ "$status" == "$expected" ]]; then
    echo "  ✅ $name ($url) → $status"
    PASS=$((PASS+1))
  else
    echo "  ❌ $name ($url) → $status (expected $expected)"
    FAIL=$((FAIL+1))
  fi
}

echo ""
echo "🔍 MyProx Health Check — $(date '+%Y-%m-%d %H:%M:%S')"
echo "══════════════════════════════════════════"

echo ""
echo "Services:"
check "API Health"    "$API_URL/api/v1/health"  200
check "Website"       "$WEBSITE_URL"            200
check "Relay"         "$RELAY_URL/health"       200

echo ""
echo "Database via API:"
# Check that API can reach DB (returns 401, not 500)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$API_URL/api/v1/user/profile" 2>/dev/null || echo "000")
if [[ "$STATUS" == "401" ]]; then
  echo "  ✅ Database connectivity (API → DB) → 401 Unauthorized (expected)"
  PASS=$((PASS+1))
else
  echo "  ❌ Database connectivity issue → $STATUS (expected 401)"
  FAIL=$((FAIL+1))
fi

echo ""
echo "Cloudflare Tunnel:"
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q cloudflared; then
  CF_STATUS=$(docker inspect myprox-cloudflared-1 --format '{{.State.Status}}' 2>/dev/null || echo "unknown")
  if [[ "$CF_STATUS" == "running" ]]; then
    echo "  ✅ cloudflared container running"
    PASS=$((PASS+1))
  else
    echo "  ⚠️  cloudflared container status: $CF_STATUS"
  fi
else
  echo "  ℹ️  cloudflared not running (local mode)"
fi

echo ""
echo "══════════════════════════════════════════"
echo "Results: ✅ $PASS passed  ❌ $FAIL failed"
echo ""

[[ $FAIL -eq 0 ]]

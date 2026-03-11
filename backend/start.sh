#!/bin/sh
set -e

# Write ~/.claude.json to bypass the interactive onboarding wizard.
# Values come from Railway env vars.
cat > ~/.claude.json <<EOF
{
  "hasCompletedOnboarding": true,
  "lastOnboardingVersion": "2.1.73",
  "oauthAccount": {
    "accountUuid": "${CLAUDE_ACCOUNT_UUID}",
    "emailAddress": "${CLAUDE_EMAIL}",
    "organizationUuid": "${CLAUDE_ORG_UUID}"
  }
}
EOF

echo "[start.sh] Claude config written"

# Start the claude-max-api-proxy in the background (port 3456)
claude-max-api &
PROXY_PID=$!
echo "[start.sh] Proxy started (pid $PROXY_PID), waiting for health..."

# Wait for the proxy to become healthy (up to 60s)
TRIES=0
MAX_TRIES=60
while [ $TRIES -lt $MAX_TRIES ]; do
  if curl -s http://localhost:3456/health > /dev/null 2>&1; then
    echo "[start.sh] Proxy is healthy"
    break
  fi
  TRIES=$((TRIES + 1))
  sleep 1
done

if [ $TRIES -eq $MAX_TRIES ]; then
  echo "[start.sh] ERROR: Proxy did not become healthy after ${MAX_TRIES}s"
  exit 1
fi

# Start gunicorn in the foreground so Railway can manage the process
exec gunicorn app:app \
  --bind "0.0.0.0:${PORT:-8080}" \
  --workers 2 \
  --threads 4 \
  --timeout 120

#!/bin/sh
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  echo "Missing .env. Copy docker-compose.prod.env.example to .env and fill POSTGRES_PASSWORD, BETTER_AUTH_SECRET, and GROQ_API_KEY."
  exit 1
fi

docker compose \
  --env-file .env \
  -f docker-compose.prod.yml \
  up --build -d

echo "JS Ashanti should be available at ${PUBLIC_URL:-http://localhost}"
echo "Health check: curl -sS ${PUBLIC_URL:-http://localhost}/api/health"

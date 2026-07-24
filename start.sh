#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"; cd "$ROOT"; if [ ! -f .env ]; then echo "Missing .env; copy .env.example." >&2; exit 1; fi
set -a; . ./.env; set +a; : "${JWT_SECRET:?JWT_SECRET required}"; if [ "${#JWT_SECRET}" -lt 32 ]; then exit 1; fi
if [ ! -d backend/node_modules ] || [ ! -d frontend/node_modules ]; then echo "Run scripts/bootstrap.sh explicitly." >&2; exit 1; fi
BACKEND_PORT="${BACKEND_PORT:-3041}"; FRONTEND_PORT="${FRONTEND_PORT:-3040}"; for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do if command -v lsof >/dev/null && lsof -ti ":$port" >/dev/null 2>&1; then echo "Port $port is in use." >&2; exit 1; fi; done
(cd backend && node server.js) & B=$!; (cd frontend && HOST="${HOST:-127.0.0.1}" PORT="$FRONTEND_PORT" REACT_APP_API_BASE="http://${HOST:-127.0.0.1}:$BACKEND_PORT/api" BROWSER=none npm start) & F=$!; cleanup(){ kill "$B" "$F" 2>/dev/null || true; }; trap cleanup EXIT INT TERM; wait

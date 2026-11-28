#!/usr/bin/env bash
# =============================================================================
# apps/mascap-app/build.sh: builds the MASCAP demo app into sites/mascap-app.
#
# Why: request 262 (Anthony, 2026-11-27). The demo is the real Rhema app,
# built from a clean copy with the demo layer on top (apply-overlay.mjs):
# no backend, the database runs in the visitor's browser (PGlite) with made
# up data (build-db.mjs).
#
# Usage: apps/mascap-app/build.sh [Rhema git ref, default main]
# Needs: node 22, git, python3 with Pillow (for the icons).
#
# Never: build from anything but a fresh copy, or put real data in.
# =============================================================================
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
REF="${1:-main}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# ===== 1. A fresh copy of the Rhema app =====
git clone -q --depth 1 --branch "$REF" https://github.com/billiondollarprof/Rhema "$WORK/rhema"
COMMIT=$(git -C "$WORK/rhema" rev-parse --short HEAD)
echo "== Rhema $REF at $COMMIT"

# ===== 2. The demo layer and MASCAP's icons =====
node "$HERE/apply-overlay.mjs" "$WORK/rhema"
python3 "$HERE/icons.py" "$ROOT/sites/mascap-web/i/logo-256.webp" "$WORK/rhema/web/brands/mascap"

# ===== 3. Build the app =====
cd "$WORK/rhema"
npm ci --silent
( cd web && NEXT_PUBLIC_SUPABASE_URL=https://demo.invalid NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=demo NEXT_PUBLIC_BRAND=mascap NEXT_PUBLIC_DEMO=1 npm run build )
node scripts/pitch-brand.mjs mascap

# ===== 4. The database and PGlite beside the app =====
mkdir -p web/out/demo/pglite/contrib
( cd "$HERE" && npm ci --silent )
node "$HERE/build-db.mjs" "$WORK/rhema" web/out/demo/db.tar.gz
P="$HERE/node_modules/@electric-sql/pglite/dist"
cp "$P"/*.js "$P"/*.wasm "$P"/*.data "$P"/pgcrypto.tar.gz "$P"/uuid-ossp.tar.gz web/out/demo/pglite/
cp "$P"/contrib/pgcrypto.js "$P"/contrib/uuid_ossp.js web/out/demo/pglite/contrib/
# pglite.data is sent compressed (6.3 MB becomes 1.9 MB); the Worker says so.
gzip -9 -n web/out/demo/pglite/pglite.data
# The sizes, for the progress line on the first screen.
node -e "const fs=require('fs');const d='web/out/demo/';const s=f=>fs.statSync(d+f).size;fs.writeFileSync(d+'sizes.json',JSON.stringify({'pglite/pglite.wasm':s('pglite/pglite.wasm'),'pglite/pglite.data':require('zlib').gunzipSync(fs.readFileSync(d+'pglite/pglite.data.gz')).length,'db.tar.gz':s('db.tar.gz')}))"

# ===== 5. Let WebAssembly run (PGlite needs it), from this address only =====
sed -i "s/script-src 'self' 'unsafe-inline';/script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval';/" web/out/_headers
grep -q "wasm-unsafe-eval" web/out/_headers

# ===== 6. Into the demos site =====
rm -rf "$ROOT/sites/mascap-app"
cp -r web/out "$ROOT/sites/mascap-app"
echo "$COMMIT" > "$ROOT/sites/mascap-app/demo/rhema-commit.txt"
echo "== Built sites/mascap-app from Rhema $COMMIT"

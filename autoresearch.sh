#!/bin/bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

# ── Static metric: count `run: pnpm install` calls across workflow files ───────
# Each call ≈ 2-5 min CI install overhead per job.
# Primary optimization target: reduce redundant installs.
PNPM_INSTALL_CALLS=0
while IFS=: read -r _file count; do
  PNPM_INSTALL_CALLS=$(( PNPM_INSTALL_CALLS + count ))
done < <(grep -c 'run: pnpm install' .github/workflows/*.yml)
echo "METRIC pnpm_install_calls=${PNPM_INSTALL_CALLS}"

# ── Secondary: count --frozen-lockfile uses (higher = better CI discipline) ────
FROZEN_COUNT=0
while IFS=: read -r _file count; do
  FROZEN_COUNT=$(( FROZEN_COUNT + count ))
done < <(grep -c '\-\-frozen-lockfile' .github/workflows/*.yml 2>/dev/null || true)
echo "METRIC frozen_lockfile_uses=${FROZEN_COUNT}"

# ── Local install time: cold root install (simulates CI with warm pnpm store) ──
# Remove root node_modules (only root-level packages: eslint, husky, etc.).
# This simulates what every CI job does: restore global pnpm store from cache,
# then re-link the workspace root.
rm -rf node_modules

START_MS=$(python3 -c 'import time; print(int(time.time()*1000))')
pnpm install --frozen-lockfile 2>&1 | tail -2
END_MS=$(python3 -c 'import time; print(int(time.time()*1000))')

ELAPSED_MS=$(( END_MS - START_MS ))
ELAPSED_S=$(python3 -c "print(round($ELAPSED_MS/1000, 2))")

echo "METRIC pnpm_install_s=${ELAPSED_S}"
echo "  root install time: ${ELAPSED_MS}ms"

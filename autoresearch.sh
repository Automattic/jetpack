#!/bin/bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

# ── Static analysis: count redundant pnpm install calls across workflow files ──
# Each `run: pnpm install` in a CI workflow = ~2-5 min overhead per job runner.
# This is the PRIMARY metric: fewer redundant installs = faster CI.
PNPM_INSTALL_CALLS=0
while IFS=: read -r _file count; do
  PNPM_INSTALL_CALLS=$(( PNPM_INSTALL_CALLS + count ))
done < <(grep -c 'run: pnpm install' .github/workflows/*.yml)
echo "METRIC pnpm_install_calls=${PNPM_INSTALL_CALLS}"

# ── Secondary: frozen-lockfile uses (correctness+perf flag in CI installs) ─────
FROZEN_COUNT=0
while IFS=: read -r _file count; do
  FROZEN_COUNT=$(( FROZEN_COUNT + count ))
done < <(grep -c '\-\-frozen-lockfile' .github/workflows/*.yml 2>/dev/null || true)
echo "METRIC frozen_lockfile_uses=${FROZEN_COUNT}"

# ── Secondary: prefer-offline uses (skips registry roundtrips in CI) ──────────
OFFLINE_COUNT=0
while IFS=: read -r _file count; do
  OFFLINE_COUNT=$(( OFFLINE_COUNT + count ))
done < <(grep -c '\-\-prefer-offline' .github/workflows/*.yml 2>/dev/null || true)
echo "METRIC prefer_offline_uses=${OFFLINE_COUNT}"

# ── Secondary: per-install timing (how long one install takes) ─────────────────
# Removes root node_modules (workspace symlinks), reinstalls with the current
# config. Simulates CI: warm global pnpm store, fresh linking step.
rm -rf node_modules

START_MS=$(python3 -c 'import time; print(int(time.time()*1000))')
pnpm install --frozen-lockfile 2>&1 | tail -1
END_MS=$(python3 -c 'import time; print(int(time.time()*1000))')
ELAPSED_MS=$(( END_MS - START_MS ))
ELAPSED_S=$(python3 -c "print(round($ELAPSED_MS/1000, 2))")
echo "METRIC pnpm_install_s=${ELAPSED_S}"

# ── Composite: theoretical CI install-minutes (calls × per-install-time) ───────
# Lower = better overall CI cost.
COMPOSITE=$(python3 -c "print(round($PNPM_INSTALL_CALLS * $ELAPSED_S, 1))")
echo "METRIC ci_install_cost_s=${COMPOSITE}"
echo "  install_calls=${PNPM_INSTALL_CALLS}  per_install=${ELAPSED_S}s  total=${COMPOSITE}s"

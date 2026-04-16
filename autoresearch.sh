#!/bin/bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

# ── Static metric: count pnpm install calls in workflow files ──────────────────
PNPM_INSTALL_CALLS=$(grep -c 'run: pnpm install' .github/workflows/*.yml | awk -F: '{sum += $2} END {print sum}')
echo "METRIC pnpm_install_calls=${PNPM_INSTALL_CALLS}"

# ── Dynamic metric: time pnpm install (frozen, simulates CI cache-hit scenario) ─
# Measure median of 3 runs to smooth noise.
TIMES=()
for i in 1 2 3; do
  START=$(date +%s%3N)
  pnpm install --frozen-lockfile --prefer-offline 2>/dev/null
  END=$(date +%s%3N)
  ELAPSED_MS=$(( END - START ))
  TIMES+=( "$ELAPSED_MS" )
done

# Sort and take median
IFS=$'\n' SORTED=( $(sort -n <<<"${TIMES[*]}") ); unset IFS
MEDIAN_MS="${SORTED[1]}"
MEDIAN_S=$(echo "scale=2; $MEDIAN_MS / 1000" | bc)

echo "METRIC pnpm_install_s=${MEDIAN_S}"
echo "  run times (ms): ${TIMES[*]}"
echo "  median (ms):    ${MEDIAN_MS}"

#!/usr/bin/env bash
# Starts the E2E site on localhost without the encrypted config or a tunnel; CI uses env:up instead.
set -e

# The CLI's readiness check only follows --port, not the PORT_WORDPRESS environment variable.
PORT="${PORT_WORDPRESS:-8889}"
D=( pnpm jetpack docker --type e2e --name t1 )
"${D[@]}" up -d --port "$PORT"
"${D[@]}" install || true
# The helper reads Jetpack_Options when it activates, so Jetpack goes first.
"${D[@]}" wp -- plugin activate jetpack
"${D[@]}" wp -- plugin activate e2e-premium-analytics-helper
"${D[@]}" wp -- option set permalink_structure ""

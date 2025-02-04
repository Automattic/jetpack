#!/bin/bash

# Exit on error
set -e

# Check and set PNPM store location
EXPECTED_STORE="/workspace/tools/docker/data/pnpm-store"
CURRENT_STORE=$(pnpm config get store-dir)

if [ "$CURRENT_STORE" != "$EXPECTED_STORE" ]; then
    echo "Setting PNPM store directory to $EXPECTED_STORE"
    mkdir -p "$EXPECTED_STORE"
    pnpm config set store-dir "$EXPECTED_STORE"
fi

# Check if jetpack command is available
if ! pnpm jetpack --help &>/dev/null; then
    echo "Setting up Jetpack CLI..."
    pnpm install
fi

# Execute the passed command
exec "$@"

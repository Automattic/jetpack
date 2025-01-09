#!/bin/bash

# Exit on error
set -e

# Check if jetpack command is available
if ! pnpm jetpack --help >/dev/null 2>&1; then
    echo "Setting up Jetpack CLI..."
    pnpm install
fi

# Execute the passed command
exec "$@"

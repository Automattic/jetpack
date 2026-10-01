#!/usr/bin/env bash

# Usage: action-test-js.sh [--coverage]

set -eo pipefail

declare -A TESTS
TESTS[client]="pnpm run test-client $*"
TESTS[gui]="pnpm run test-gui $*"
TESTS[extensions]="pnpm run test-extensions $*"

pnpm exec concurrently --max-processes '50%' --names "$( IFS=,; echo "${!TESTS[*]}" )" "${TESTS[@]}"

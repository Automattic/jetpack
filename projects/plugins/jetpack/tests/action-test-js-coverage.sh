#!/usr/bin/env bash

set -eo pipefail

declare -A TESTS
TESTS[client]="pnpm run test-client --coverage"
TESTS[gui]="pnpm run test-gui --coverage"
TESTS[extensions]="pnpm run test-extensions --coverage"

pnpm exec concurrently --max-processes '50%' --names "$( IFS=,; echo "${!TESTS[*]}" )" "${TESTS[@]}"

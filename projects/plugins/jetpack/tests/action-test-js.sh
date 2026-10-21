#!/usr/bin/env bash

# Usage: action-test-js.sh [--coverage]

set -eo pipefail

COVERAGE_FLAG=
if [[ "$1" == '--coverage' ]]; then
	COVERAGE_FLAG='--coverage'
fi

declare -A TESTS
TESTS[client]="pnpm run test-client $COVERAGE_FLAG"
TESTS[gui]="pnpm run test-gui $COVERAGE_FLAG"
TESTS[extensions]="pnpm run test-extensions $COVERAGE_FLAG"

# Each jest run already uses all available CPUs, so run about half as many suites at once.
# That said, `--max-processes` looks directly at the CPU count, so 50% isn't ideal when
# pinned to one CPU. Let's hard-code max processes to 1 in that case.
MAX_PROCESSES='50%'
if [[ "$( node -p 'require( "os" ).availableParallelism()' )" == 1 ]]; then
	MAX_PROCESSES=1
fi

pnpm exec concurrently --max-processes "$MAX_PROCESSES" --names "$( IFS=,; echo "${!TESTS[*]}" )" "${TESTS[@]}"

#!/usr/bin/env bash

# Usage: action-test-js.sh [--coverage]

set -eo pipefail

# Each jest run already uses all available CPUs, so run the suites in series.
echo "::group::Jetpack client tests"
pnpm run test-client "$@"
echo "::endgroup::"
echo "::group::Jetpack gui tests"
pnpm run test-gui "$@"
echo "::endgroup::"
echo "::group::Jetpack extensions tests"
pnpm run test-extensions "$@"
echo "::endgroup::"

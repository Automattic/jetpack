#!/bin/bash

set -eo pipefail

cd $(dirname "${BASH_SOURCE[0]}")/../..

. tools/includes/chalk-lite.sh

function debug {
	blue "$@" >&2
}

function die {
	echo "::error::$*" >&2
	exit 1
}

ARGS=( --add-dependents )

# Code coverage probably needs to run all tests to avoid confusing metrics.
# @todo Switch it to use codecov.io's carryforward: https://about.codecov.io/blog/new-product-test-only-what-you-change-with-carryforward-flags/
if [[ "$TEST_SCRIPT" == "test-coverage" ]]; then
	debug "TEST_SCRIPT is test-coverage, considering all projects changed."
elif [[ "${GITHUB_EVENT_NAME:?}" == "pull_request" ]]; then
	[[ -f "${GITHUB_EVENT_PATH:?}" ]] || die "GITHUB_EVENT_PATH file $GITHUB_EVENT_PATH does not exist"
	DIFF="$(jq -r '"\( .pull_request.base.sha )..\( .pull_request.head.sha )"' "$GITHUB_EVENT_PATH")"
	debug "GITHUB_EVENT_NAME is pull_request, checking diff from $DIFF"
	ARGS+=( --verbose "--git-changed=$DIFF" )
elif [[ "${GITHUB_EVENT_NAME:?}" == "push" ]]; then
	debug "GITHUB_EVENT_NAME is push, considering all projects changed."
else
	die "Unsupported GITHUB_EVENT_NAME \"$GITHUB_EVENT_NAME\""
fi

pnpx jetpack dependencies list "${ARGS[@]}" | jq -ncR 'reduce inputs as $i ({}; .[$i] |= true)'

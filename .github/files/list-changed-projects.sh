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

if [[ "${GITHUB_EVENT_NAME:?}" == "pull_request" ]]; then
	[[ -f "${GITHUB_EVENT_PATH:?}" ]] || die "GITHUB_EVENT_PATH file $GITHUB_EVENT_PATH does not exist"
	DIFF="$(jq -r '"\( .pull_request.base.sha )...\( .pull_request.head.sha )"' "$GITHUB_EVENT_PATH")"
	debug "GITHUB_EVENT_NAME is pull_request, checking diff from $DIFF"
	ARGS+=( --verbose "--git-changed=$DIFF" )
elif [[ "${GITHUB_EVENT_NAME:?}" == "push" ]]; then
	debug "GITHUB_EVENT_NAME is push, considering all projects changed."
else
	die "Unsupported GITHUB_EVENT_NAME \"$GITHUB_EVENT_NAME\""
fi

if [[ -n "$EXTRA" ]]; then
	ARGS+=( --extra="$EXTRA" )
	if [[ "$EXTRA" == "build" ]]; then
		ARGS+=( --ignore-root )
	fi
fi

pnpm jetpack dependencies list "${ARGS[@]}" | jq -ncR 'reduce inputs as $i ({}; .[$i] |= true)'

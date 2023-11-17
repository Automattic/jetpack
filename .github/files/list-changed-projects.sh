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

DEPENDENTS=true
DEPENDENCIES=false
ARGS=()

if [[ "${GITHUB_EVENT_NAME:?}" == "pull_request" ]]; then
	[[ -f "${GITHUB_EVENT_PATH:?}" ]] || die "GITHUB_EVENT_PATH file $GITHUB_EVENT_PATH does not exist"
	DIFF="$(jq -r '"\( .pull_request.base.sha )...\( .pull_request.head.sha )"' "$GITHUB_EVENT_PATH")"
	debug "GITHUB_EVENT_NAME is pull_request, checking diff from $DIFF"
	ARGS+=( --verbose "--git-changed=$DIFF" )
elif [[ "${GITHUB_EVENT_NAME:?}" == "push" ]]; then
	if [[ "${GITHUB_REF:?}" == refs/heads/prerelease ]]; then
		TMP="$(jq -r 'if .extra["release-branch-prefix"] then empty else input_filename | match( "^projects/([^/]+/[^/]+)/composer.json$" ).captures[0].string end' projects/*/*/composer.json)"
		if [[ -n "$TMP" ]]; then
			debug "GITHUB_EVENT_NAME is push and branch is prerelease, considering only projects without a release-branch-prefix as changed."
			while IFS= read -r LINE; do
				ARGS+=( "$LINE" )
			done <<<"$TMP"
			DEPENDENTS=false
			if [[ "$EXTRA" == "test" ]]; then
				debug "Also considering dependencies of those as changed for running tests"
				DEPENDENCIES=true
			fi
		else
			debug "GITHUB_EVENT_NAME is push and branch is prerelease, but somehow no projects lack a release-branch-prefix? Considering all projects changed."
		fi
	elif [[ "${GITHUB_REF:?}" == refs/heads/*/branch-* ]]; then
		REF=${GITHUB_REF#refs/heads/}
		TMP="$(jq -r --arg P "${REF%%/branch-*}" '.extra["release-branch-prefix"] | if type == "array" then . else [ . ] end | if index( $P ) then input_filename | match( "^projects/([^/]+/[^/]+)/composer.json$" ).captures[0].string else empty end' projects/*/*/composer.json)"
		if [[ -n "$TMP" ]]; then
			debug "GITHUB_EVENT_NAME is push and branch $REF seems to be a release branch, considering matching projects changed: ${TMP//$'\n'/ }"
			while IFS= read -r LINE; do
				ARGS+=( "$LINE" )
			done <<<"$TMP"
			if [[ "$EXTRA" == "test" ]]; then
				debug "Also considering dependencies of those as changed for running tests"
				DEPENDENCIES=true
			fi
		else
			debug "GITHUB_EVENT_NAME is push and branch $REF does not seem to be a release branch (nothing uses that prefix), considering all projects changed."
		fi
	else
		debug "GITHUB_EVENT_NAME is push and branch ${GITHUB_REF#refs/heads/} does not seem to be a release branch, considering all projects changed."
	fi
else
	die "Unsupported GITHUB_EVENT_NAME \"$GITHUB_EVENT_NAME\""
fi

if [[ -n "$EXTRA" ]]; then
	ARGS+=( --extra="$EXTRA" )
	if [[ "$EXTRA" == "build" ]]; then
		ARGS+=( --ignore-root )
	fi
fi

{
	if ! $DEPENDENTS && ! $DEPENDENCIES; then
		pnpm jetpack dependencies list "${ARGS[@]}"
	fi
	if $DEPENDENTS; then
		pnpm jetpack dependencies list --add-dependents "${ARGS[@]}"
	fi
	if $DEPENDENCIES; then
		pnpm jetpack dependencies list --add-dependencies "${ARGS[@]}"
	fi
} | jq -ncR 'reduce inputs as $i ({}; .[$i] |= true)'

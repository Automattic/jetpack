#!/bin/bash

set -eo pipefail

BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
source "$BASE/funcs.sh"

GITHUB_API_URL="${GITHUB_API_URL:-https://api.github.com}"
GITHUB_SERVER_URL="${GITHUB_SERVER_URL:-https://github.com}"
[[ -n "$API_TOKEN" ]] || die "API_TOKEN must be set"
[[ -n "$GITHUB_REPOSITORY" ]] || die "GITHUB_REPOSITORY must be set"
[[ -n "$BRANCH" ]] || die "BRANCH must be set"
CONTEXT="${CONTEXT:-PR is up to date}"
DESCRIPTION_FAIL="${DESCRIPTION_FAIL:-This PR needs a $BRANCH merge or rebase.}"
DESCRIPTION_OK="${DESCRIPTION_OK:-}"

DATA_FAIL="$(jq --arg url "$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID" --arg context "$CONTEXT" --arg desc "$DESCRIPTION_FAIL" -n '{ "state": "failure", "target_url": $url, "context": $context, "description": $desc }')"
DATA_OK="$(jq --arg url "$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID" --arg context "$CONTEXT" --arg desc "$DESCRIPTION_OK" -n '{ "state": "success", "target_url": $url, "context": $context, "description": $desc }')"

case "$GITHUB_EVENT_NAME" in
	pull_request|pull_request_target)
		if [[ -n "$TAGS" ]]; then
			IFS=$' \t\r\n' read -d '' -ra TAGS <<<"$TAGS" || true
		elif [[ -n "$TAG" ]]; then
			# Back compat.
			echo "Deprecation: TAGS should be set instead of TAG on $GITHUB_EVENT_NAME"
			TAGS=( "$TAG" )
		else
			die "TAGS (or TAG) must be set on $GITHUB_EVENT_NAME"
		fi

		PR="$(jq -r '.pull_request.number' "$GITHUB_EVENT_PATH")"
		if [[ -z "$PR" ]]; then
			echo "::error::Could not determine PR number from event data"
			cat "$GITHUB_EVENT_PATH"
			exit 1
		fi
		;;
	push)
		[[ -n "$TAG" ]] || die "TAG must be set on $GITHUB_EVENT_NAME"
		if [[ "$GITHUB_REF" != "refs/tags/$TAG" ]]; then
			die "Push event for incorrect tag, $GITHUB_REF != refs/tags/$TAG"
		fi
		TAGS=( "$TAG" )

		if [[ -n "$PATHS" ]]; then
			mapfile -t PATHS <<<"$PATHS"
		else
			PATHS=()
		fi
		;;
	*)
		die "Unsupported event $GITHUB_EVENT_NAME"
		;;
esac

TMPDIR="${TMPDIR:-/tmp}"
DIR="$(mktemp -d "${TMPDIR%/}/pr-is-up-to-date.XXXXXXXX")"
trap 'rm -rf $DIR' EXIT
cd "$DIR"

init_repo

NOTIFY_SUCCESS=false
case "$GITHUB_EVENT_NAME" in
	pull_request|pull_request_target)
		NOTIFY_SUCCESS=true
		echo "::group::Fetching PR $PR"
		fetch_prs "$PR"
		echo "::endgroup::"
		process_pr "$PR"
		;;
	push)
		declare -i PAGE=1
		while :; do
			echo "::group::Fetching PRs (page $PAGE)"
			JSON=$(curl --fail --get --header "authorization: Bearer $API_TOKEN" --data-urlencode "base=${BRANCH}" "${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/pulls?state=open&per_page=100&page=${PAGE}")

			PRS=()
			mapfile -t PRS < <( jq -r '.[].number' <<<"$JSON" )
			[[ ${#PRS[@]} != 0 ]] || break
			fetch_prs "${PRS[@]}"

			echo "::endgroup::"

			for PR in "${PRS[@]}"; do
				if should_process_pr "$PR"; then
					process_pr "$PR"
				else
					printf "\e[1;34mPR #%d does not touch the specified paths\e[0m\n" "$PR"
				fi
			done

			jq -e 'length == 100' <<<"$JSON" >/dev/null || break
			PAGE+=1
		done
		;;
	*)
		die "Unsupported event $GITHUB_EVENT_NAME"
		;;
esac

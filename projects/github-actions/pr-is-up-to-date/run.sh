#!/bin/bash

set -eo pipefail

function git {
	printf "\e[32m%s\e[0m\n" "/usr/bin/git $*" >&2
	/usr/bin/git "$@"
}

function die {
	echo "::error::$*"
	exit 1
}

GITHUB_API_URL="${GITHUB_API_URL:-https://api.github.com}"
GITHUB_SERVER_URL="${GITHUB_SERVER_URL:-https://github.com}"
[[ -n "$API_TOKEN" ]] || die "API_TOKEN must be set"
[[ -n "$GITHUB_REPOSITORY" ]] || die "GITHUB_REPOSITORY must be set"
[[ -n "$TAG" ]] || die "TAG must be set"
[[ -n "$BRANCH" ]] || die "BRANCH must be set"
CONTEXT="${CONTEXT:-PR is up to date with $TAG}"
DESCRIPTION_FAIL="${DESCRIPTION_FAIL:-This PR needs a $BRANCH merge or rebase.}"
DESCRIPTION_OK="${DESCRIPTION_OK:-}"

DATA_FAIL="$(jq --arg url "$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID" --arg context "$CONTEXT" --arg desc "$DESCRIPTION_FAIL" -n '{ "state": "failure", "target_url": $url, "context": $context, "description": $desc }')"
DATA_OK="$(jq --arg url "$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID" --arg context "$CONTEXT" --arg desc "$DESCRIPTION_OK" -n '{ "state": "success", "target_url": $url, "context": $context, "description": $desc }')"

case "$GITHUB_EVENT_NAME" in
	pull_request)
		if [[ "$GITHUB_REF" =~ ^refs/pull/[0-9]+/merge ]]; then
			PR="${GITHUB_REF#refs/pull/}"
			PR="${PR%/merge}"
		else
			die "Could not determine PR number from GITHUB_REF $GITHUB_REF"
		fi
		;;
	pull_request_target)
		PR="$(jq -r '.pull_request.number' "$GITHUB_EVENT_PATH")"
		if [[ -z "$PR" ]]; then
			echo "::error::Could not determine PR number from event data"
			cat $GITHUB_EVENT_PATH
			exit 1
		fi
		;;
	push)
		if [[ "$GITHUB_REF" != "refs/tags/$TAG" ]]; then
			die "Push event for incorrect tag, $GITHUB_REF != refs/tags/$TAG"
		fi
		;;
	*)
		die "Unsupported event $GITHUB_EVENT_NAME"
		;;
esac

TMPDIR="${TMPDIR:-/tmp}"
DIR=$(mktemp -d "${TMPDIR%/}/check-prs-are-up-to-date.XXXXXXXX")
trap "rm -rf $DIR" EXIT
cd $DIR

echo "::group::Initializing repo"
git init -q .
git remote add origin "https://github.com/${GITHUB_REPOSITORY}.git"
git fetch --depth=1 origin "$TAG"
TAG_COMMIT="$(git rev-parse FETCH_HEAD)"
git repack -d  # Work around a git bug
echo "::endgroup::"
echo "Tag $TAG points to $TAG_COMMIT"

echo "::group::Sanity check"
git fetch --depth=1 origin "$BRANCH"
git repack -d  # Work around a git bug
if ! git merge-base --is-ancestor "$TAG_COMMIT" "origin/$BRANCH"; then
	git fetch --shallow-exclude="$TAG" origin "$BRANCH"
	git repack -d  # Work around a git bug
	git fetch --deepen=1 origin "$BRANCH"
	if ! git merge-base --is-ancestor "$TAG_COMMIT" "origin/$BRANCH"; then
		echo "::endgroup::"
		die "Tag $TAG is not an ancestor of $BRANCH! Aborting."
	fi
fi
echo "::endgroup::"

function do_fetch {
	local PR REFS=()
	for PR in "$@"; do
		REFS+=( "+refs/pull/$PR/head:refs/remotes/pulls/$PR" )
	done

	git fetch --shallow-exclude="$TAG" origin "${REFS[@]}"
	git repack -d  # Work around a git bug
	git fetch --deepen=1 origin "${REFS[@]}"
}

function process_prs {
	local PR COMMIT
	for PR in "$@"; do
		COMMIT="$(git rev-parse "pulls/$PR")"
		if git merge-base --is-ancestor "$TAG_COMMIT" "$COMMIT"; then
			printf "\e[1;32mPR $PR is up to date\e[0m\n"
			if $NOTIFY_SUCCESS && [[ -n "$CI" ]]; then
				echo "::group::Setting successful status check"
				curl -v \
					--url "${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/statuses/${COMMIT}" \
					--header "authorization: Bearer $API_TOKEN" \
					--header 'content-type: application/json' \
					--data "$DATA_OK"
				echo "::endgroup::"
			fi
		else
			printf "\e[1;31mPR $PR is outdated\e[0m\n"
			if [[ -n "$CI" ]]; then
				echo "::group::Setting failed status check"
				curl -v \
					--url "${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/statuses/${COMMIT}" \
					--header "authorization: Bearer $API_TOKEN" \
					--header 'content-type: application/json' \
					--data "$DATA_FAIL"
				echo "::endgroup::"
			fi
		fi
	done
}

NOTIFY_SUCCESS=false
case "$GITHUB_EVENT_NAME" in
	pull_request|pull_request_target)
		NOTIFY_SUCCESS=true
		echo "::group::Fetching PR $PR"
		do_fetch "$PR"
		echo "::endgroup::"
		process_prs "$PR"
		;;
	push)
		declare -i PAGE=1
		while :; do
			echo "::group::Fetching PRs (page $PAGE)"
			JSON=$(curl --fail --get --header "authorization: Bearer $API_TOKEN" --data-urlencode "base=${BRANCH}" "${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/pulls?state=open&per_page=100&page=${PAGE}")

			PRS=()
			mapfile -t PRS < <( jq -r '.[].number' <<<"$JSON" )
			[[ ${#PRS[@]} != 0 ]] || break
			do_fetch "${PRS[@]}"

			echo "::endgroup::"

			process_prs "${PRS[@]}"

			jq -e 'length == 100' <<<"$JSON" >/dev/null || break
			PAGE+=1
		done
		;;
	*)
		die "Unsupported event $GITHUB_EVENT_NAME"
		;;
esac

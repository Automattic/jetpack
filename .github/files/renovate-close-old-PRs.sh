#!/bin/bash

set -eo pipefail

function die {
	echo "::error::$*"
	exit 1
}

[[ -n "$API_TOKEN_GITHUB" ]] || die "API_TOKEN_GITHUB must be set"
[[ -n "$GITHUB_API_URL" ]] || die "GITHUB_API_URL must be set"
[[ -n "$GITHUB_REPOSITORY" ]] || die "GITHUB_REPOSITORY must be set"

echo "::group::Check that the renovate bug is still open..."
JSON=$(curl -v --fail --url 'https://api.github.com/repos/renovatebot/renovate/issues/4803') || { echo "$JSON"; exit 1; }
jq -e '.state == "open"' <<<"$JSON" >/dev/null || die "Renovate issue #​4803 <https://git.io/JYt4a> is not open. Aborting."
echo "::endgroup::"

echo "::group::Fetching 1000th PR..."
JSON=$(curl -v --fail \
	--header "authorization: Bearer $API_TOKEN_GITHUB" \
	--url "${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/pulls?per_page=100&state=all&page=10" \
) || { echo "$JSON"; exit 1; }
echo "::endgroup::"
if jq -e 'length < 100' <<<"$JSON" >/dev/null; then
	echo "Fewer than 1000 PRs. Nothing to do."
	exit 0
fi
MIN_PR=$(jq -r '.[99].number' <<<"$JSON")
echo "The 1000th PR is #$MIN_PR"

declare -i PAGE=1
while :; do
	echo "::group::Fetching open PRs (page $PAGE)"
	JSON=$(curl -v --fail \
		--header "authorization: Bearer $API_TOKEN_GITHUB" \
		--url "${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/pulls?state=open&base=trunk&per_page=100&page=${PAGE}&direction=asc" \
	) || { echo "$JSON"; exit 1; }
	echo "::endgroup::"

	for PR in $(jq '.[] | select( ( .head.ref | startswith( "renovate/" ) ) and ( .user.login == "renovate[bot]" or .user.login == "matticbot" ) ) | .number' <<<"$JSON"); do
		if [[ $PR -ge $MIN_PR ]]; then
			echo "PR #$PR is ok"
			continue
		fi
		echo "PR #$PR is too old! Closing."
		echo "::group::Posting comment..."
		curl -v --fail \
			--header "authorization: Bearer $API_TOKEN_GITHUB" \
			--header 'content-type: application/json' \
			--url "${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/issues/$PR/comments" \
			--data '{"body":"This renovate PR is too old: renovate loses track of its own PRs when they'\''re beyond the latest 1000 in the repo. See [renovate issue #4803](https://git.io/JYt4a).\n\nClosing the PR so renovate can re-create it."}'
		echo "::endgroup::"
		echo "::group::Closing..."
		curl -v --fail \
			--request PATCH \
			--header "authorization: Bearer $API_TOKEN_GITHUB" \
			--header 'content-type: application/json' \
			--url "${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/pulls/$PR" \
			--data '{"state":"closed"}'
		echo "::endgroup::"
	done

	jq -e 'length == 100' <<<"$JSON" >/dev/null || break
	PAGE+=1
done


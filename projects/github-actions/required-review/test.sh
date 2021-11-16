#!/usr/bin/env bash

# This is a script to help with manually testing the action.
# Set INPUT_TOKEN to a GitHub API token in the calling environment.
# Pass a PR number as $1.

set -eo pipefail

BASE="$(cd "$(dirname "$BASH_SOURCE[0]")/../../.." && pwd)"

cd "$BASE/projects/github-actions/required-review"
composer build-development

ENV=()
function addenv {
	ENV+=( "$1=$2" )
}

eval "$(
	# Read defaults from action.yml
	node -e 'console.log( JSON.stringify( require( "js-yaml" ).load( require( "fs" ).readFileSync( process.argv[1] ) ) ) );' "$BASE/projects/github-actions/required-review/action.yml" |
		jq -r '.inputs | to_entries | .[] | select( .key != "token" and .value.default ) | [ "addenv INPUT_", ( .key | ascii_upcase | sub( " "; "_" ) ), " ", @sh "\(.value.default)" ] | join( "" )';

	# Read values from .github/workflows/required-review.yml
	node -e 'console.log( JSON.stringify( require( "js-yaml" ).load( require( "fs" ).readFileSync( process.argv[1] ) ) ) );' "$BASE/.github/workflows/required-review.yml" |
		jq -r '.jobs.check_required_reviews.steps[] | select( .uses // "" | contains( "required-review" ) ) | .with | to_entries | .[] | [ "addenv INPUT_", ( .key | ascii_upcase | sub( " "; "_" ) ), " ", @sh "\(.value)" ] | join( "" )'
)"

# Check that we have a token.
if [[ -z "$INPUT_TOKEN" ]]; then
	echo "Please set INPUT_TOKEN in the environment." >&2
	exit 1
fi
addenv INPUT_TOKEN "$INPUT_TOKEN"

TEMP=$(mktemp)
trap 'rm "$TEMP"' EXIT
PR="${1:-18546}"
jq --argjson pr "$(curl -sSL "https://api.github.com/repos/Automattic/jetpack/pulls/$PR")" --argjson repo "$(curl -sSL "https://api.github.com/repos/Automattic/jetpack")" -n '{ pull_request: $pr, repository: $repo }' > "$TEMP"

addenv GITHUB_EVENT_PATH "$TEMP"
addenv GITHUB_EVENT_NAME pull_request_review
addenv GITHUB_SHA "$(jq '.pull_request.head.sha' "$TEMP")"
addenv GITHUB_REF "refs/pull/$(jq '.number' "$TEMP")/merge"
addenv GITHUB_WORKFLOW required-review
addenv GITHUB_ACTION required-review
addenv GITHUB_ACTOR matticbot
addenv GITHUB_JOB required-review
addenv GITHUB_RUN_NUMBER 1
addenv GITHUB_RUN_ID 1234567

cd "$BASE"
echo '----'
env -i -- "${ENV[@]}"
echo '----'
env -i -- "${ENV[@]}" node projects/github-actions/required-review/dist/index.js

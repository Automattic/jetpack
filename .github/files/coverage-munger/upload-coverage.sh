#!/bin/bash

## Environment used by this script:
#
# Required:
# - API_TOKEN_GITHUB: GitHub API token.
# - GITHUB_API_URL: GitHub API URL.
# - GITHUB_TOKEN: GitHub API token.
# - GITHUB_REPOSITORY: GitHub repo.
# - GITHUB_SHA: Commit SHA.
# - PR_HEAD: SHA for the PR head commit (versus GITHUB_SHA which is a merge commit)
# - PR_ID: PR number or "trunk".
# - SECRET: Shared secret.
# - STATUS: Status of the coverage run.

set -eo pipefail

if [[ ! -f coverage/summary.tsv ]]; then
	echo 'No coverage was generated.'
	exit 0
fi

mkdir coverage-data
cp coverage/summary.tsv coverage-data/summary.tsv
gzip -9 coverage-data/summary.tsv

if [[ -f coverage/js-combined.json ]]; then
	echo '::group::Pnpm install'
	pnpm install
	echo '::endgroup::'

	echo '::group::Generating JS coverage report'
	.github/files/coverage-munger/node_modules/.bin/nyc report --no-exclude-after-remap --report-dir=coverage-data/js --temp-dir=coverage/ --reporter=html-spa
	echo '::endgroup::'
fi

if [[ -f coverage/php-combined.cov ]]; then
	echo '::group::Composer install'
	composer --working-dir=.github/files/coverage-munger/ update
	echo '::endgroup::'

	echo '::group::Generating PHP coverage report'
	.github/files/coverage-munger/vendor/bin/phpcov merge --html coverage-data/php coverage/
	echo '::endgroup::'
fi

echo '::group::Creating zip file'
zip -Xr9 coverage-data.zip coverage-data/
echo '::endgroup::'

echo '::group::Uploading zip file'
# Because we don't know how big the zip is going to wind up being and have to upload via HTTP,
# we created a simple chunked-upload protocol. This sends one command.
#
# $1 - Query parameters.
# $2 - Chunk filename, if any.
# $SECRET - Shared secret.
#
# Output:
# JSON - JSON response. Also printed.
function do_req {
	local args=(
		--header "Shared-Secret: $SECRET"
		--url "https://jetpackcodecoverage.atomicsites.blog/upload-coverage-data.php?$1"
	)
	if [[ -n "$2" ]]; then
		args+=( --form "chunk=@$2" )
	fi

	echo "=> $1"
	if JSON=$( curl "${args[@]}" ) && jq -e '.ok == true' <<<"$JSON" &>/dev/null; then
		jq . <<<"$JSON"
		return 0
	fi
	echo "::error::Upload failed: ${JSON/$'\n'/%0A}"
	return 1
}

SZ=$( stat -c %s coverage-data.zip )
SHA=$( sha256sum coverage-data.zip )
ID=$( jq --arg V "$PR_ID" -nr '$V | @uri' )
COMMIT=$( jq --arg V "$GITHUB_SHA" -nr '$V | @uri' )
do_req "op=begin&id=$ID&commit=$COMMIT&len=$SZ&sha=${SHA%% *}"
TOKEN=$( jq -r '.token | @uri' <<<"$JSON" )
CSZ=$( jq -r .chunkSize <<<"$JSON" )

# Abort upload on exit
function onexit {
	if [[ -n "$TOKEN" ]]; then
		do_req "op=abort&token=$TOKEN" || true
		TOKEN=
	fi
}
trap onexit exit

for (( O=0; O < SZ; O+=CSZ )); do
	dd if=coverage-data.zip of=chunk bs=32K skip=${O}B count=${CSZ}B
	do_req "op=chunk&token=$TOKEN" chunk
done

do_req "op=finish&token=$TOKEN"
TOKEN=
echo '::endgroup::'

if [[ "$PR_ID" != "trunk" ]]; then
	echo "::group::Setting GitHub status"
	if jq -e '.covinfo' <<<"$JSON" &>/dev/null; then
		JSON=$( jq '.covinfo' <<<"$JSON" )
		if [[ "$STATUS" != 'success' ]]; then
			JSON=$( jq '.state |= "pending" | .description |= "Waiting for tests to pass" | .msg |= "Cannot generate coverage summary while tests are failing. :zipper_mouth_face:\n\nPlease fix the tests, or re-run the Code coverage job if it was something being flaky."' <<<"$JSON" )
		fi
	else
		JSON='{"state":"error","description":"No covinfo received from server","msg":"","footer":""}'
	fi
	jq . <<<"$JSON"
	curl -v -L --fail \
		--url "${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/statuses/$( jq --arg V "$PR_HEAD" -nr '$V | @uri' )" \
		--header "authorization: Bearer $API_TOKEN_GITHUB" \
		--header 'content-type: application/json' \
		--data "$( jq -c --arg PR "$PR_ID" '{
			context: "Code coverage requirement",
			state: .state,
			target_url: "https://jetpackcodecoverage.atomicsites.blog/prs/\( $PR | @uri )/",
			description: .description,
		}' <<<"$JSON" )"
	echo "::endgroup::"

	# Find the last comment starting with "### Code Coverage Summary"
	echo "::group::Looking for existing comment"
	PAGE=1
	while true; do
		J=$( curl -v -L fail \
			--url "${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/issues/${ID}/comments?per_page=100&page=$PAGE" \
			--header "authorization: Bearer $API_TOKEN_GITHUB"
		)
		CID=$( jq -r --arg CID "$CID" '[ { id: $CID }, ( .[] | select( .user.login == "github-actions[bot]" ) | select( .body | test( "^### Code Coverage Summary" ) ) ) ] | last | .id' <<<"$J" )
		if jq -e 'length < 100' <<<"$J" &>/dev/null; then
			break
		fi
		PAGE=$(( PAGE + 1 ))
	done
	echo "::endgroup::"
	if [[ -n "$CID" ]]; then
		echo "Existing comment ID=$CID"
	else
		echo "No existing comment found"
	fi

	if jq -e '.msg != ""' <<<"$JSON" &>/dev/null; then
		if [[ -n "$CID" ]]; then
			echo "::group::Updating comment"
			curl -v -L --fail \
				-X PATCH \
				--url "${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/issues/comments/${CID}" \
				--header "authorization: Bearer $API_TOKEN_GITHUB" \
				--header 'content-type: application/json' \
				--data "$( jq -c '{
					body: "### Code Coverage Summary\n\n\( .msg )\n\n\( .footer )",
				}' <<<"$JSON" )"
			echo "::endgroup::"
		else
			echo "::group::Creating comment"
			curl -v -L --fail \
				-X POST \
				--url "${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/issues/${ID}/comments" \
				--header "authorization: Bearer $API_TOKEN_GITHUB" \
				--header 'content-type: application/json' \
				--data "$( jq -c '{
					body: "### Code Coverage Summary\n\n\( .msg )\n\n\( .footer )",
				}' <<<"$JSON" )"
			echo "::endgroup::"
		fi
	elif [[ -n "$CID" ]]; then
		# No message, delete existing comment.
		echo "::group::Deleting comment"
		curl -v -L --fail \
			-X DELETE \
			--url "${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/issues/comments/${CID}" \
			--header "authorization: Bearer $API_TOKEN_GITHUB"
		echo "::endgroup::"
	fi
fi

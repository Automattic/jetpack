#!/bin/bash

## Environment used by this script:
#
# Required:
# - API_TOKEN_GITHUB: GitHub API token.
# - GITHUB_API_URL: GitHub API URL.
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
	STATUS=$STATUS COVINFO=$JSON .github/files/coverage-munger/post-message.sh
fi

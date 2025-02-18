#!/bin/bash

## Environment used by this script:
#
# Required:
# - GITHUB_API_URL: GitHub API URL.
# - GITHUB_REPOSITORY: GitHub repo.
# - POST_MESSAGE_TOKEN: GitHub API token.
# - PR_HEAD: SHA for the PR head commit (versus GITHUB_SHA which is a merge commit)
# - PR_ID: PR number or "trunk".
#
# Optional:
# - COVINFO: Response from jetpackcodecoverage.atomicsites.blog
# - STATUS: Status of the coverage run.

set -eo pipefail

SKIPLABEL="I don't care about code coverage for this PR"

ID=$( jq --arg V "$PR_ID" -nr '$V | @uri' )
COMMIT=$( jq --arg V "$PR_HEAD" -nr '$V | @uri' )

# Fetch covinfo from server, if necessary.
if [[ -z "$COVINFO" ]]; then
	echo '::group::Fetching coverage info from server'
	RES=$( curl -v \
		--write-out '\nCode: %{response_code}' \
		--url "https://jetpackcodecoverage.atomicsites.blog/get-pr-info.php?id=${ID}&commit=${COMMIT}"
	)
	STS=${RES##*$'\n'Code: }
	if [[ "$STS" != 200 ]]; then
		echo '::endgroup::'
		echo "$RES"
		[[ "$STS" == 404 || "$STS" == 409 ]]
		exit $?
	fi
	COVINFO=${RES%$'\n'Code: *}
	jq . <<<"$COVINFO"
	echo '::endgroup::'
else
	echo '::group::Coverage info'
	jq . <<<"$COVINFO"
	echo '::endgroup::'
fi

# Find coverage run status, if necessary
if [[ -z "$STATUS" ]]; then
	echo "::group::Looking for latest coverage run"
	PAGE=1
	R=null
	while true; do
		J=$( curl -v -L fail \
			--url "${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/commits/${COMMIT}/check-runs?per_page=100&page=$PAGE" \
			--header "authorization: Bearer $POST_MESSAGE_TOKEN"
		)
		R=$( jq --argjson R "$R" '[ ( $R, .check_runs[] ) | select( .name == "Code coverage" ) ] | sort_by( .completed_at // "running" ) | last' <<<"$J" )
		if jq -e '.check_runs | length < 100' <<<"$J" &>/dev/null; then
			break
		fi
		PAGE=$(( PAGE + 1 ))
	done
	jq . <<<"$R"
	echo "::endgroup::"
	STATUS=$( jq -r '.conclusion // .status // null' <<<"$R" )
fi
echo "Last run status is $STATUS"

echo '::group::Checking labels for PR'
LABELS=$( curl -v -L --fail \
	--url "${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/issues/${ID}/labels?per_page=100" \
	--header "authorization: Bearer $POST_MESSAGE_TOKEN"
)
jq . <<<"$LABELS"
echo "::endgroup::"

echo "::group::Setting GitHub status"
if jq -e '.covinfo' <<<"$COVINFO" &>/dev/null; then
	COVINFO=$( jq '.covinfo' <<<"$COVINFO" )
	if [[ "$STATUS" != 'success' ]]; then
		COVINFO=$( jq '.state |= "pending" | .description |= "Waiting for tests to pass" | .msg |= "Cannot generate coverage summary while tests are failing. :zipper_mouth_face:\n\nPlease fix the tests, or re-run the Code coverage job if it was something being flaky."' <<<"$COVINFO" )
	fi
else
	COVINFO='{"state":"error","description":"No covinfo received from server","msg":"","footer":""}'
fi
# If we're here from a label or unlabel event, and the CI check is still running, then no message.
if [[ "$STATUS" == 'in_progress' ]]; then
	COVINFO=$( jq '.state |= "pending" | .description |= "Waiting for tests to pass" | .msg |= ""' <<<"$COVINFO" )
fi
# If the "I don't care" label is set, override the status.
if jq -e --arg LABEL "$SKIPLABEL" '.[] | select( .name == $LABEL )' <<<"$LABELS" &>/dev/null; then
	COVINFO=$( jq --arg REPO "$GITHUB_REPOSITORY" --arg LABEL "$SKIPLABEL" '.state |= "success" | .description |= "Overridden by label" | .footer += "\n\n<sub>Coverage check overridden by https://github.com/\( $REPO | @uri | gsub("%2F"; "/") )/labels/\( $LABEL | @uri ).</sub>"' <<<"$COVINFO" )
fi
# If the check will be error or failing, add a note to the footer about the "I don't care" label.
if jq -e '.state == "error" or .state == "failure"' <<<"$COVINFO" &>/dev/null; then
	COVINFO=$( jq --arg REPO "$GITHUB_REPOSITORY" --arg LABEL "$SKIPLABEL" '.footer += "\n\n<sub>Add label https://github.com/\( $REPO | @uri | gsub("%2F"; "/") )/labels/\( $LABEL | @uri ) to override the failing coverage check.</sub>"' <<<"$COVINFO" )
fi
jq . <<<"$COVINFO"
curl -v -L --fail \
	--url "${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/statuses/$( jq --arg V "$PR_HEAD" -nr '$V | @uri' )" \
	--header "authorization: Bearer $POST_MESSAGE_TOKEN" \
	--header 'content-type: application/json' \
	--data "$( jq -c --arg PR "$PR_ID" '{
		context: "Code coverage requirement",
		state: .state,
		target_url: "https://jetpackcodecoverage.atomicsites.blog/prs/\( $PR | @uri )/",
		description: .description,
	}' <<<"$COVINFO" )"
echo "::endgroup::"

# Find the last comment starting with "### Code Coverage Summary"
echo "::group::Looking for existing comment"
PAGE=1
while true; do
	J=$( curl -v -L fail \
		--url "${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/issues/${ID}/comments?per_page=100&page=$PAGE" \
		--header "authorization: Bearer $POST_MESSAGE_TOKEN"
	)
	CID=$( jq -r --arg CID "$CID" '[ { id: $CID }, ( .[] | select( .user.login == "jp-launch-control[bot]" ) | select( .body | test( "^### Code Coverage Summary" ) ) ) ] | last | .id' <<<"$J" )
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

if jq -e '.msg != ""' <<<"$COVINFO" &>/dev/null; then
	if [[ -n "$CID" ]]; then
		echo "::group::Updating comment"
		curl -v -L --fail \
			-X PATCH \
			--url "${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/issues/comments/${CID}" \
			--header "authorization: Bearer $POST_MESSAGE_TOKEN" \
			--header 'content-type: application/json' \
			--data "$( jq -c '{
				body: "### Code Coverage Summary\n\n\( .msg )\n\n\( .footer )",
			}' <<<"$COVINFO" )"
		echo "::endgroup::"
	else
		echo "::group::Creating comment"
		curl -v -L --fail \
			-X POST \
			--url "${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/issues/${ID}/comments" \
			--header "authorization: Bearer $POST_MESSAGE_TOKEN" \
			--header 'content-type: application/json' \
			--data "$( jq -c '{
				body: "### Code Coverage Summary\n\n\( .msg )\n\n\( .footer )",
			}' <<<"$COVINFO" )"
		echo "::endgroup::"
	fi
elif [[ -n "$CID" ]]; then
	# No message, delete existing comment.
	echo "::group::Deleting comment"
	curl -v -L --fail \
		-X DELETE \
		--url "${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/issues/comments/${CID}" \
		--header "authorization: Bearer $POST_MESSAGE_TOKEN"
	echo "::endgroup::"
fi

#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"
. "$BASE/tools/includes/proceed_p.sh"

# Print help and exit.
function usage {
	cat <<-EOH
		usage: $0 [-q] [repo]

		Check that all mirror repos are configured correctly.

		If passed an argument, checks only that repo.
	EOH
	exit 1
}

EXIT=0

function info {
	echo "$*"
}

function ok {
	echo "  ✅ $*"
}

function err {
	EXIT=1
	S=
	if [[ -n "$QUIET" ]]; then
		S=" in $repo"
	fi
	echo "  ❌ $*$S"
	if [[ -n "$CI" ]]; then
		echo "::error${CIERRORLINE}::$* in $repo"
	fi
}

function check {
	if jq -e --argjson V "$2" "$1 == \$V" <<<"$JSON" &>/dev/null; then
		ok "$3"
	else
		err "${4:-$3}"
	fi
}

# Sets options.
QUIET=
while getopts ":qh" opt; do
	case ${opt} in
		q)
			QUIET=true
			function info { :; }
			function ok { :; }
			;;
		h)
			usage
			;;
		:)
			die "Argument -$OPTARG requires a value."
			;;
		?)
			error "Invalid argument: -$OPTARG"
			echo ""
			usage
			;;
	esac
done
shift "$((OPTIND - 1))"

# Make sure we're signed into the GitHub CLI.
if ! gh auth status --hostname github.com &> /dev/null; then
	yellow "You are not signed into the GitHub CLI."
	proceed_p "Sign in to the GitHub CLI?" "" Y
	gh auth login || die 'Failed to log in!'
fi

DESC_RE1='^\[READ ONLY\] '
DESC_RE2=' This repository is a mirror([,;] f|\. F)or issue tracking and development,? (go|head) (to:?|here:) https://github\.com/[Aa]utomattic/[Jj]etpack/?\.?[[:space:]]*$'

if [[ -n "$1" ]]; then
	REPOS="$1"
else
	REPOS=$( jq -r '.extra["mirror-repo"] // empty' projects/*/*/composer.json | sort -u )
fi

# Index mirror repos by the workflows they use so we can verify they have the secrets those workflows require.
AUTOTAGGER_REPOS=$( jq -r 'select( .extra.autotagger ) | .extra["mirror-repo"] // empty' projects/*/*/composer.json )
WPSVN_REPOS=$( jq -r 'select( .extra["wp-svn-autopublish"] ) | .extra["mirror-repo"] // empty' projects/*/*/composer.json )
E2E_REPOS=$( for f in projects/*/*/composer.json; do
	[[ -d "${f%composer.json}tests/e2e" ]] && jq -r '.extra["mirror-repo"] // empty' "$f"
done )

# Maps each secret to the workflow that requires it.
WORKFLOW_SECRETS='{
	"API_TOKEN_GITHUB": "Autotagger",
	"WPSVN_USERNAME": "WordPress.org SVN autopublish",
	"WPSVN_PASSWORD": "WordPress.org SVN autopublish",
	"REPO_DISPATCH_TOKEN": "E2E tests"
}'

cd "$BASE"
for repo in $REPOS; do

	info ""
	info "$repo:"
	if ! JSON=$( gh api "/repos/$repo" ); then
		if jq -e '.status == 404 or .status == "404"' <<<"$JSON" &>/dev/null; then
			err "Repo is not found"
		elif jq -e '.message' <<<"$JSON" &>/dev/null; then
			err "Failed to fetch data: $( jq -e '.message' <<<"$JSON" )"
		else
			err "Failed to fetch data"
		fi
		continue
	fi

	D=$( jq -r '.description' <<<"$JSON" )
	if [[ "$D" =~ $DESC_RE1 ]]; then
		ok "Description begins with \`[READ ONLY]\`"
	else
		err "Description does not begin with \`[READ ONLY]\`"
		info "    $D"
	fi

	if [[ "$repo" == "Automattic/jetpack-storybook" && "$D" == *" This repository is the published storybook, for issue tracking and development head to: https://github.com/automattic/jetpack" ]]; then
		ok "Description has reference to the monorepo"
	elif [[ "$D" =~ $DESC_RE2 ]]; then
		ok "Description has reference to the monorepo"
	else
		err "Description does not have the standard reference to the monorepo: \"This repository is a mirror; for issue tracking and development head here: https://github.com/automattic/jetpack\""
		info "    $D"
	fi

	check '.archived' false 'Not archived' 'Repo is archived'
	check '.disabled' false 'Not disabled' 'Repo is disabled'
	check '.visibility' '"public"' 'Visibility is public' "Visibility is $( jq -r '.visibility' <<<"$JSON" ), should be public"
	check '.default_branch' '"trunk"' 'Default branch is trunk' "Default branch is $( jq -r '.default_branch' <<<"$JSON" ), should be trunk"
	check '.has_issues' false 'Issues disabled' 'Issues not disabled'
	check '.has_pull_requests' false 'PRs disabled' 'PRs not disabled'
	check '.has_discussions' false 'Discussions disabled' 'Discussions not disabled'
	check '.has_projects' false 'Projects disabled' 'Projects not disabled'
	check '.has_wiki' false 'Wiki disabled' 'Wiki not disabled'

	JSON=
	if JSON=$( gh api "/repos/$repo/actions/permissions/fork-pr-contributor-approval" ); then
		check '.approval_policy' '"all_external_contributors"' 'Actions approval policy set to "All external contributors"' "Actions approval policy set to $( jq -r '.approval_policy' <<<"$JSON" ), should be \"All external contributors\""
	elif jq -e '.message' <<<"$JSON" &>/dev/null; then
		err "Failed to fetch fork-pr-contributor-approval setting: $( jq -e '.message' <<<"$JSON" )"
	else
		err "Failed to fetch fork-pr-contributor-approval setting"
	fi

	JSON=
	if JSON=$( gh api "/repos/$repo/actions/permissions/workflow" ); then
		check '.default_workflow_permissions' '"read"' 'Actions workflow permissions set to "read"' "Actions workflow permissions set to \"$( jq -r '.default_workflow_permissions' <<<"$JSON" )\", should be \"read\""
	elif jq -e '.message' <<<"$JSON" &>/dev/null; then
		err "Failed to fetch workflow permissions setting: $( jq -e '.message' <<<"$JSON" )"
	else
		err "Failed to fetch workflow permissions setting"
	fi

	# Mirror repos using these workflows need their corresponding secrets set.
	SECRETS_NEEDED=()
	if grep -qxF "$repo" <<<"$AUTOTAGGER_REPOS"; then
		SECRETS_NEEDED+=( API_TOKEN_GITHUB )
	fi
	if grep -qxF "$repo" <<<"$WPSVN_REPOS"; then
		SECRETS_NEEDED+=( WPSVN_USERNAME WPSVN_PASSWORD )
	fi
	if grep -qxF "$repo" <<<"$E2E_REPOS"; then
		SECRETS_NEEDED+=( REPO_DISPATCH_TOKEN )
	fi

	# Fetch the repo's secrets once, then verify each required one is present.
	if [[ ${#SECRETS_NEEDED[@]} -gt 0 ]]; then
		if SECRETS=$( gh api "/repos/$repo/actions/secrets" --jq '.secrets[].name' 2>/dev/null ); then
			for secret in "${SECRETS_NEEDED[@]}"; do
				workflow=$( jq -r --arg s "$secret" '.[$s]' <<<"$WORKFLOW_SECRETS" )
				if grep -qxF "$secret" <<<"$SECRETS"; then
					ok "Secret $secret is set (required by $workflow workflow)"
				else
					err "Secret $secret is not set, but is required by the $workflow workflow (see PCYsg-xsv-p2#mirror-repo-secrets)"
				fi
			done
		else
			err "Failed to fetch secrets"
		fi
	fi
done

if [[ -z "$QUIET" ]]; then
	echo ""
	if [[ "$EXIT" -eq 0 ]]; then
		echo 'All ok!'
	else
		echo 'Errors detected!'
	fi
fi
exit $EXIT

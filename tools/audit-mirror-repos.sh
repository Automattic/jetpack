#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"
. "$BASE/tools/includes/proceed_p.sh"

# Print help and exit.
function usage {
	cat <<-EOH
		usage: $0 [-q]

		Check that all mirror repos are configured correctly.
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
		echo "::error::$* in $repo"
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
DESC_RE2=' This repository is a mirror([,;] f|\. F)or issue tracking and development,? (go|head) (to:?|here:) https://github\.com/[Aa]utomattic/[Jj]etpack/?\.?$'

cd "$BASE"
for repo in $( jq -r '.extra["mirror-repo"] // empty' projects/*/*/composer.json | sort -u ); do
	[[ "$repo" == "Automattic/wp-super-cache" ]] && continue # pbFulr-1bL-p2#comment-543

	info ""
	info "$repo:"
	JSON=$( gh api "/repos/$repo" || die "Failed to fetch data for $repo" )

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
		err "Description does not have the standard reference to the monorepo"
		info "    $D"
	fi

	check '.visibility' '"public"' "Visibility is $( jq -r '.visibility' <<<"$JSON" )"
	check '.default_branch' '"trunk"' "Default branch is $( jq -r '.default_branch' <<<"$JSON" )"
	check '.has_issues' false 'Issues disabled' 'Issues not disabled'
	check '.has_pull_requests' false 'PRs disabled' 'PRs not disabled'
	check '.has_discussions' false 'Discussions disabled' 'Discussions not disabled'
	check '.has_projects' false 'Projects disabled' 'Projects not disabled'
	check '.has_wiki' false 'Wiki disabled' 'Wiki not disabled'

	JSON=$( gh api "/repos/$repo/actions/permissions/fork-pr-contributor-approval" || die "Failed to fetch fork-pr-contributor-approval setting for $repo" )
	check '.approval_policy' 'all_external_contributors' 'Actions approval policy set to "All external contributors"' "Actions approval policy set to $( jq -r '.approval_policy' <<<"$JSON" )"

	JSON=$( gh api "/repos/$repo/actions/permissions/workflow" || die "Failed to fetch workflow permissions setting for $repo" )
	check '.default_workflow_permissions' 'all_external_contributors' "Actions workflow permissions set to \"$( jq -r '.default_workflow_permissions' <<<"$JSON" )\""
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

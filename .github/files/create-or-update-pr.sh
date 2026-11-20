#!/usr/bin/env bash

# Create or update a PR.
# If the PR exists but fails the pr-update-to check, this script force-pushes.
#
# Usage: create-or-update-pr.sh --branch <name> --title <text> --body <text> [--label <label>]... [--changelog <entry>] -- <pathspec>...

set -eo pipefail

BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
source "$BASE/tools/includes/changelogger.sh"

function die {
	echo "::error::$*"
	exit 1
}

BRANCH=
TITLE=
BODY=
CHANGELOG=
LABELS=()
while [[ $# -gt 0 ]]; do
	case "$1" in
		--branch) BRANCH="$2"; shift 2 ;;
		--title) TITLE="$2"; shift 2 ;;
		--body) BODY="$2"; shift 2 ;;
		--label) LABELS+=( --label "$2" ); shift 2 ;;
		--changelog) CHANGELOG="$2"; shift 2 ;;
		--) shift; break ;;
		*) die "Unknown argument: $1" ;;
	esac
done
[[ -n "$BRANCH" && -n "$TITLE" && -n "$BODY" && $# -gt 0 ]] || die "--branch, --title, --body, and at least one pathspec are required."

cd "$BASE"

TMP=$( git -c core.quotepath=off diff --name-only -- "$@" )
if [[ -z "$TMP" ]]; then
	echo '::notice::No changes, so not creating a PR.'
	exit 0
fi
mapfile -t FILES <<<"$TMP"

PR_ID=
if git -c protocol.version=2 fetch --no-tags --prune --no-recurse-submodules --depth=1 origin "$BRANCH" >/dev/null 2>&1; then
	HAS_BRANCH=true
	PR_ID="$(gh pr list --head "$BRANCH" --state open --json number --jq '.[0].number // empty')"
	if [[ -n "$PR_ID" ]]; then
		SHA=$( git rev-parse "origin/$BRANCH" )
		if ! git diff --quiet "$SHA" -- "${FILES[@]}"; then
			echo "::notice::PR #$PR_ID exists but branch $BRANCH needs updating."
		elif [[ "$( gh api "repos/{owner}/{repo}/commits/$SHA/status" --jq '.statuses[] | select( .context == "PR is up to date" ) | .state' )" == failure ]]; then
			echo "::notice::PR #$PR_ID exists but branch $BRANCH fails the \"PR is up to date\" check."
		else
			echo "::notice::Branch $BRANCH and PR #$PR_ID already exist and are up to date with these changes."
			exit 0
		fi
	fi
else
	HAS_BRANCH=false
fi

# Use -B instead of -b so it resets the branch to HEAD instead of failing when the branch exists.
git checkout -B "$BRANCH"
git add -- "${FILES[@]}"

# Add change files for any projects with changes.
if [[ -n "$CHANGELOG" ]]; then
	for DIR in $(printf '%s\n' "${FILES[@]}" | sed -nE 's!^(projects/[^/]+/[^/]+)/.*!\1!p' | sort -u); do
		cd "$DIR"
		changelogger_add "$CHANGELOG" ''
		CHANGES_DIR="$(jq -r '.extra.changelogger["changes-dir"] // "changelog"' composer.json)"
		git add "$CHANGES_DIR"
		cd "$BASE"
	done
fi

git commit -m "$TITLE"

if $HAS_BRANCH; then
	echo "::notice::Updating existing branch '$BRANCH'."
	git push --force-with-lease origin "$BRANCH" || die "Failed to update branch '$BRANCH'"
else
	echo "::notice::Creating branch '$BRANCH'."
	git push origin "$BRANCH" || die "Failed to create branch '$BRANCH'"
fi

if [[ -z "$PR_ID" ]]; then
	echo "::notice::Creating PR for branch '$BRANCH'."
	if ! gh pr create --base trunk --head "$BRANCH" --title "$TITLE" --body "$BODY" "${LABELS[@]}" --reviewer Automattic/jetpack-monorepo; then
		# Only clean up the branch if this run created it.
		if ! $HAS_BRANCH; then
			git push --delete origin "$BRANCH" || echo "::warning::Failed to delete branch '$BRANCH'."
		fi
		die 'Failed to create PR'
	fi
fi

#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
. "$BASE/tools/includes/chalk-lite.sh"
. "$BASE/tools/includes/proceed_p.sh"

# Print help and exit.
function usage {
	cat <<-EOH
		usage: $0 <pr-or-commit>

		Apply a PR or commit to the working tree and commit it.

		<pr-or-commit> is one of:
		  - A PR URL, https://github.com/<owner>/<repo>/pull/<n> (asks before applying if not approved).
		  - A commit URL, https://github.com/<owner>/<repo>/commit/<sha>.
		  - A commit SHA. Fetched from origin first, noting that a short SHA only finds commits on origin branches.
	EOH
	exit 1
}

if [[ $# -ne 1 || $1 == -h || $1 == --help ]]; then
	usage
fi
pr_or_commit=$1

if [[ $pr_or_commit =~ ^https://github\.com/[^/]+/[^/]+/pull/[0-9]+$ ]]; then
	# Using `reviews`, since `reviewDecision` is empty when reviews are not required, and `latestReviews` returns COMMENTED if that's the last review action.
	pr_info=$(gh pr view "$pr_or_commit" --json state,reviews)
	# Approved if, going by each reviewer's latest decision, someone approved and nobody requested changes.
	if ! jq -e '.state == "MERGED" or (
		[.reviews[] | select(.state != "COMMENTED")]
		| reverse | unique_by(.author.login)
		| any(.[]; .state == "APPROVED") and all(.[]; .state != "CHANGES_REQUESTED")
	)' <<<"$pr_info" >/dev/null; then
		proceed_p "PR not yet approved." "Apply anyway?" || exit 1
	fi
	diff=$(gh pr diff "$pr_or_commit")
elif [[ $pr_or_commit =~ ^https://github\.com/([^/]+/[^/]+)/commit/([0-9a-f]+)$ ]]; then
	diff=$(gh api "repos/${BASH_REMATCH[1]}/commits/${BASH_REMATCH[2]}" -H 'Accept: application/vnd.github.diff')
elif [[ $pr_or_commit =~ ^[0-9a-f]+$ ]]; then
	# Only a full SHA can be fetched directly.
	if [[ ${#pr_or_commit} == 40 ]]; then
		git fetch -q origin "$pr_or_commit" || true
	else
		git fetch -q origin || true
	fi
	if ! diff=$(git show --format= --binary "$pr_or_commit^{commit}" 2>/dev/null); then
		die "Commit $pr_or_commit not found."
	fi
else
	die "Unrecognized PR or commit: $pr_or_commit"
fi

if [[ -z $diff ]]; then
	die "Empty diff: $pr_or_commit"
fi
# git apply is atomic: on any conflict, nothing is applied.
if ! git apply --index <<<"$diff"; then
	die "Not applying due to merge conflict: $pr_or_commit"
fi
if ! git commit; then
	die 'Commit aborted; changes left staged.'
fi
echo "Applied $pr_or_commit"

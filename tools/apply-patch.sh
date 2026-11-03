#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
. "$BASE/tools/includes/chalk-lite.sh"
. "$BASE/tools/includes/proceed_p.sh"

# Print help and exit.
function usage {
	cat <<-EOH
		usage: $0 <pr-or-commit>

		Apply a PR or commit to the working tree, without staging or committing.

		<pr-or-commit> is one of:
		  - A PR URL, https://github.com/<owner>/<repo>/pull/<n> (asks before applying if not approved).
		  - A commit URL, https://github.com/<owner>/<repo>/commit/<sha>.
		  - A commit SHA. Fetched from origin if not local, which needs the full SHA.
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
	# If it's not merged and not approved, ask before applying.
	if ! jq -e '.state == "MERGED" or ([.reviews[] | select(.state != "COMMENTED")] | last.state == "APPROVED")' <<<"$pr_info" >/dev/null; then
		proceed_p "PR not yet approved." "Apply anyway?" || exit 1
	fi
	diff=$(gh pr diff "$pr_or_commit")
elif [[ $pr_or_commit =~ ^https://github\.com/([^/]+/[^/]+)/commit/([0-9a-f]+)$ ]]; then
	diff=$(gh api "repos/${BASH_REMATCH[1]}/commits/${BASH_REMATCH[2]}" -H 'Accept: application/vnd.github.diff')
elif [[ $pr_or_commit =~ ^[0-9a-f]+$ ]]; then
	git fetch -q origin || true
	if ! diff=$(git show --format= --binary "$pr_or_commit^{commit}" 2>/dev/null); then
		error "Commit $pr_or_commit not found."
		exit 1
	fi
else
	error "Unrecognized PR or commit: $pr_or_commit"
	exit 1
fi

if [[ -z $diff ]]; then
	error "Empty diff: $pr_or_commit"
	exit 1
fi
# git apply is atomic: on any conflict, nothing is applied.
if ! git apply <<<"$diff"; then
	error "Not applying due to merge conflict: $pr_or_commit"
	exit 1
fi
echo "Applied $pr_or_commit"

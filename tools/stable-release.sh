#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
. "$BASE/tools/includes/chalk-lite.sh"

# Print help and exit.
function usage {
	cat <<-EOH
		usage: $0 [<plugin> [<version>]]

		Release a plugin from its release branch, prompting for anything not given.
		  <plugin>   Plugin to release, e.g. jetpack.
		  <version>  Version to release, e.g. 16.4.1.
	EOH
	exit
}

if [[ $# -gt 2 || $1 == -h || $1 == --help ]]; then
	usage
fi

if [[ -n $(git status --porcelain) ]]; then
	die 'Working tree not clean; commit or stash changes first.'
fi
START_COMMIT=$(git rev-parse HEAD)

# Prompt for PRs or commits to apply, committing each.
function apply_patches {
	local pr_or_commit

	while true; do
		read -rep "PR or commit to cherry-pick, or 'done' if finished: " pr_or_commit
		[[ $pr_or_commit == "done" ]] && break
		[[ -n $pr_or_commit ]] || continue

		# Abort if a failure left changes behind (e.g. an aborted commit).
		if ! "$BASE/tools/apply-patch.sh" "$pr_or_commit" && [[ -n $(git status --porcelain) ]]; then
			exit 1
		fi
	done
}

# Output the changed projects
function detect_changed_projects {
	mapfile -t PROJECTS < <(
		git -c core.quotepath=off diff --no-renames --name-only "$START_COMMIT..HEAD" -- projects/ \
			| sed -n 's|^projects/\([^/]*/[^/]*\)/.*|\1|p' | sort -u
	)

	if [[ ${#PROJECTS[@]} -eq 0 ]]; then
		die 'No projects changed.'
	fi
	echo 'Changed projects:'
	printf '  %s\n' "${PROJECTS[@]}"
}

apply_patches
detect_changed_projects

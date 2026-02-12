#!/usr/bin/env bash

# Skip if previous ref is null, e.g. during `git worktree add`
if [[ -z "$1" || "$1" = "0000000000000000000000000000000000000000" ]]; then
	exit 0
fi

changedFiles="$(git -c core.quotepath=off diff-tree -r --name-only --no-commit-id "$1" HEAD)"
SEP=$'---\n'

runOnChange() {
	if echo "$changedFiles" | grep -q "^\($1\)"; then
		echo -e "$SEP$2"
		SEP=
	fi
}

changedSlugs=()
for f in $(git -c core.quotepath=off ls-files '**/composer.lock'); do
	if echo "$changedFiles" | grep -q "^$f$"; then
		slug="${f#projects/}"
		slug="${slug%/composer.lock}"
		changedSlugs+=("$slug")
	fi
done
if [[ ${#changedSlugs[@]} -gt 0 ]]; then
	n=${#changedSlugs[@]}
	label="project"
	if [[ $n -gt 1 ]]; then label="projects"; fi
	list=$(IFS=,; echo "${changedSlugs[*]}" | sed 's/,/, /g')
	echo -e "${SEP}composer.lock changed in $n $label: $list\n\nTo update, run:\n  jetpack install ${changedSlugs[*]}"
	SEP=
fi
runOnChange 'pnpm-lock.yaml\|composer.lock' "A monorepo root lock file has changed. Consider updating your working copy by running: jetpack install -r"

exit 0

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

for f in $(git -c core.quotepath=off ls-files '**/composer.lock'); do
	slug="${f#projects/}"
	slug="${slug%/composer.lock}"
	runOnChange "$f" "$f has changed. Consider updating your working copy by running: jetpack install $slug"
done
runOnChange 'pnpm-lock.yaml\|composer.lock' "A monorepo root lock file has changed. Consider updating your working copy by running: jetpack install -r"

exit 0

#!/bin/bash

changedFiles="$(git -c core.quotepath=off diff-tree -r --name-only --no-commit-id "$1" HEAD)"

runOnChange() {
	echo "$changedFiles" | grep -q "^\($1\)" && echo -e "$2"
}

for f in $(git -c core.quotepath=off ls-files '**/composer.lock'); do
	slug="${f#projects/}"
	slug="${slug%/composer.lock}"
	runOnChange "$f" "$f has changed. Consider updating your working copy by running: jetpack install $slug"
done
runOnChange 'pnpm-lock.yaml\|composer.lock' "A monorepo root lock file has changed. Consider updating your working copy by running: jetpack install -r"

exit 0

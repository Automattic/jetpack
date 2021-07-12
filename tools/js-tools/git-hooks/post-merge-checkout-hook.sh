#!/bin/bash

changedFiles="$(git -c core.quotepath=off diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD)"

runOnChange() {
	echo "$changedFiles" | grep -q "^$1" && echo -e "$2"
}

runOnChange 'pnpm-lock.yaml\|composer.lock' "A lock file has changed. Consider updating your working copy by running: jetpack install -r"
for f in $(git -c core.quotepath=off ls-files '**/composer.lock'); do
	slug="${f#projects/}"
	slug="${slug%/composer.lock}"
	runOnChange "$f" "$f has changed. Consider updating your working copy by running: jetpack install $slug"
done
runOnChange projects/packages/ "Files within the packages directory have changed. Consider running: jetpack install --all"

exit 0

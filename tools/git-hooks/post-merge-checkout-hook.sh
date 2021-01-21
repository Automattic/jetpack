#!/bin/bash

changedFiles="$(git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD)"

runOnChange() {
	echo "$changedFiles" | grep -q "^$1" && echo -e "$2"
}

runOnChange yarn.lock "yarn.lock has changed. Consider running yarn install to update your working copy."
for f in $(git ls-files '**/yarn.lock'); do
	runOnChange "$f" "$f has changed. Consider running yarn build in $(dirname "$f") to update your working copy."
done
runOnChange composer.lock "composer.lock has changed. Consider running composer install to update your working copy."
for f in $(git ls-files '**/composer.lock'); do
	runOnChange "$f" "$f has changed. Consider running composer install in $(dirname "$f") to update your working copy."
done
runOnChange projects/packages/ "Files within the packages directory have changed. Consider running composer install everywhere."

exit 0

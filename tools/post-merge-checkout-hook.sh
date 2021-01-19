#!/bin/bash

changedFiles="$(git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD)"

runOnChange() {
	echo "$changedFiles" | grep -q "$1" && echo -e "$2"
}

runOnChange yarn.lock "yarn.lock has changed. Consider running yarn build to update your working copy."
runOnChange composer.lock "composer.lock has changed. Consider running composer install to update your working copy."
runOnChange packages/ "Files within the packages directory have changed. Consider running composer install."

exit 0

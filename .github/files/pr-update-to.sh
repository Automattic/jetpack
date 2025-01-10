#!/bin/bash

set -eo pipefail

function die {
	echo "::error::$*"
	exit 1
}

[[ "$GITHUB_EVENT_NAME" == "push" ]] || die "Must be a push event"
[[ "$GITHUB_REF" == "refs/heads/trunk" ]] || die "Must be a push to trunk"

export GIT_AUTHOR_NAME=matticbot
export GIT_AUTHOR_EMAIL=matticbot@users.noreply.github.com
export GIT_COMMITTER_NAME=matticbot
export GIT_COMMITTER_EMAIL=matticbot@users.noreply.github.com

declare -A TAGS
function update_tag {
	if [[ -z "${TAGS[$1]}" ]]; then
		echo "Updating tag $1!"
		git tag --force "$1" HEAD
		TAGS[$1]=1
	fi
}

cd $(dirname "${BASH_SOURCE[0]}")/../..
BASE="$PWD"

# If this commit is creating a new project, we need to create the tag so future runs don't break.
echo "Checking for new projects..."
for F in $(git -c core.quotepath=off diff --no-renames --diff-filter=A --name-only HEAD^..HEAD 'projects/*/*/composer.json'); do
	update_tag "pr-update-to-${F%/*}"
done

# If this commit changed tool versions, update the tag so PRs get rechecked with the new versions.
echo "Checking for changes to .github/versions.sh..."
git diff --exit-code --name-only HEAD^..HEAD .github/versions.sh || update_tag "pr-update-to"

if [[ ${#TAGS[*]} -le 0 ]]; then
	echo 'Done, no tag updates needed.'
	exit 0
fi

echo "Pushing tag updates..."
# Push one at a time, as per https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#push
# "Note: An event will not be created when you push more than three tags at once."
for TAG in "${!TAGS[@]}"; do
	git push --force origin "$TAG"
done
echo 'Done!'

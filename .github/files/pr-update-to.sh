#!/bin/bash

set -eo pipefail

function die {
	echo "::error::$*"
	exit 1
}

[[ "$GITHUB_EVENT_NAME" == "push" ]] || die "Must be a push event"
[[ "$GITHUB_REF" == "refs/heads/master" ]] || die "Must be a push to master"

function update_tag {
	echo 'Updating tag!'
	export GIT_AUTHOR_NAME=matticbot
	export GIT_AUTHOR_EMAIL=matticbot@users.noreply.github.com
	export GIT_COMMITTER_NAME=matticbot
	export GIT_COMMITTER_EMAIL=matticbot@users.noreply.github.com
	git tag --force pr-update-to HEAD
	git push --force origin pr-update-to
	exit 0
}

cd $(dirname "${BASH_SOURCE[0]}")/../..
BASE="$PWD"

# If this commit updated a changelog, assume it was a release and update the tag.
echo "Checking for changes to changelogs..."
FILES=()
for FILE in projects/*/*/composer.json; do
	PROJECT="${FILE%/composer.json}"
	cd "$BASE/$PROJECT"
	FILES+=( "$(realpath -m --relative-to="$BASE" "$(jq -r '.extra.changelogger.changelog // "CHANGELOG.md"' composer.json)")" )
done
cd "$BASE"
git diff --exit-code --name-only HEAD^..HEAD "${FILES[@]}" || update_tag

# If this commit changed tool versions, update the tag so PRs get rechecked with the new versions.
echo "Checking for changes to .github/versions.sh..."
git diff --exit-code --name-only HEAD^..HEAD .github/versions.sh || update_tag

echo 'Done, no tag update needed.'

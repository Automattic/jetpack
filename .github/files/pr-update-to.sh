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
	git config --global user.name "matticbot"
	git config --global user.email "matticbot@users.noreply.github.com"
	git remote set-url origin "https://${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}"
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

echo 'Done, no tag update needed.'

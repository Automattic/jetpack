#!/bin/bash

set -eo pipefail

function die {
	echo "::error::$*"
	exit 1
}

[[ -n "$API_TOKEN_GITHUB" ]] || die "API_TOKEN_GITHUB must be set"
[[ -n "$GITHUB_REPOSITORY" ]] || die "GITHUB_REPOSITORY must be set"

# Check that it's a renovate PR to master with only one commit by renovate[bot]
[[ "$GITHUB_EVENT_NAME" == "pull_request" ]] || die "Event must be a pull request"

BASE_REF=$(jq -r '.pull_request.base.ref' "$GITHUB_EVENT_PATH")
HEAD_REF=$(jq -r '.pull_request.head.ref' "$GITHUB_EVENT_PATH")
DEFAULT_BRANCH=$(jq -r '.repository.default_branch' "$GITHUB_EVENT_PATH")

echo "Head ref: $HEAD_REF"
echo "Base ref: $BASE_REF"
echo "Default branch: $DEFAULT_BRANCH"

[[ -n "$BASE_REF" ]] || die "Failed to find base ref"
[[ -n "$HEAD_REF" ]] || die "Failed to find head ref"

[[ "$DEFAULT_BRANCH" == "$BASE_REF" ]] || die "Expected base ref $BASE_REF to be $DEFAULT_BRANCH"

TMPDIR="${TMPDIR:-/tmp}"
DIR=$(mktemp -d "${TMPDIR%/}/renovate-helper.XXXXXXXX")
trap "rm -rf $DIR" EXIT
cd $DIR

echo "::group::Check out $HEAD_REF"
git init -q .
git remote add origin "https://github.com/${GITHUB_REPOSITORY}"
git config --local http.https://github.com/.extraheader "AUTHORIZATION: basic $(printf "x-access-token:%s" "$API_TOKEN_GITHUB" | base64)"

# Fetch commits to HEAD_REF since BASE_REF. Then fetch one more (the merge base).
git fetch --no-tags --prune --shallow-exclude="$BASE_REF" origin "$HEAD_REF"
git repack -d  # Work around a git bug, "error in object: unshallow".
git fetch --deepen=1 origin "$HEAD_REF"
git repack -d  # Work around a git bug, "error in object: unshallow".
git branch "$HEAD_REF" origin/"$HEAD_REF"

# Same for commits to BASE_REF since HEAD_REF. But first check whether there are
# any (i.e. that BASE_REF isn't a direct ancestor of HEAD_REF), as otherwise
# we'll get "error processing shallow info: 4".
git fetch --no-tags --prune --depth=1 origin "$BASE_REF"
git branch "$BASE_REF" origin/"$BASE_REF"
if ! git merge-base --is-ancestor "$BASE_REF" "$HEAD_REF"; then
	git fetch --no-tags --prune --shallow-exclude="$HEAD_REF" origin "$BASE_REF"
	git repack -d  # Work around a git bug, "error in object: unshallow".
	git fetch --deepen=1 origin "$BASE_REF"
	git repack -d  # Work around a git bug, "error in object: unshallow".
fi

git checkout "$HEAD_REF"
echo "::endgroup::"

# We only want to process PRs where there's only the one renovate commit.
CT=$(git rev-list --count "$BASE_REF".."$HEAD_REF")
if [[ $CT -ne 1 ]]; then
	echo "Found $CT revisions between $BASE_REF and $HEAD_REF, not doing anything."
	exit 0
fi
AUTHORS=$(git log --format=%ae "$BASE_REF".."$HEAD_REF")
if [[ "$AUTHORS" != "bot@renovateapp.com" ]]; then
	echo "Unexpected authors between $BASE_REF and $HEAD_REF ("$AUTHORS"), not doing anything."
	exit 0
fi

# Add a change file for every project touched in the PR, if any.
BASE=$PWD
echo "::group::Monorepo JS install, for prettier"
pnpm install
echo "::endgroup::"
echo "::group::Installing changelogger"
cd projects/packages/changelogger
composer update
cd $BASE
CL="$BASE/projects/packages/changelogger/bin/changelogger"
echo "::endgroup::"

ANY=false
for DIR in $(git -c core.quotepath=off diff --name-only "$BASE_REF"..."$HEAD_REF" | sed -nE 's!^(projects/[^/]+/[^/]+)/.*!\1!p' | sort -u); do
	ANY=true
	SLUG="${DIR#projects/}"
	echo "::group::Adding change file for $SLUG"
	cd "$DIR"

	ARGS=()
	ARGS=( add --no-interaction --filename-auto-suffix --significance=patch )

	if [[ "$SLUG" == "plugins/jetpack" ]]; then
		ARGS+=( --type=other )
	else
		ARGS+=( --type=changed )
	fi
	ARGS+=( --entry="Updated package dependencies" )

	CHANGES_DIR="$(jq -r '.extra.changelogger["changes-dir"] // "changelog"' composer.json)"
	if [[ -d "$CHANGES_DIR" && "$(ls -- "$CHANGES_DIR")" ]]; then
		"$CL" "${ARGS[@]}"
		echo "::endgroup::"
	else
		"$CL" "${ARGS[@]}"
		echo "::endgroup::"
		echo "::group::Updating version for $SLUG"
		VER=$("$CL" version next --default-first-version --prerelease=alpha) || { echo "$VER"; exit 1; }
		"$BASE/tools/project-version.sh" -v -u "$VER" "$SLUG"
		echo "::endgroup::"
	fi
	cd "$BASE"
done

if ! $ANY; then
	echo "No packages are touched in this renovate PR, so nothing to do."
	exit 0
fi

# Update deps and lock files.
echo "::group::Updating dependencies on changed packages"
tools/check-composer-deps.sh -uv
echo "::endgroup::"

# Create and push the commit.
echo "::group::Creating commit"
export GIT_AUTHOR_NAME=matticbot
export GIT_AUTHOR_EMAIL=matticbot@users.noreply.github.com
export GIT_COMMITTER_NAME=matticbot
export GIT_COMMITTER_EMAIL=matticbot@users.noreply.github.com
git add -A
git commit -m 'Add change files'
[[ -n "$CI" ]] && git push
echo '::endgroup::'

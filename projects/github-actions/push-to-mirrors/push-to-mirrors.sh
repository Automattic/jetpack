#!/bin/bash

## Environment used by this script:
#
# Current directory must be within the repo being mirrored from, so the commit message can be read.
#
# Required:
# - BUILD_BASE: Path to the build directory, which contains "mirrors.txt" and directories for each repo to mirror to.
# - GITHUB_ACTOR: GitHub username for the commit being mirrored.
# - GITHUB_REF: Git ref being mirrored from, e.g. "refs/heads/main". Must begin with "refs/heads/".
#
# Other:
# - API_TOKEN_GITHUB: Personal access token to use when accessing GitHub.
# - CI: If unset or empty, the commits will be prepared but the actual push will not happen.
# - COMMIT_MESSAGE: Commit message to use for the mirror commits. Will be read from HEAD in `SOURCE_DIR` if not specified.
# - GITHUB_REPOSITORY: GH repository, used in the commit message if `COMMIT_MESSAGE` is not specified.
# - GITHUB_RUN_ID: GH Actions run ID, used in the commit message if `COMMIT_MESSAGE` is not specified.
# - GITHUB_SHA: Head SHA1 from which to fetch the commit message for the commit being mirrored. HEAD will be assumed if not specified.
# - SOURCE_DIR: Source directory, used when `COMMIT_MESSAGE` is not specified.
# - USER_NAME: Git user name to use when making the commit to the mirror repo.
# - USER_EMAIL: Email address to use when making the commit to the mirror repo. Defaults to "$USER_NAME@users.noreply.github.com"

# Halt on error
set -eo pipefail

if [[ -n "$CI" ]]; then
	export GIT_AUTHOR_NAME="$USER_NAME"
	export GIT_AUTHOR_EMAIL="${USER_EMAIL:-${USER_NAME}@users.noreply.github.com}"
	export GIT_COMMITTER_NAME="$USER_NAME"
	export GIT_COMMITTER_EMAIL="${USER_EMAIL:-${USER_NAME}@users.noreply.github.com}"
fi

if [[ -z "$BUILD_BASE" ]]; then
	echo "::error::BUILD_BASE must be set"
	exit 1
elif [[ ! -d "$BUILD_BASE" ]]; then
	echo "::error::$BUILD_BASE does not exist or is not a directory"
	exit 1
fi

if [[ -z "$COMMIT_MESSAGE" ]]; then
	MONOREPO_COMMIT_MESSAGE=$(cd "${SOURCE_DIR:-.}" && git show -s --format=%B $GITHUB_SHA)
	COMMIT_MESSAGE=$( printf "%s\n\nCommitted via a GitHub action: https://github.com/%s/actions/runs/%s\n" "$MONOREPO_COMMIT_MESSAGE" "$GITHUB_REPOSITORY" "$GITHUB_RUN_ID" )
fi
COMMIT_ORIGINAL_AUTHOR="${GITHUB_ACTOR} <${GITHUB_ACTOR}@users.noreply.github.com>"

if [[ "$GITHUB_REF" =~ ^refs/heads/ ]]; then
	BRANCH=${GITHUB_REF#refs/heads/}
else
	echo "::error::Could not determine branch name from $GITHUB_REF"
	exit 1
fi

if [[ ! -f "$BUILD_BASE/mirrors.txt" ]]; then
	echo "::error::File $BUILD_BASE/mirrors.txt does not exist or is not a file"
	exit 1
elif [[ ! -s "$BUILD_BASE/mirrors.txt" ]]; then
	echo "Nothing to do, $BUILD_BASE/mirrors.txt is empty."
	exit 0
fi

: > "$BUILD_BASE/changes.diff"

EXIT=0
while read -r GIT_SLUG; do
	printf "\n\n\e[7m Mirror: %s \e[0m\n" "$GIT_SLUG"
	CLONE_DIR="${BUILD_BASE}/${GIT_SLUG}"
	cd "${CLONE_DIR}"

	# Initialize the directory as a git repo, and set the remote
	git init -b "$BRANCH" .
	git remote add origin "https://github.com/${GIT_SLUG}"
	git config --local http.https://github.com/.extraheader "AUTHORIZATION: basic $(printf "x-access-token:%s" "$API_TOKEN_GITHUB" | base64)"

	# Check if a remote exists for that mirror.
	if ! git ls-remote -h origin >/dev/null 2>&1; then
		echo "Mirror repo for ${GIT_SLUG} does not exist. Skipping."
		continue
	fi

	echo "::group::Fetching ${GIT_SLUG}"
	FORCE_COMMIT=
	if git -c protocol.version=2 fetch --no-tags --prune --progress --no-recurse-submodules --depth=1 origin "$BRANCH"; then
		git reset --soft FETCH_HEAD
		echo "Fetched revision $(git rev-parse HEAD)"
	elif [[ -n "$DEFAULT_BRANCH" ]] && git -c protocol.version=2 fetch --no-tags --prune --progress --no-recurse-submodules --depth=1 origin "$DEFAULT_BRANCH"; then
		FORCE_COMMIT=--allow-empty
		git reset --soft FETCH_HEAD
		echo "Fetched revision $(git rev-parse HEAD)"
	else
		echo "Failed to find a branch to branch from, just creating an empty one."
		FORCE_COMMIT=--allow-empty
	fi
	git add -Af
	echo "::endgroup::"

	if [[ -n "$FORCE_COMMIT" || -n "$(git status --porcelain)" ]]; then
		echo "Committing to $GIT_SLUG"
		if git commit --quiet $FORCE_COMMIT --author="${COMMIT_ORIGINAL_AUTHOR}" -m "${COMMIT_MESSAGE}" &&
			{ [[ -z "$CI" ]] || git push origin "$BRANCH"; } # Only do the actual push from the GitHub Action
		then
			git show --pretty= --src-prefix="a/$GIT_SLUG/" --dst-prefix="b/$GIT_SLUG/" >> "$BUILD_BASE/changes.diff"
			echo "https://github.com/$GIT_SLUG/commit/$(git rev-parse HEAD)"
			echo "Completed $GIT_SLUG"
		else
			echo "::error::Commit of ${GIT_SLUG} failed"
			EXIT=1
		fi
	else
		echo "No changes, skipping $GIT_SLUG"
	fi
done < "$BUILD_BASE/mirrors.txt"

exit $EXIT

#!/bin/bash

## Environment used by this script:
#
# Current directory must be within the repo being mirrored from, so the commit message can be read.
#
# Required:
# - BUILD_BASE: Path to the build directory, which contains "mirrors.txt" and directories for each repo to mirror to.
# - GITHUB_ACTOR: GitHub username for the commit being mirrored.
# - GITHUB_REF: Git ref being mirrored from, e.g. "refs/heads/main". Must begin with "refs/heads/".
# - GITHUB_REPOSITORY: GH repository.
# - GITHUB_SERVER_URL: The URL of the GitHub server. For example: https://github.com
# - SOURCE_DIR: Source checkout being mirrored from.
#
# Other:
# - API_TOKEN_GITHUB: Personal access token to use when accessing GitHub.
# - CI: If unset or empty, the commits will be prepared but the actual push will not happen.
# - COMMIT_MESSAGE: Commit message to use for the mirror commits. Will be read from commit `GITHUB_SHA` in `SOURCE_DIR` if not specified.
# - DEFAULT_BRANCH: Branch to base new commits on if the `GITHUB_REF` branch doesn't already exist in the mirror and a better commit can't be found.
# - GITHUB_RUN_ID: GH Actions run ID, used in the commit message if `COMMIT_MESSAGE` is not specified.
# - GITHUB_SHA: Head SHA1. HEAD will be assumed if not specified.
# - NO_UPSTREAM_REFS: Set to 'true' to suppress the "Upstream-Ref" footer in commit messages. Note this will make `DEFAULT_BRANCH` be used more often.
# - UPSTREAM_REF_COUNT: When checking Upstream-Ref to find a base commit for a new mirror branch, only consider this many monorepo commits at most.
# - UPSTREAM_REF_SINCE: When checking Upstream-Ref to find a base commit for a new mirror branch, only consider monorepo commits since this date (in any format accepted by `git log`'s `--since` or `--since-as-filter` parameter).
# - USER_NAME: Git user name to use when making the commit to the mirror repo.
# - USER_EMAIL: Email address to use when making the commit to the mirror repo. Defaults to "$USER_NAME@users.noreply.github.com"

# Halt on error
set -eo pipefail

: "${GITHUB_ACTOR:?Must be set and not empty}"
: "${GITHUB_REF:?Must be set and not empty}"
: "${GITHUB_REPOSITORY:?Must be set and not empty}"
: "${GITHUB_SERVER_URL:?Must be set and not empty}"

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

cd "${SOURCE_DIR:-.}"
SOURCE_DIR="$PWD"

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

if [[ -z "$COMMIT_MESSAGE" ]]; then
	MONOREPO_COMMIT_MESSAGE=$( git show -s --format=%B "${GITHUB_SHA:-HEAD}" )
	COMMIT_MESSAGE=$( printf "%s\n\nCommitted via a GitHub action: %s/%s/actions/runs/%s\n" "$MONOREPO_COMMIT_MESSAGE" "$GITHUB_SERVER_URL" "$GITHUB_REPOSITORY" "$GITHUB_RUN_ID" )
fi
COMMIT_ORIGINAL_AUTHOR="${GITHUB_ACTOR} <${GITHUB_ACTOR}@users.noreply.github.com>"

UPSTREAM_REF=
if [[ "$NO_UPSTREAM_REFS" != 'true' ]]; then
	if [[ -z "$GITHUB_SHA" ]]; then
		SHA=$(git rev-parse HEAD)
	fi
	UPSTREAM_REF="Upstream-Ref: $GITHUB_REPOSITORY@${GITHUB_SHA:-$SHA}"

	if [[ -f .git/shallow ]]; then
		echo "::group::Fetching treeless commits for source repo"
		git -c protocol.version=2 fetch --unshallow --filter=tree:0 --no-tags --progress --no-recurse-submodules origin HEAD
		echo "::endgroup::"
	fi

	ARGS=()
	if [[ -n "$UPSTREAM_REF_SINCE" ]]; then
		# GitHub may not have an up-to-date git
		if git log --max-count=1 --since-as-filter='now' &>/dev/null; then
			ARGS+=( --since-as-filter="$UPSTREAM_REF_SINCE" )
		else
			ARGS+=( --since="$UPSTREAM_REF_SINCE" )
		fi
	fi
	if [[ -n "$UPSTREAM_REF_COUNT" ]]; then
		ARGS+=( --max-count="$UPSTREAM_REF_COUNT" )
	fi
	mapfile -t REFS < <( cd "$SOURCE_DIR" && git log "${ARGS[@]}" --format=%H "${GITHUB_SHA:-HEAD}" || true )
	echo "Considering ${#REFS[@]} monorepo commits for Upstream-Ref matching."

	# Batch the commits into sets of 3180 to keep each call later under the 128KiB limit on argument length.
	# 3180 40-byte shas + 3179 separators + 23 bytes of static text leaves 670 bytes for $GITHUB_REPOSITORY.
	# Current max repo name seems to be either 140 or 557 (39 for the owner, 100 for the name, and '/'), depending on whether they've started allowing non-ASCII alphanumerics yet.
	UPSTREAM_REGEXES=()
	NL=$'\n'
	for (( i=0; i<"${#REFS[@]}"; i+=3180 )); do
		UPSTREAM_REGEXES+=( "${NL}Upstream-Ref: $GITHUB_REPOSITORY@($( IFS="|"; echo "${REFS[*]:$i:3180}" ))($|${NL})" )
	done
fi

function get_upstream_sha {
	if [[ "$NO_UPSTREAM_REFS" != 'true' ]] &&
		git -c protocol.version=2 fetch --filter=tree:0 --tags --progress --no-recurse-submodules origin >&2
	then
		local regex
		for regex in "${UPSTREAM_REGEXES[@]}"; do
			local dstsha
			if dstsha=$( git rev-parse --verify --quiet ":/$regex" ) &&
				git -c protocol.version=2 fetch --no-tags --prune --progress --no-recurse-submodules --depth=1 origin "$dstsha" >&2
			then
				echo "$dstsha"
				return 0
			fi
		done
	fi
	return 1
}

EXIT=0
while read -r GIT_SLUG; do
	printf "\n\n\e[7m Mirror: %s \e[0m\n" "$GIT_SLUG"
	CLONE_DIR="${BUILD_BASE}/${GIT_SLUG}"
	cd "${CLONE_DIR}"

	# Initialize the directory as a git repo, and set the remote
	git init -b "$BRANCH" .
	git config --local gc.auto 0
	git remote add origin "${GITHUB_SERVER_URL}/${GIT_SLUG}"
	if [[ -n "$API_TOKEN_GITHUB" ]]; then
		git config --local "http.${GITHUB_SERVER_URL}/.extraheader" "AUTHORIZATION: basic $(printf "x-access-token:%s" "$API_TOKEN_GITHUB" | base64 -w 0)"
	fi

	# Check if a remote exists for that mirror.
	if ! git ls-remote -h origin >/dev/null 2>&1; then
		echo "::error::Mirror repo for ${GIT_SLUG} does not exist."
		echo "Skipping."
		EXIT=1
		continue
	fi

	echo "::group::Fetching ${GIT_SLUG}"

	FORCE_COMMIT=
	if git -c protocol.version=2 fetch --no-tags --prune --progress --no-recurse-submodules --depth=1 origin "$BRANCH"; then
		git reset --soft FETCH_HEAD
		echo "Fetched revision $(git rev-parse HEAD) for branch $BRANCH"
	elif UPSTREAM_SHA=$( get_upstream_sha ); then
		FORCE_COMMIT=--allow-empty
		git reset --soft "$UPSTREAM_SHA"
		echo "Found parent comment $UPSTREAM_SHA"
	elif [[ -n "$DEFAULT_BRANCH" ]] && git -c protocol.version=2 fetch --no-tags --prune --progress --no-recurse-submodules --depth=1 origin "$DEFAULT_BRANCH"; then
		FORCE_COMMIT=--allow-empty
		git reset --soft FETCH_HEAD
		echo "Fetched revision $(git rev-parse HEAD) for branch $DEFAULT_BRANCH"
	else
		echo "Failed to find a branch to branch from, just creating an empty one."
		FORCE_COMMIT=--allow-empty
	fi
	git add -Af
	echo "::endgroup::"

	if [[ -n "$FORCE_COMMIT" || -n "$(git status --porcelain)" ]]; then
		echo "Committing to $GIT_SLUG"
		if git commit --quiet $FORCE_COMMIT --author="${COMMIT_ORIGINAL_AUTHOR}" -m "${COMMIT_MESSAGE}" -m "${UPSTREAM_REF}" &&
			{ [[ -z "$CI" ]] || git push origin "$BRANCH"; } # Only do the actual push from the GitHub Action
		then
			git show --pretty= --src-prefix="a/$GIT_SLUG/" --dst-prefix="b/$GIT_SLUG/" >> "$BUILD_BASE/changes.diff"
			echo "${GITHUB_SERVER_URL}/$GIT_SLUG/commit/$(git rev-parse HEAD)"
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

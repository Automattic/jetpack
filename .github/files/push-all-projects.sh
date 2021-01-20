#!/bin/bash

# Halt on error
set -eo pipefail

if [[ -n "$CI" ]]; then
	git config --global user.name "$USER_NAME"
	git config --global user.email "${USER_EMAIL:-${USER_NAME}@users.noreply.github.com}"
fi

if [[ -z "$BUILD_BASE" ]]; then
	echo "::error::BUILD_BASE must be set"
elif [[ ! -d "$BUILD_BASE" ]]; then
	echo "::error::$BUILD_BASE does not exist or is not a directory"
fi

MONOREPO_COMMIT_MESSAGE=$(git show -s --format=%B $GITHUB_SHA)
COMMIT_MESSAGE=$( echo "${MONOREPO_COMMIT_MESSAGE}\n\nCommitted via a GitHub action: https://github.com/automattic/jetpack/runs/${GITHUB_RUN_ID}" )
COMMIT_ORIGINAL_AUTHOR="${GITHUB_ACTOR} <${GITHUB_ACTOR}@users.noreply.github.com>"

if [[ "$GITHUB_REF" =~ ^refs/heads/ ]]; then
	BRANCH=${GITHUB_REF#refs/heads/}
else
	echo "Could not determine branch name from $GITHUB_REF"
	exit 1
fi

if [[ ! -f "$BUILD_BASE/projects.txt" ]]; then
	echo "::error::File $BUILD_BASE/projects.txt does not exist or is not a file"
elif [[ ! -s "$BUILD_BASE/projects.txt" ]]; then
	echo "No projects were successfully built. Skipping."
	exit 0
fi

EXIT=0
while read -r GIT_SLUG; do
	EMPTY=false
	printf "\n\n\e[7m Project: %s \e[0m\n" "$GIT_SLUG"
	CLONE_DIR="${BUILD_BASE}/${GIT_SLUG}"
	cd "${CLONE_DIR}"

	# Release branches are only mirrored to branches where composer.json specifies the matching prefix.
	if [[ "$BRANCH" =~ /branch- ]]; then
		PREFIX=$(jq -r '.extra["release-branch-prefix"] // ""' composer.json)
		if [[ -z "$PREFIX" ]]; then
			echo "Not mirroring release branch $BRANCH to $GIT_SLUG: no .extra.release-branch-prefix is declared in composer.json"
			continue
		elif [[ "${BRANCH%%/branch-*}" != "$PREFIX" ]]; then
			echo "Not mirroring release branch $BRANCH to $GIT_SLUG: branch prefix \`${BRANCH%%/branch-*}\` != declared prefix \`$PREFIX\`"
			continue
		fi
	fi

	# Check if a remote exists for that project.
	if git ls-remote --exit-code -h "https://$API_TOKEN_GITHUB@github.com/${GIT_SLUG}.git" >/dev/null 2>&1; then
		:
	else
		echo "Mirror repo for ${GIT_SLUG} does not exist. Skipping."
		continue
	fi

	# Initialize the directory as a git repo, and set the remote
	echo "::group::Fetching ${GIT_SLUG}"
	git init -b "$BRANCH" .
	git remote add origin "https://$API_TOKEN_GITHUB@github.com/${GIT_SLUG}.git"
	FORCE_COMMIT=
	if git -c protocol.version=2 fetch --no-tags --prune --progress --no-recurse-submodules --depth=1 origin "$BRANCH"; then
		:
	elif [[ "$BRANCH" != "master" ]] && git -c protocol.version=2 fetch --no-tags --prune --progress --no-recurse-submodules --depth=1 origin master; then
		FORCE_COMMIT=--allow-empty
	else
		echo "::endgroup::"
		echo "::error::Fetching of ${GIT_SLUG} failed"
		EXIT=1
		continue
	fi
	git reset --soft FETCH_HEAD
	git add -Af
	echo "::endgroup::"

	if [[ ! -f "composer.json" ]]; then
		echo "::error::Changes to ${GIT_SLUG} remove essential parts of the package. They will not be committed."
		EXIT=1
		continue
	fi

	if [[ -n "$FORCE_COMMIT" || -n "$(git status --porcelain)" ]]; then
		echo "Committing to $GIT_SLUG"
		if git commit --quiet $FORCE_COMMIT --author="${COMMIT_ORIGINAL_AUTHOR}" -m "${COMMIT_MESSAGE}" &&
			{ [[ -z "$CI" ]] || git push origin "$BRANCH"; } # Only do the actual push from the GitHub Action
		then
			echo "https://github.com/$GIT_SLUG/commit/$(git rev-parse HEAD)"
			echo "Completed $GIT_SLUG"
		else
			echo "::error::Commit of ${GIT_SLUG} failed"
			EXIT=1
		fi
	else
		echo "No changes, skipping $GIT_SLUG"
	fi
done < "$BUILD_BASE/projects.txt"

exit $EXIT

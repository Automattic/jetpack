#!/bin/bash

# Halt on error
set -eo pipefail

BASE=$(pwd)
BUILD_BASE=$(mktemp -d "${TMPDIR:-/tmp}/jetpack-project-mirrors.XXXXXXXX")

echo "::set-output name=build-base::$BUILD_BASE"
[[ -n "$GITHUB_ENV" ]] && echo "BUILD_BASE=$BUILD_BASE" >> $GITHUB_ENV

# Install Yarn generally.
echo "::group::Monorepo setup"
yarn install
echo "::endgroup::"

EXIT=0

touch "$BUILD_BASE/projects.txt"
for project in projects/packages/* projects/plugins/*; do
	PROJECT_DIR="${BASE}/${project}"
	[[ -d "$PROJECT_DIR" ]] || continue # We are only interested in directories (i.e. projects)

	printf "\n\n\e[7m Project: %s \e[0m\n" "$project"

	cd "${PROJECT_DIR}"

	# Read mirror repo from composer.json, if it exists
	if [[ ! -f "composer.json" ]]; then
		echo "Project does not have composer.json, skipping"
		continue
	fi

	GIT_SLUG=$(jq -r '.extra["mirror-repo"] // ""' composer.json)
	if [[ -z "$GIT_SLUG" ]]; then
		echo "Failed to determine project repo name from composer.json, skipping"
		continue
	fi
	echo "Repo name: $GIT_SLUG"

	## clone, delete files in the clone, and copy (new) files over
	# this handles file deletions, additions, and changes seamlessly

	if [[ -f "package.json" ]]; then
		echo "::group::Building ${GIT_SLUG}"
		if yarn install && yarn build-production-concurrently; then
			echo "::endgroup::"
		else
			echo "::endgroup::"
			echo "::error::Build of ${GIT_SLUG} failed"
			EXIT=1
			continue
		fi
	fi

	BUILD_DIR="${BUILD_BASE}/${GIT_SLUG}"
	echo "Build dir: $BUILD_DIR"
	mkdir -p "$BUILD_DIR"

	# Copy standard .github
	cp -r "$BASE/.github/files/mirror-.github" "$BUILD_DIR/.github"

	# Copy only wanted files, based on .gitignore and .gitattributes.
	{
		# Include unignored files by default.
		git ls-files
		# Include ignored files that are tagged as production-include.
		git ls-files --others --ignored --exclude-standard | git check-attr --stdin production-include | sed -n 's/: production-include: \(unspecified\|unset\)$//;t;s/: production-include: .*//p'
	} |
		# Remove all files tagged with production-exclude. This can override production-include.
		git check-attr --stdin production-exclude | sed -n 's/: production-exclude: \(unspecified\|unset\)$//p' |
		# Copy the resulting list of files into the clone.
		xargs cp --parents --target-directory="$BUILD_DIR"

	echo "Build succeeded!"
	echo "$GIT_SLUG" >> "$BUILD_BASE/projects.txt"
done

exit $EXIT

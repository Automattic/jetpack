#!/bin/bash

# Halt on error
set -eo pipefail

BASE=$(pwd)
if [[ -z "$BUILD_BASE" ]]; then
	BUILD_BASE=$(mktemp -d "${TMPDIR:-/tmp}/jetpack-project-mirrors.XXXXXXXX")
elif [[ ! -e "$BUILD_BASE" ]]; then
	mkdir -p "$BUILD_BASE"
elif [[ ! -d "$BUILD_DIR" ]]; then
	echo "$BUILD_DIR already exists, and is not a directory." >&2
	exit 1
elif [[ $(ls -A -- "$BUILD_DIR") ]]; then
	echo "Directory $BUILD_DIR already exists, and is not empty." >&2
	exit 1
fi

echo "::set-output name=build-base::$BUILD_BASE"
[[ -n "$GITHUB_ENV" ]] && echo "BUILD_BASE=$BUILD_BASE" >> $GITHUB_ENV

# Install Yarn generally.
echo "::group::Monorepo setup"
yarn install
echo "::endgroup::"

EXIT=0

touch "$BUILD_BASE/mirrors.txt"
for project in projects/packages/* projects/plugins/* projects/github-actions/*; do
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

	if jq -e '.scripts["build-production"]' composer.json &>/dev/null; then
		echo "::group::Building ${GIT_SLUG}"

		# If composer.json contains a reference to the monorepo repo, add one pointing to our production clones just before it.
		# That allows us to pick up the built version for plugins like Jetpack.
		# Also save the old contents to restore post-build to help with local testing.
		OLDJSON=$(<composer.json)
		JSON=$(jq --arg path "$BUILD_BASE/*/*" '( .repositories // [] | map( .options.monorepo or false ) | index(true) ) as $i | if $i != null then .repositories[$i:$i] |= [{ type: "path", url: $path, options: { monorepo: true } }] else . end' composer.json | "$BASE/tools/prettier" --parser=json-stringify)
		if [[ "$JSON" != "$OLDJSON" ]]; then
			echo "$JSON" > composer.json
			if [[ -e "composer.lock" ]]; then
				OLDLOCK=$(<composer.lock)
				composer update --root-reqs --no-install
			else
				OLDLOCK=
			fi
		fi

		if composer run-script --timeout=0 build-production; then
			FAIL=false
		else
			FAIL=true
		fi

		# Restore files to help with local testing.
		if [[ "$JSON" != "$OLDJSON" ]]; then
			echo "$OLDJSON" > composer.json
			[[ -n "$OLDLOCK" ]] && echo "$OLDLOCK" > composer.lock || rm -f composer.lock
		fi

		echo "::endgroup::"
		if $FAIL; then
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

	# Remove monorepo repos from composer.json
	JSON=$(jq 'if .repositories then .repositories |= map( select( .options.monorepo | not ) ) else . end' "$BUILD_DIR/composer.json" | "$BASE/tools/prettier" --parser=json-stringify)
	if [[ "$JSON" != "$(<"$BUILD_DIR/composer.json")" ]]; then
		echo "$JSON" > "$BUILD_DIR/composer.json"
	fi

	echo "Build succeeded!"
	echo "$GIT_SLUG" >> "$BUILD_BASE/mirrors.txt"
done

exit $EXIT

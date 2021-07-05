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
elif [[ "$(ls -A -- "$BUILD_DIR")" ]]; then
	echo "Directory $BUILD_DIR already exists, and is not empty." >&2
	exit 1
fi

echo "::set-output name=build-base::$BUILD_BASE"
[[ -n "$GITHUB_ENV" ]] && echo "BUILD_BASE=$BUILD_BASE" >> $GITHUB_ENV

# Install JS generally, and changelogger.
echo "::group::Monorepo setup"
pnpm install
echo "::endgroup::"
echo "::group::Changelogger setup"
(cd projects/packages/changelogger && composer install)
echo "::endgroup::"

echo "::group::Determining build order"
TMP="$(tools/get-build-order.php)"
SLUGS=()
mapfile -t SLUGS <<<"$TMP"
echo "::endgroup::"

EXIT=0

REPO="$(jq --arg path "$BUILD_BASE/*/*" -nc '{ type: "path", url: $path, options: { monorepo: true } }')"

touch "$BUILD_BASE/mirrors.txt"
for SLUG in "${SLUGS[@]}"; do
	PROJECT_DIR="${BASE}/projects/${SLUG}"
	[[ -d "$PROJECT_DIR" ]] || continue # We are only interested in directories (i.e. projects)

	printf "\n\n\e[7m Project: %s \e[0m\n" "$SLUG"

	cd "${PROJECT_DIR}"

	if [[ ! -f "composer.json" ]]; then
		echo "Project does not have composer.json, skipping"
		continue
	fi

	## clone, delete files in the clone, and copy (new) files over
	# this handles file deletions, additions, and changes seamlessly

	echo "::group::Building ${SLUG}"

	# If composer.json contains a reference to the monorepo repo, add one pointing to our production clones just before it.
	# That allows us to pick up the built version for plugins like Jetpack.
	# Also save the old contents to restore post-build to help with local testing.
	OLDJSON=$(<composer.json)
	JSON=$(jq --argjson repo "$REPO" '( .repositories // [] | map( .options.monorepo or false ) | index(true) ) as $i | if $i != null then .repositories[$i:$i] |= [ $repo ] else . end' composer.json | "$BASE/tools/prettier" --parser=json-stringify)
	if [[ "$JSON" != "$OLDJSON" ]]; then
		echo "$JSON" > composer.json
		if [[ -e "composer.lock" ]]; then
			OLDLOCK=$(<composer.lock)
			PACKAGES=()
			mapfile -t PACKAGES < <( composer info --locked --name-only | sed -e 's/ *$//' | grep --fixed-strings --line-regexp --file=<( jq --argjson repo "$REPO" -rn '$repo.options.versions // {} | keys[]' ) )
			if [[ ${#PACKAGES[@]} -gt 0 ]]; then
				composer update --no-install "${PACKAGES[@]}"
			fi
		else
			OLDLOCK=
		fi
	fi
	if (cd $BASE && pnpx jetpack build "${SLUG}" -v --production); then
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
		echo "::error::Build of ${SLUG} failed"
		EXIT=1
		continue
	fi

	# Update the changelog, if applicable.
	if [[ -x 'vendor/bin/changelogger' ]]; then
		CHANGELOGGER=vendor/bin/changelogger
	elif [[ -x 'bin/changelogger' ]]; then
		# Changelogger itself doesn't have itself in vendor/.
		CHANGELOGGER=bin/changelogger
	elif jq -e '.["require-dev"]["automattic/jetpack-changelogger"] // false' composer.json > /dev/null; then
		# Some plugins might build with `composer install --no-dev`.
		CHANGELOGGER="$BASE/projects/packages/changelogger/bin/changelogger"
	else
		CHANGELOGGER=
	fi
	if [[ -n "$CHANGELOGGER" ]]; then
		CHANGES_DIR="$(jq -r '.extra.changelogger["changes-dir"] // "changelog"' composer.json)"
		if [[ -d "$CHANGES_DIR" && "$(ls -- "$CHANGES_DIR")" ]]; then
			echo "::group::Updating changelog"
			if ! $CHANGELOGGER write --prologue='This is an alpha version! The changes listed here are not final.' --default-first-version --prerelease=alpha --release-date=unreleased --no-interaction --yes -vvv; then
				echo "::endgroup::"
				echo "::error::Changelog update for ${SLUG} failed"
				EXIT=1
				continue
			fi
			echo "::endgroup::"
		else
			echo "Not updating changelog, there are no change files."
		fi
	fi

	# Read mirror repo from composer.json
	GIT_SLUG=$(jq -r '.extra["mirror-repo"] // ""' composer.json)
	if [[ -z "$GIT_SLUG" ]]; then
		echo "Failed to determine project repo name from composer.json, skipping"
		continue
	fi
	echo "Repo name: $GIT_SLUG"

	BUILD_DIR="${BUILD_BASE}/${GIT_SLUG}"
	echo "Build dir: $BUILD_DIR"
	mkdir -p "$BUILD_DIR"

	# Copy standard .github
	cp -r "$BASE/.github/files/mirror-.github" "$BUILD_DIR/.github"

	# Copy autotagger if enabled
	if jq -e '.extra.autotagger // false' composer.json > /dev/null; then
		cp -r "$BASE/.github/files/gh-autotagger/." "$BUILD_DIR/.github/."
	fi

	# Copy license.
	LICENSE=$(jq -r '.license // ""' composer.json)
	if [[ -n "$LICENSE" ]]; then
		echo "License: $LICENSE"
		if cp "$BASE/.github/licenses/$LICENSE.txt" "$BUILD_DIR/LICENSE.txt"; then
			echo "License file copied."
		else
			echo "::error file=projects/$SLUG/composer.json::License value not approved."
			EXIT=1
			continue
		fi
	else
		echo "No license declared."
		# TODO: Make this an error?
	fi

	# Copy SECURITY.md
	cp "$BASE/SECURITY.md" "$BUILD_DIR/SECURITY.md"

	# Copy only wanted files, based on .gitignore and .gitattributes.
	{
		# Include unignored files by default.
		git -c core.quotepath=off ls-files
		# Include ignored files that are tagged as production-include.
		git -c core.quotepath=off ls-files --others --ignored --exclude-standard | git -c core.quotepath=off check-attr --stdin production-include | sed -n 's/: production-include: \(unspecified\|unset\)$//;t;s/: production-include: .*//p'
	} |
		# Remove all files tagged with production-exclude. This can override production-include.
		git -c core.quotepath=off check-attr --stdin production-exclude | sed -n 's/: production-exclude: \(unspecified\|unset\)$//p' |
		# Copy the resulting list of files into the clone.
		xargs cp --parents --target-directory="$BUILD_DIR"

	# Remove monorepo repos from composer.json
	JSON=$(jq 'if .repositories then .repositories |= map( select( .options.monorepo | not ) ) else . end' "$BUILD_DIR/composer.json" | "$BASE/tools/prettier" --parser=json-stringify)
	if [[ "$JSON" != "$(<"$BUILD_DIR/composer.json")" ]]; then
		echo "$JSON" > "$BUILD_DIR/composer.json"
	fi

	echo "Build succeeded!"
	echo "$GIT_SLUG" >> "$BUILD_BASE/mirrors.txt"

	# Add the package's version to the custom repo, since composer can't determine it right on its own.
	REPO="$(jq --argjson repo "$REPO" -nc 'reduce inputs as $in ($repo; .options.versions[$in.name] |= ( $in.extra["branch-alias"]["dev-master"] // "dev-master" ) )' composer.json)"
done

exit $EXIT

#!/bin/bash

set -eo pipefail

BASE="$PWD"
BRANCH="$1"
CHANGEFILE="$(sed 's/[<>:"/\\|?*]/-/g' <<<"$BRANCH")"

. "$BASE/tools/includes/changelogger.sh"
. "$BASE/tools/includes/alpha-tag.sh"

function die {
	echo "::error::$*"
	exit 1
}

# Renovate may get confused if we leave installed node_modules or the like behind.
# So delete everything that's git-ignored on exit.
function cleanup {
	cd "$BASE"
	git config --unset core.hooksPath || true
	git clean -qfdX || true
}
trap "cleanup" EXIT

# Renovate puts some cache dirs in different places.
if [[ "$HOME" == "/" ]]; then
	mkdir /var/tmp/home
	export HOME=/var/tmp/home
fi

#pnpm config set --global store-dir /tmp/renovate/cache/others/pnpm
#composer config --global cache-dir /tmp/renovate/cache/others/composer

# Do the pnpm and changelogger installs.
cd "$BASE"
pnpm install
cd projects/packages/changelogger
composer update
cd "$BASE"

# Add change files for anything that changed. But ignore .npmrc, renovate mangles those.
echo "Changed files:"
git -c core.quotepath=off diff --name-only HEAD | grep -E -v '(^|/)\.npmrc'
ANY=false
for DIR in $(git -c core.quotepath=off diff --name-only HEAD | grep -E -v '(^|/)\.npmrc' | sed -nE 's!^(projects/[^/]+/[^/]+)/.*!\1!p' | sort -u); do
	ANY=true
	SLUG="${DIR#projects/}"
	echo "Adding change file for $SLUG"
	cd "$DIR"

	CHANGES_DIR="$(jq -r '.extra.changelogger["changes-dir"] // "changelog"' composer.json)"
	if [[ -d "$CHANGES_DIR" && "$(ls -- "$CHANGES_DIR")" ]]; then
		changelogger_add 'Updated package dependencies.' '' --filename="${CHANGEFILE}" --filename-auto-suffix
	else
		changelogger_add 'Updated package dependencies.' '' --filename="${CHANGEFILE}" --filename-auto-suffix
		echo "Updating version for $SLUG"
		PRERELEASE=$(alpha_tag composer.json 0)
		VER=$(changelogger version next --default-first-version --prerelease="$PRERELEASE") || { echo "$VER"; exit 1; }
		"$BASE/tools/project-version.sh" -u "$VER" "$SLUG"
	fi
	cd "$BASE"
done

if ! $ANY; then
	echo "No projects are touched in this renovate PR, so nothing to do."
	exit 0
fi

# Update deps and lock files.
echo "Updating dependencies on changed projects"
tools/check-intra-monorepo-deps.sh -ua -n "${CHANGEFILE}"

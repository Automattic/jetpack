#!/bin/bash

set -eo pipefail

# Signal to jetpack CLI that we're part of a CI run, so it doesn't try to prompt for tracking.
export CI=1

BASE="$PWD"
BRANCH="$1"
CHANGEFILE="$(sed 's/[<>:"/\\|?*]/-/g' <<<"$BRANCH")"

. "$BASE/tools/includes/changelogger.sh"
. "$BASE/tools/includes/alpha-tag.sh"

function die {
	echo "::error::$*"
	exit 1
}

# Renovate has a bug where they modify `.npmrc` and don't clean up after themselves,
# resulting in those modifications being included in the diff.
# https://github.com/renovatebot/renovate/discussions/23489
# So work around it by manually reverting the file and deleting any new copies they may have created.
git restore .npmrc
git clean -f '*/.npmrc'

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

# Do the pnpm install. Turn off some strictness settings to make it more likely this will work.
cd "$BASE"
echo 'strict-peer-dependencies = false' >> .npmrc
echo 'strict-dep-builds = false' >> .npmrc
pnpm install
git restore .npmrc

# Install changelogger too.
cd "$BASE/projects/packages/changelogger"
composer update

# Add change files for anything that changed.
cd "$BASE"
echo "Changed files:"
git -c core.quotepath=off diff --name-only HEAD
ANY=false
for DIR in $(git -c core.quotepath=off diff --name-only HEAD | sed -nE 's!^(projects/[^/]+/[^/]+)/.*!\1!p' | sort -u); do
	ANY=true
	SLUG="${DIR#projects/}"
	echo "Adding change file for $SLUG"
	cd "$DIR"

	changelogger_add 'Update package dependencies.' '' --filename="${CHANGEFILE}" --filename-auto-suffix
	cd "$BASE"
done

if ! $ANY; then
	echo "No projects are touched in this renovate PR, so nothing to do."
	exit 0
fi

# Update deps and lock files.
echo "Updating dependencies on changed projects"
tools/check-intra-monorepo-deps.sh -ua -n "${CHANGEFILE}"

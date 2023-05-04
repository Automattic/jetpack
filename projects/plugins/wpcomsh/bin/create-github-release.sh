#!/bin/sh

# Enable nicer messaging for build status.
BLUE_BOLD='\033[1;34m';
GREEN_BOLD='\033[1;32m';
RED_BOLD='\033[1;31m';
YELLOW_BOLD='\033[1;33m';
COLOR_RESET='\033[0m';

error () {
	printf "\n🤯 ${RED_BOLD}$1${COLOR_RESET}\n"
	exit 1
}
status () {
	printf "\n👩‍💻 ${BLUE_BOLD}$1${COLOR_RESET}\n"
}
success () {
	printf "\n✅ ${GREEN_BOLD}$1${COLOR_RESET}\n"
}
warning () {
	printf "\n${YELLOW_BOLD}$1${COLOR_RESET}\n"
}

# We want to be in the root `wpcomsh` dir
cd `dirname "$0"` && cd ..

# Test whether we're logged in to GitHub.
gh auth status --hostname github.com || exit 1

status "Creating GitHub release"

CURRENTBRANCH=`git rev-parse --abbrev-ref HEAD`

status "Reading the current version from wpcomsh.php"
VERSION=`awk '/[^[:graph:]]Version/{print $NF}' wpcomsh.php`
echo "Version that will be built and released is ${VERSION}"

status "Making the build artifact"
make build

ZIP_FILE="build/wpcomsh.${VERSION}.zip"

if [ ! -r $ZIP_FILE ]; then
	error "The build artifact could not be found at ${ZIP_FILE}"
fi

status "Creating the release and attaching the build artifact"

BRANCH="build/${VERSION}"
git checkout -b $BRANCH
gh release create --title "$VERSION" --notes "Release of version $VERSION. See README.md for details." "v${VERSION}" "${ZIP_FILE}"
STATUS=$?
git checkout $CURRENTBRANCH
git branch -D $BRANCH

if [ "$STATUS" != 0 ]; then
	error "Failed creating a release for ${VERSION}."
fi

success "GitHub release complete."

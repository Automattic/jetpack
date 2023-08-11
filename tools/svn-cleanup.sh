#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"
. "$BASE/tools/includes/plugin-functions.sh"
. "$BASE/tools/includes/proceed_p.sh"
. "$BASE/tools/includes/version-compare.sh"

# Instructions
function usage {
	cat <<-EOH
		usage: $0 [options] <plugin>

		Cleans up previous beta and alpha versions of Jetpack. The <plugin> may be
		either the name of a directory in projects/plugins/, or a path to a plugin directory or file.

		Options:
		  --dir <dir>  Use the specified directory for the SVN checkout,
		               instead of creating a random directory in TMPDIR.

	EOH
	exit 1
}

# Process args.
ARGS=()
BUILD_DIR=
while [[ $# -gt 0 ]]; do
	arg="$1"
	shift
	case $arg in
		--dir)
			BUILD_DIR="$1"
			shift
			;;
		--dir=*)
			BUILD_DIR="${arg#--dir=}"
			;;
		--help)
			usage
			;;
		*)
			ARGS+=( "$arg" )
			;;
	esac
done
if [[ ${#ARGS[@]} -ne 1 ]]; then
	usage
fi

$INTERACTIVE || die "Input is not a terminal, aborting."

# Check plugin.
process_plugin_arg "${ARGS[0]}"
PLUGIN_NAME=$(jq --arg n "${ARGS[0]}" -r '.name // $n' "$PLUGIN_DIR/composer.json")
WPSLUG=$(jq -r '.extra["wp-plugin-slug"] // ""' "$PLUGIN_DIR/composer.json")
VERSION_TYPE=$(jq -r '.extra["changelogger"]["versioning"] // ""' "$PLUGIN_DIR/composer.json" )
[[ -n "$WPSLUG" ]] || die "Plugin $PLUGIN_NAME has no WordPress.org plugin slug. Cannot cleanup previous tags."

# Check build dir.
if [[ -z "$BUILD_DIR" ]]; then
	TMPDIR="${TMPDIR:-/tmp}"
	BUILD_DIR=$(mktemp -d "${TMPDIR%/}/svn-cleanup.XXXXXXXX")
	trap 'rm -rf "$BUILD_DIR"' EXIT
elif [[ ! -e "$BUILD_DIR" ]]; then
	mkdir -p "$BUILD_DIR"
else
	if [[ ! -d "$BUILD_DIR" ]]; then
		proceed_p "$BUILD_DIR already exists, and is not a directory." "Delete it?"
	elif [[ -n $(ls -A -- "$BUILD_DIR") ]]; then
		proceed_p "Directory $BUILD_DIR already exists, and is not empty." "Delete it?"
	fi
	rm -rf "$BUILD_DIR"
	mkdir -p "$BUILD_DIR"
fi
cd "$BUILD_DIR"
DIR=$(pwd)

info "Checking out SVN and getting the current stable tag"
svn -q checkout "https://plugins.svn.wordpress.org/$WPSLUG/" --depth=empty "$DIR"
svn -q up trunk/ --depth=empty
svn -q up trunk/readme.txt

# Ignore point releases for wordpress-style versioning
if [[ "$VERSION_TYPE" == "wordpress" ]]; then
	STABLE_TAG=$(grep "Stable tag:" trunk/readme.txt | grep -Eo '[0-9]+\.([0-9]+)')
else
	STABLE_TAG=$(grep "Stable tag:" trunk/readme.txt | grep -Eo '[0-9]+(\.[0-9]+)+')
fi

success "Done! Checked out to $DIR"

info "Checking out SVN tags to $DIR/tags"
svn -q up tags --depth=immediates
cd tags
success "Done!"

info "Getting list of pre-release tags"
PRERELEASE_TAGS=()
for TAG in *; do
	if [[ "$TAG" =~ [0-9]+(\.[0-9]+)+- ]] && version_compare "$STABLE_TAG" "$TAG" && [[ "$TAG" != "$STABLE_TAG".* && "$TAG" != "$STABLE_TAG"-* ]]; then
		PRERELEASE_TAGS+=("$TAG")
	fi
done
success "Done!"

yellow "Current stable tag in SVN: ${STABLE_TAG}"
if [[ ${#PRERELEASE_TAGS[@]} -eq 0 ]]; then
	echo "No beta or alpha tags from previous releases to delete!"
	exit
fi

yellow "Tags that will be deleted:"
for TAG in "${PRERELEASE_TAGS[@]}"; do
	red "$TAG"
done
proceed_p "" "Continue?"
echo ""

info "Deleting tags..."
svn -q rm "${PRERELEASE_TAGS[@]}"
svn ci -m "Deleting previous release's alphas and betas"
success "Done!"

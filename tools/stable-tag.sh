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

		Update the stable tag for the specified plugin. The <plugin> may be
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
[[ -n "$WPSLUG" ]] || die "Plugin $PLUGIN_NAME has no WordPress.org plugin slug. Cannot deploy."

# Check build dir.
if [[ -z "$BUILD_DIR" ]]; then
	TMPDIR="${TMPDIR:-/tmp}"
	BUILD_DIR=$(mktemp -d "${TMPDIR%/}/update-tag.XXXXXXXX")
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


# Get JSON
JSON=$(curl -s "https://api.wordpress.org/plugins/info/1.0/$WPSLUG.json")
if ! jq -e '.' <<<"$JSON" &>/dev/null; then
	die "Failed to retrieve JSON data from https://api.wordpress.org/plugins/info/1.0/$WPSLUG.json"
fi
if jq -e '.error' <<<"$JSON" &>/dev/null; then
	die "WordPress.org plugin API returned an error when querying $WPSLUG: $( jq -r '.error' <<<"$JSON" )"
fi

# Current stable version
CURRENT_STABLE_VERSION=$(jq -r .version <<<"$JSON")

# Get all versions, strip anything with alpha characters such as -beta or trunk. Sort and create an array.
SVN_TMP=$(jq -r '.versions | keys[] | select( test( "^[0-9]+(\\.[0-9]+)+$" ) )' <<<"$JSON"  | sort -V )
mapfile -t SVN_TAGS <<<"$SVN_TMP"
SVN_LATEST=${SVN_TAGS[-1]}

# Get mirror repo

MIRROR=$(jq -r '.extra["mirror-repo"] // ""' "$PLUGIN_DIR/composer.json")
[[ -n "$MIRROR" ]] || die "Plugin $WPSLUG has no mirror repo."

# Current release on GH

GH_JSON=$(curl -s "https://api.github.com/repos/$MIRROR/releases/latest")
if ! jq -e '.' <<<"$JSON" &>/dev/null; then
	die "Failed to retrieve JSON data from https://api.github.com/repos/$MIRROR/releases/latest"
fi

GH_LATEST=$(jq -r '.tag_name | ltrimstr( "v" )' <<<"$GH_JSON")

yellow "Current stable tag: ${CURRENT_STABLE_VERSION}"
yellow "Latest tag in SVN: ${SVN_LATEST}"
yellow "Latest release tag in GH: ${GH_LATEST}"

# Compare versions and abort if things look wrong

if [[ "$SVN_LATEST" == "$GH_LATEST" ]] && version_compare "$SVN_LATEST" "$CURRENT_STABLE_VERSION" "1"; then
	echo "Updating the stable tag for ${WPSLUG} to:"
	red "${SVN_LATEST}"
	proceed_p "" "Continue?"
	echo ""

	info "Checking out SVN shallowly to $DIR"
	svn -q checkout "https://plugins.svn.wordpress.org/$WPSLUG/" --depth=empty "$DIR"
	success "Done!"

	info "Checking out SVN trunk to $DIR/trunk"
	svn -q up trunk
	success "Done!"

	# Update trunk to point to the last stable tag.
	info "Modifying 'Stable tag:' value in trunk readme.txt"
	sed -i.bak -e "s/Stable tag: .*/Stable tag: $SVN_LATEST/" trunk/readme.txt
	rm trunk/readme.txt.bak # We need a backup file because macOS requires it.
	echo ""
	yellow "The diff you are about to commit:"
	svn diff

	echo ""
	proceed_p "You are about to update the stable tag for ${WPSLUG} via the diff above." "Would you like to commit it now?" Y
	svn ci -m "Update stable tag"

elif [[ "$SVN_LATEST" == "$CURRENT_STABLE_VERSION" && "$GH_LATEST" == "$CURRENT_STABLE_VERSION" ]]; then
	echo "All versions are the same. Nothing to update."
	exit
else
	die "Something doesn’t look right with versions. Please make sure the release was creted on GH and pushed to SVN."
fi

#!/usr/bin/env bash

set -eo pipefail

# CAUTION!
# This script does one thing, which is to revert stable tag in WordPress.org svn to the prior tag.
# It should only be used in extreme emergency cases.

BASE=$(cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd)
. "$BASE/tools/includes/chalk-lite.sh"
. "$BASE/tools/includes/plugin-functions.sh"
. "$BASE/tools/includes/proceed_p.sh"

# Instructions
function usage {
	cat <<-EOH
		usage: $0 [options] <plugin>

		This script does one thing, which is to revert stable tag in WordPress.org
		svn to the prior tag. It should only be used in extreme emergency cases.

		The <plugin> may be either the name of a directory in projects/plugins/,
		or a path to a plugin directorty or file.

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
	BUILD_DIR=$(mktemp -d "${TMPDIR%/}/revert-release.XXXXXXXX")
elif [[ ! -e "$BUILD_DIR" ]]; then
	mkdir -p "$BUILD_DIR"
else
	if [[ ! -d "$BUILD_DIR" ]]; then
		proceed_p "$BUILD_DIR already exists, and is not a directory." "Delete it?"
	elif [[ $(ls -A -- "$BUILD_DIR") ]]; then
		proceed_p "Directory $BUILD_DIR already exists, and is not empty." "Delete it?"
	fi
	rm -rf "$BUILD_DIR"
	mkdir -p "$BUILD_DIR"
fi
cd "$BUILD_DIR"
DIR=$(pwd)

# Get JSON
JSON=$(curl -s "http://api.wordpress.org/plugins/info/1.0/$WPSLUG.json")
if ! jq -e '.' <<<"$JSON" &>/dev/null; then
	die "Failed to retrieve JSON data from http://api.wordpress.org/plugins/info/1.0/$WPSLUG.json"
fi

# Current stable version
CURRENT_STABLE_VERSION=$(jq -r .version <<<"$JSON")

# Get all versions, strip anything with alpha characters such as -beta or trunk.
SVN_TMP=$(jq -r '.versions | keys[] | select( test( "^[0-9]+(\\.[0-9]+)+$" ) )' <<<"$JSON"  | sort -V )
mapfile -t SVN_TAGS <<<"$SVN_TMP"
LAST_STABLE_TAG=${SVN_TAGS[-2]}

red CAUTION
echo "This script does one thing, which is to revert stable tag in WordPress.org svn to the prior tag."
echo "It should only be used in extreme emergency cases."
echo ""
yellow "Current stable tag: ${CURRENT_STABLE_VERSION}"
yellow "Revert to tag: ${LAST_STABLE_TAG}"
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
sed -i.bak -e "s/Stable tag: .*/Stable tag: $LAST_STABLE_TAG/" trunk/readme.txt
rm trunk/readme.txt.bak # We need a backup file because macOS requires it.
echo ""
yellow "The diff you are about to commit:"
svn diff

echo ""
error "WARNING:"
proceed_p "You are about to revert the stable tag for Jetpack via the diff above." "Would you like to commit it now?"
svn ci -m "Revert stable tag"

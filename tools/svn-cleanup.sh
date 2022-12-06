#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"
. "$BASE/tools/includes/plugin-functions.sh"
. "$BASE/tools/includes/proceed_p.sh"

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
[[ -n "$WPSLUG" ]] || die "Plugin $PLUGIN_NAME has no WordPress.org plugin slug. Cannot cleanup previous tags."

# Check build dir.
if [[ -z "$BUILD_DIR" ]]; then
	TMPDIR="${TMPDIR:-/tmp}"
	BUILD_DIR=$(mktemp -d "${TMPDIR%/}/svn-cleanup.XXXXXXXX")
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

# Current stable version
CURRENT_STABLE_VERSION=$(jq -r .version <<<"$JSON")

# Get all versions, excluding point releases for Jetpack-the-plugin, so we can obtain the previous release cycle's version.
if [[ $WPSLUG == "jetpack" ]]; then
	SVN_TMP=$(jq -r '.versions | keys[] | select( test( "^[0-9]+(\\.[0-9]+){1}$" ) )' <<<"$JSON"  | sort -V )
else
	SVN_TMP=$(jq -r '.versions | keys[] | select( test( "^[0-9]+(\\.[0-9]+)+$" ) )' <<<"$JSON"  | sort -V )
fi
mapfile -t SVN_TAGS <<<"$SVN_TMP"
SVN_PREVIOUS=${SVN_TAGS[-2]}

# Get all previous version's betas and alphas
SVN_PREV_TAGS=$(jq -r '.versions | keys[] | select( test( "^'${SVN_PREVIOUS}'\\-" ) )' <<<"$JSON"  | sort -V )

yellow "Current stable tag in SVN: ${CURRENT_STABLE_VERSION}"
if [[ -z "$SVN_PREV_TAGS" ]]; then
	echo "No beta or alpha tags for $SVN_PREVIOUS to delete!"
	exit
fi
yellow "Tags that will be deleted:"
red "${SVN_PREV_TAGS}"
proceed_p "" "Continue?"
echo ""

# Checkout and delete the tags, then commit to SVN.
info "Checking out SVN shallowly to $DIR"
svn -q checkout "https://plugins.svn.wordpress.org/$WPSLUG/" --depth=empty "$DIR"
success "Done! Checked out to $DIR"

info "Checking out SVN tags to $DIR/tags (this may take a while)"
svn -q up tags --depth=empty
cd tags
SVN_PREV_TAGS=$(echo "$SVN_PREV_TAGS" | tr '\n' ' ')
svn -q up ${SVN_PREV_TAGS}
success "Done!"

info "Deleting tags..."
svn -q rm ${SVN_PREV_TAGS}
svn ci -m "Deleting $SVN_PREVIOUS alphas and betas"
success "Done!"

exit

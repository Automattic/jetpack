#!/bin/bash

set -eo pipefail

# Print help and exit.
function usage {
	cat <<-EOH
		usage: $0 <plugin>

		  Print the version from the plguin's header. The <plugin> may be either
		  the name of a directory in projects/plugins/, or a path to a plugin
		  directorty or file.

		usage: $0 -v version <plugin>

		  Update the version of the specified plugin. The following version
		  numbers are updated:
		   - Version in the WordPress plugin header.
		   - Version in composer.json, if any.
		   - Version in package.json, if any.
		   - Any constants defined in composer.json's .extras.version-constants.

		usage: $0 -n [count] -v version

		  Normalizes the passed version number. Set a count to specify the minimum
		  number of components in the normalized version number.
	EOH
	exit 1
}

# Determine if the passed file is a WordPress plugin file.
# Returns success of failure accordingly.
function is_wp_plugin_file {
	# WordPress looks for "Plugin Name" in the first 8K bytes of the file.
	# They allow more different prefixes, but we're a little more strict
	# and require something resembling a PHP doc comment.
	{ head -c 8192 "$1" | grep '^ \* Plugin Name:'; } &>/dev/null
}

# Find the plugin file in PLUGIN_DIR, and set PLUGIN_FILE.
#
# On failure, prints to STDERR and returns
#  - 1 if no plugin file was found,
#  - 2 if multiple possible plugin files were found.
function find_plugin_file {
	local FILES=()
	for f in "$PLUGIN_DIR"/*.php; do
		if is_wp_plugin_file "$f"; then
			FILES+=( "$f" )
		fi
	done
	if [[ ${#FILES[@]} -eq 0 ]]; then
		echo "No plugin file was detected in $PLUGIN_DIR." >&2
		return 1
	fi
	if [[ ${#FILES[@]} -gt 1 ]]; then
		echo "Multiple possible plugin files were detected in $PLUGIN_DIR." >&2
		printf " - %s\n" "${FILES[@]}" >&2
		return 2
	fi
	PLUGIN_FILE="${FILES[0]}"
}

BASE=$(cd $(dirname "${BASH_SOURCE[0]}")/.. && pwd)
. "$BASE/tools/includes/normalize-version.sh"

if [[ $# -eq 0 ]]; then
	usage
fi

# Sets options.
OP=get
while getopts ":v:n:h" opt; do
	case ${opt} in
		v)
			VERSION_RAW=$OPTARG
			OP=set
			;;
		n)
			NORMALIZE_COUNT=$OPTARG
			;;
		h)
			usage
			;;
		:)
			if [[ $OPTARG == "n" ]]; then
				NORMALIZE_COUNT=2
			else
				echo "Argument -$OPTARG requires a value." >&2
				exit 1
			fi
			;;
		?)
			echo "Invalid argument: -$OPTARG" >&2
			echo ""
			usage
			;;
	esac
done
shift "$(($OPTIND -1))"

# If we have a version request set, do that and exit.
if [[ -n "$NORMALIZE_COUNT" ]]; then
	if [[ -z "$VERSION_RAW" ]]; then
		echo "Option -n requires -v." >&2
		exit 1
	fi
	normalize_version_number "$VERSION_RAW" "$NORMALIZE_COUNT"
	echo "$NORMALIZED_VERSION"
	exit
fi

# Determine the plugin
if [[ -z "$1" ]]; then
	echo "A plugin must be specified unless -n is used." >&2
	exit 1
elif [[ "$1" != "*/*" && -d "$BASE/projects/plugins/$1" ]]; then
	PLUGIN_DIR="$BASE/projects/plugins/$1"
	find_plugin_file
elif [[ -d "$1" ]]; then
	PLUGIN_DIR="${1%/}"
	find_plugin_file
elif [[ -f "$1" ]]; then
	PLUGIN_FILE="$1"
	PLUGIN_DIR=$(dirname "$1")
	if ! is_wp_plugin_file "$PLUGIN_FILE"; then
		echo "File $1 does not appear to be a WordPress plugin file." >&2
		exit 1
	fi
else
	echo "Specified plugin $1 is not valid." >&2
	exit 1
fi

# If we're supposed to read the version, do that.
if [[ "$OP" == "get" ]]; then
	sed -n -E -e 's/^ \* Version:[[:blank:]]+([^[:blank:]](.*[^[:blank:]])?)[[:blank:]]*$/\1/p' "$PLUGIN_FILE"
	exit
fi

# Normalize versions.
normalize_version_number "$VERSION_RAW"
TARGET_VERSION="$NORMALIZED_VERSION"
normalize_version_number "$VERSION_RAW" 3
TARGET_VERSION_3="$NORMALIZED_VERSION"

# Update the WordPress plugin header version
sed -i.bak -E "s/^ \* Version: .+/ * Version: ${TARGET_VERSION}/" "$PLUGIN_FILE"
rm "$PLUGIN_FILE.bak" # We need a backup file because macOS requires it.

# Update composer.json and package.json
for FILE in "$PLUGIN_DIR/composer.json" "$PLUGIN_DIR/package.json"; do
	if [[ -f "$FILE" ]]; then
		JSON=$(jq --arg v "$TARGET_VERSION_3" 'if .version then .version |= $v else . end' "$FILE" | "$BASE/tools/prettier" --parser=json-stringify)
		if [[ "$JSON" != "$(<"$FILE")" ]]; then
			echo "$JSON" > "$FILE"
		fi
	fi
done

# Update declared constants
if [[ -f "$PLUGIN_DIR/composer.json" ]]; then
	jq -r '.extra["version-constants"] // {} | to_entries | .[] | .key + " " + .value' "$PLUGIN_DIR/composer.json" | while IFS=" " read -r C F; do
		if [[ ! -f "$PLUGIN_DIR/$F" ]]; then
			echo "Warning: File $PLUGIN_DIR/$F does not exist, cannot replace version constant $C." >&2
		else
			CE=$(sed 's/[.\[\]\\*^$\/()+?{}|]/\\&/g' <<<"${C}")
			VE=$(sed 's/[&\\/]/\\&/g' <<<"${TARGET_VERSION}")
			CONTENTS=$(sed -E "s/^([[:blank:]]*define\( '$CE', ')[^']*(' \);)$/\1$VE\2/" "$PLUGIN_DIR/$F")
			if [[ "$CONTENTS" != "$(<"$PLUGIN_DIR/$F")" ]]; then
				echo "$CONTENTS" > "$PLUGIN_DIR/$F"
			else
				echo "Warning: Did not find version constant $C in $PLUGIN_DIR/$F." >&2
			fi
		fi
	done
fi

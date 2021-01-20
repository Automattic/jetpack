#!/bin/bash

# Determine if the passed file is a WordPress plugin file.
# Returns success or failure accordingly.
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

# Process a "plugin" argument to set PLUGIN_DIR and PLUGIN_FILE.
# Returns success of failure as appropriate.
function process_plugin_arg {
	if [[ "$1" != "*/*" && -d "$BASE/projects/plugins/$1" ]]; then
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
			return 3
		fi
	else
		echo "Specified plugin $1 is not valid." >&2
		return 4
	fi
}

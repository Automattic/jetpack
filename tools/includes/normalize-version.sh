#!/bin/bash

# Normalizes a version string to desired length.
# First arg is input string, second is minimum number of points.
# Version is written to NORMALIZED_VERSION.
function normalize_version_number {
	local TARGET_LENGTH VERSION_ARRAY VERSION_SUFFIX VERSION_RAW VERSION_PARTS i
	TARGET_LENGTH="${2:-2}"
	VERSION_ARRAY=()

	# Break off dash content to append later.
	if [[ "$1" =~ "-" ]]; then
		VERSION_SUFFIX=${1#*-}
		VERSION_RAW=${1%%-*}
	else
		VERSION_RAW=$1
	fi

	# Iterate over version string, and append them to array.
	IFS='.' read -ra VERSION_PARTS <<< "$VERSION_RAW"
	for i in "${VERSION_PARTS[@]}"; do
		VERSION_ARRAY+=( "$i" )
	done

	# Add additional zeros until target length is reached.
	while [[ "${#VERSION_ARRAY[@]}" -lt "$TARGET_LENGTH" ]]; do
		VERSION_ARRAY+=( "0" )
	done

	# Join array by dots, then append suffix.
	NORMALIZED_VERSION=$(IFS=. ; echo "${VERSION_ARRAY[*]}")
	if [[ -n "$VERSION_SUFFIX" ]]; then
		NORMALIZED_VERSION="${NORMALIZED_VERSION}-${VERSION_SUFFIX}"
	fi
}

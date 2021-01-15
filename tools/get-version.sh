#!/bin/bash

DIR="${BASH_SOURCE%/*}"
if [[ ! -d "$DIR" ]]; then DIR="$PWD"; fi
. "$DIR/includes/normalize-version.sh"

if [[ ! -f "$1" ]]; then
	echo "USAGE: $0 <plugin-main-file>" >&2
	exit 1
fi

# Retrieving the version from package file
PHP_VERSION=$(head -15 "$1" | grep '* Version' | cut -d ':' -f2)
if [[ -z "$PHP_VERSION" ]]; then
	echo "Failed to find Version header in $1" >&2
	exit 1
fi

normalize_version_number "$PHP_VERSION" 3

echo $NORMALIZED_VERSION

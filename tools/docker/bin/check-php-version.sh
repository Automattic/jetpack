#!/usr/bin/env bash

set -eo pipefail

# Oldest packages.sury.org build of each PHP branch the images may ship. Branches not listed are not checked.
# 7.4 to 8.1 get fixes as Sury rebuilds without a new upstream release, so their minimums are dated Sury builds.
declare -A MIN_VERSIONS=(
	[7.4]='1:7.4.33-31+0~20261021'
	[8.0]='1:8.0.30-25+0~20261021'
	[8.1]='8.1.34-9+0~20261021'
	[8.2]='8.2.35'
	[8.3]='8.3.36'
	[8.4]='8.4.27'
	[8.5]='8.5.12'
)

VER=$1
if [[ ! "$VER" =~ ^[0-9]+\.[0-9]+$ ]]; then
	echo "USAGE: $0 <version>" >&2
	exit 1
fi

MIN=${MIN_VERSIONS[$VER]}
if [[ -z "$MIN" ]]; then
	exit 0
fi

# Every PHP SAPI package depends on the exact same php*-common version, so this covers them all.
INSTALLED=$( dpkg-query -W -f='${Version}' "php${VER}-common" )
if ! dpkg --compare-versions "$INSTALLED" ge "$MIN"; then
	printf '\e[1;31mPHP %s is at package version %s, but at least %s is required.\e[0m\n' "$VER" "$INSTALLED" "$MIN" >&2
	exit 1
fi

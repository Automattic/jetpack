#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd $(dirname "${BASH_SOURCE[0]}")/.. && pwd)
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"

function usage {
	cat <<-EOH
		usage: $0 [options] <dir>

		Updates all monorepo packages for the project in the specified directory.
		If \`--root-reqs\` is passed, also updates its root reqs.

		Most options accepted by \`composer update\` are accepted to pass on
		to composer while updating dependencies.
	EOH
	exit 1
}

function check_dir {
	if [[ ! -z "$DIR" ]]; then
		error "Only one directory may be specified."
		return 1
	elif [[ -d "$1" ]]; then
		DIR="${1%/}"
	elif [[ "$1" == "*/composer.json" && -f "$1" ]]; then # DWIM
		DIR="$(dirname "$1")"
	elif [[ "$1" == "*/composer.lock" && -f "$1" ]]; then # DWIM
		DIR="$(dirname "$1")"
	else
		error "Directory $1 does not exist."
		return 1
	fi
	if [[ ! -f "$DIR/composer.json" ]]; then
		error "$DIR does not contain composer.json."
		return 1
	fi
	if [[ ! -f "$DIR/composer.lock" ]]; then
		error "$DIR does not contain composer.lock."
		return 1
	fi
}

COMPOSER_ARGS=()
ROOT_REQS=false
while [[ $# -gt 0 ]]; do
	arg="$1"
	shift
	case $arg in
		-h|--help)
			usage
			exit
			;;
		-V|--version|-d|--working-dir|--working-dir=*)
			die "Cannot pass $arg on to composer."
			;;
		--root-reqs)
			ROOT_REQS=true
			;;
		--)
			while [[ $# -gt 0 ]]; do
				check_dir "$1"
				shift
			done
			;;
		-*)
			COMPOSER_ARGS+=( "$arg" )
			;;
		*)
			check_dir "$arg"
			;;
	esac
done
if [[ -z "$DIR" ]]; then
	usage
fi

TO_UPDATE=()
mapfile -t TO_UPDATE < <(
	(
		composer info --working-dir="$DIR" --locked --name-only | sed -e 's/ *$//' | grep --fixed-strings --line-regexp --file=<( jq -r '.name' "$BASE"/projects/packages/*/composer.json )
		if $ROOT_REQS; then
			composer info --working-dir="$DIR" --locked --direct --name-only | sed -e 's/ *$//'
		fi
	) | sort -u
)
COMPOSER_ROOT_VERSION=dev-trunk composer update "${COMPOSER_ARGS[@]}" --working-dir="$DIR" -- "${TO_UPDATE[@]}"

# Point out if the user's composer version is outdated.
VER="$(composer --version 2>/dev/null | sed -n -E 's/^Composer( version)? ([0-9]+\.[0-9]+\.[0-9a-zA-Z.-]+) [0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}.*/\2/p')"
if [[ -z "$VER" ]]; then
	warn "Your composer version is not recognized: $(composer --version)"
	warn "It may not work properly with the monorepo tooling."
else
	VA="$(sed -E 's/^([0-9]+\.[0-9]+)\..*/\1/' <<<"$VER")"
	source "$BASE/.github/versions.sh"
	VB="$(sed -E 's/^([0-9]+\.[0-9]+)\..*/\1/' <<<"$COMPOSER_VERSION")"
	if [[ "$VA" != "$VB" ]]; then
		warn "You have Composer version $VER. Version $VB.x is recommended to work properly with the monorepo tooling."
	fi
fi

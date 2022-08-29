#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd $(dirname "${BASH_SOURCE[0]}")/.. && pwd)
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"

# This script updates the composer.json file in the specified directory.
# It will update any monorepo packages their latest stable versions.
#
# Probably will be most useful in the release scripts that branch off, since we:
# a. Want to ship Jetpack with specific versions of packages
# b. Want to preserve @dev in trunk branch

function usage {
	cat <<-EOH
		usage: $0 [options] <directory>

		Most options accepted by \`composer require\` are accepted to pass on
		to composer while updating dependencies.
	EOH
	exit 1
}

DIR=
function check_dir {
	if [[ ! -z "$DIR" ]]; then
		error "Only one directory may be specified."
		return 1
	elif [[ -d "$1" ]]; then
		DIR="${1%/}"
		if [[ ! -f "$DIR/composer.json" ]]; then
			error "$DIR does not contain composer.json."
			return 1
		fi
	elif [[ "$1" == "*/composer.json" && -f "$1" ]]; then # DWIM
		DIR="$(dirname "$1")"
	else
		error "Directory $1 does not exist."
		return 1
	fi
}

COMPOSER_ARGS=()
while [[ $# -gt 0 ]]; do
	arg="$1"
	shift
	case $arg in
		-h|--help)
			usage
			exit
			;;
		--dev|-V|--version|-d|--working-dir|--working-dir=*)
			die "Cannot pass $arg on to composer."
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

# Remove the monorepo repo from composer.json.
JSON=$(jq --tab 'if .repositories then .repositories |= map( select( .options.monorepo | not ) ) else . end' "$DIR/composer.json")
echo "$JSON" > "$DIR/composer.json"

# Get the list of package names to update.
PACKAGES=$(jq -nc 'reduce inputs as $in ([]; . + [ $in.name ])' "$BASE"/projects/packages/*/composer.json)

# Get current versions from the package.
OLD_VERSIONS=$(jq -r --argjson packages "$PACKAGES" '( .["require-dev"] // {} ) + ( .require // {} ) | with_entries( select( ( .value | test( "\\.x-dev$" ) ) and ( .key as $k | $packages | index( $k ) ) ) )' "$DIR/composer.json")

# Update the packages that appear in composer.json
TO_UPDATE=()
mapfile -t TO_UPDATE < <(jq -r --argjson packages "$PACKAGES" '.require // {} | to_entries[] | select( ( .value | test( "^@dev$|\\.x-dev$" ) ) and ( .key as $k | $packages | index( $k ) ) ) | .key' "$DIR/composer.json")
if [[ ${#TO_UPDATE[@]} -gt 0 ]]; then
	info "Updating packages: ${TO_UPDATE[*]}..."
	composer require "${COMPOSER_ARGS[@]}" --no-update --working-dir="$DIR" -- "${TO_UPDATE[@]}"
fi
TO_UPDATE=()
mapfile -t TO_UPDATE < <(jq -r --argjson packages "$PACKAGES" '.["require-dev"] // {} | to_entries[] | select( ( .value | test( "^@dev$|\\.x-dev$" ) ) and ( .key as $k | $packages | index( $k ) ) ) | .key' "$DIR/composer.json")
if [[ ${#TO_UPDATE[@]} -gt 0 ]]; then
	info "Updating dev packages: ${TO_UPDATE[*]}..."
	composer require "${COMPOSER_ARGS[@]}" --no-update --working-dir="$DIR" --dev -- "${TO_UPDATE[@]}"
fi

# Update any indirect dependencies too.
"$BASE/tools/composer-update-monorepo.sh" "${COMPOSER_ARGS[@]}" "$DIR"

# Compare new versus old versions to check for downgrades.
EXIT=0
while IFS=$'\t' read -r PKG OLDVER NEWVER; do
	OV=$(sed -e 's/\.x-dev$/.0-alpha/' <<<"$OLDVER")
	NV=$(sed -e 's/^\^//' -e 's/\.x-dev$/.0-alpha/' <<<"$NEWVER")
	if ! pnpm semver -c --range ">$OV" "$NV" >/dev/null; then
		EXIT=1
		error "$PKG was not upgraded ($NEWVER <= $OLDVER)"
	fi
done < <(jq -r --argjson oldver "$OLD_VERSIONS" '( .["require-dev"] // {} ) + ( .require // {} ) | to_entries[] | select( $oldver[.key] ) | [ .key, $oldver[.key], .value ] | @tsv' "$DIR/composer.json")

exit $EXIT

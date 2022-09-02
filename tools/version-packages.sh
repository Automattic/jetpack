#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd $(dirname "${BASH_SOURCE[0]}")/.. && pwd)
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"

# This script updates the composer.json file in the specified directory.
# It will update any monorepo packages to their latest version as declared in their changelog.
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

# Get the list of packages to update, mapped to their target versions.
PACKAGES='{}'
CL="$PWD/projects/packages/changelogger/bin/changelogger"
for PKG in "$BASE"/projects/packages/*/composer.json; do
	PACKAGES=$(jq -c --arg k "$(jq -r .name "$PKG")" --arg v "$(cd "${PKG%/composer.json}" && "$CL" version current --default-first-version)" '.[$k] |= $v' <<<"$PACKAGES")
done

# Get current packages and their versions from the target project.
OLD_VERSIONS=$(jq -r --argjson packages "$PACKAGES" '( .["require-dev"] // {} ) + ( .require // {} ) | with_entries( select( ( .value | test( "\\.x-dev$" ) ) and $packages[.key] ) )' "$DIR/composer.json")

# Update the versions in composer.json, without actually updating them yet.
TO_UPDATE=()
mapfile -t TO_UPDATE < <(jq -r --argjson packages "$PACKAGES" '.require // {} | to_entries[] | select( ( .value | test( "^@dev$|\\.x-dev$" ) ) and $packages[.key] ) | "\(.key)=^\($packages[.key])"' "$DIR/composer.json")
if [[ ${#TO_UPDATE[@]} -gt 0 ]]; then
	info "Updating packages: ${TO_UPDATE[*]}..."
	composer require "${COMPOSER_ARGS[@]}" --no-update --working-dir="$DIR" -- "${TO_UPDATE[@]}"
fi
TO_UPDATE=()
mapfile -t TO_UPDATE < <(jq -r --argjson packages "$PACKAGES" '.["require-dev"] // {} | to_entries[] | select( ( .value | test( "^@dev$|\\.x-dev$" ) ) and $packages[.key] ) | "\(.key)=^\($packages[.key])"' "$DIR/composer.json")
if [[ ${#TO_UPDATE[@]} -gt 0 ]]; then
	info "Updating dev packages: ${TO_UPDATE[*]}..."
	composer require "${COMPOSER_ARGS[@]}" --no-update --working-dir="$DIR" --dev -- "${TO_UPDATE[@]}"
fi

# Update any indirect dependencies too. Pass `--with` options to ensure exactly the versions we expect are used.
WITH=()
mapfile -t WITH < <(jq -r --argjson oldvers "$OLD_VERSIONS" 'to_entries[] | select( $oldvers[.key] ) | "--with=\( .key )=\( .value )"' <<<"$PACKAGES")
"$BASE/tools/composer-update-monorepo.sh" "${COMPOSER_ARGS[@]}" "${WITH[@]}" "$DIR"

# If there's a lock file, check that the locked versions are as expected too.
EXIT=0
if [[ -e "$DIR/composer.lock" ]]; then
	TMP="$(composer info --locked --format=json --working-dir="$DIR" | jq -r --argjson packages "$PACKAGES" '.locked[] | select( $packages[.name] ) | [ .name, .version, $packages[.name] ] | @tsv')"
	while IFS=$'\t' read -r PKG LOCKVER EXPECTVER; do
		if ! pnpm semver -c --range ">=$EXPECTVER" "$LOCKVER" >/dev/null; then
			EXIT=1
			error "$PKG was not upgraded ($LOCKVER < $EXPECTVER)"
		fi
	done <<<"$TMP"
fi
exit $EXIT

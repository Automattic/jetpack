#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd $(dirname "${BASH_SOURCE[0]}")/.. && pwd)
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"
. "$BASE/tools/includes/version-compare.sh"

function usage {
	cat <<-EOH
		usage: $0 <--release|--dev> [plugin...]

		Check plugin dependencies on monorepo packages to ensure the expected versions
		are locked. Pass either --release or --dev to indicate which is expected.

	EOH
	exit 1
}

EXIT=0
if [[ -n "$CI" ]]; then
	function err {
		FILE=$1
		shift
		EXIT=1
		echo "::error file=$FILE::$*"
	}
else
	function err {
		shift
		EXIT=1
		error "$*"
	}
fi

WHAT=
PLUGINS=()
while [[ $# -gt 0 ]]; do
	arg="$1"
	shift
	case $arg in
		-h|--help)
			usage
			exit
			;;
		--dev)
			WHAT=dev
			;;
		--release)
			WHAT=rel
			;;
		-*)
			die "Unrecognized option \"$arg\""
			;;
		*)
			PLUGINS+=( "$arg" )
			;;
	esac
done
if [[ -z "$WHAT" ]]; then
	usage
fi
if [[ ${#PLUGINS[@]} -eq 0 ]]; then
	for PLUGIN in "$BASE"/projects/plugins/*/composer.lock; do
		PLUGIN="${PLUGIN%/composer.lock}"
		PLUGIN="${PLUGIN##*/}"
		PLUGINS+=( "$PLUGIN" )
	done
fi

# Get the list of packages to update, mapped to their target versions.
PACKAGES='{}'
CL="$PWD/projects/packages/changelogger/bin/changelogger"
if ! "$CL" &>/dev/null; then
	(cd "$BASE/projects/packages/changelogger" && composer update --quiet)
	if ! "$CL" &>/dev/null; then
		die "Changelogger is not runnable via $CL"
	fi
fi

for PKG in "$BASE"/projects/packages/*/composer.json; do
	PACKAGES=$(jq -c --arg k "$(jq -r .name "$PKG")" --arg v1 "$(cd "${PKG%/composer.json}" && "$CL" version current --default-first-version)" --arg v2 "$(jq -r '.extra["branch-alias"]["dev-trunk"] // "dev-trunk"' "$PKG")" '.[$k] |= { rel: $v1, dev: $v2 }' <<<"$PACKAGES")
done

for PLUGIN in "${PLUGINS[@]}"; do
	DIR="$BASE/projects/plugins/$PLUGIN"
	if [[ ! -e "$DIR/composer.lock" ]]; then
		EXIT=1
		error "Plugin $PLUGIN does not seem to exist in the monorepo"
		continue
	fi

	# Check composer.json dep format
	TMP="$(jq -r --argjson packages "$PACKAGES" '.require // {}, .["require-dev"] // {} | to_entries[] | select( $packages[.key] ) | [ .key, .value, $packages[.key].rel, $packages[.key].dev ] | @tsv' "$DIR/composer.json")"
	while IFS=$'\t' read -r PKG DEPVER RELVER DEVVER; do
		if [[ "$WHAT" == 'dev' && "$DEPVER" != "$DEVVER" ]]; then
			err "projects/plugins/$PLUGIN/composer.json" "$PLUGIN: $PKG dependency should be \"$DEVVER\", not $DEPVER"
		elif [[ "$WHAT" == 'release' && ( "$DEPVER" == dev-* || "$DEPVER" == *-dev ) ]]; then
			err "projects/plugins/$PLUGIN/composer.json" "$PLUGIN: $PKG dependency should be like \"^$RELVER\", not $DEPVER"
		fi
	done <<<"$TMP"

	# Check lock file versions
	TMP="$(composer info --locked --format=json --working-dir="$DIR" | jq -r --argjson packages "$PACKAGES" '.locked[] | select( $packages[.name] ) | [ .name, .version, $packages[.name].rel ] | @tsv')"
	while IFS=$'\t' read -r PKG LOCKVER EXPECTVER; do
		if [[ "$WHAT" == "dev" ]]; then
			if [[ "$LOCKVER" != "dev-trunk" ]]; then
				err "projects/plugins/$PLUGIN/composer.lock" "$PLUGIN: $PKG should be at dev-trunk, not $LOCKVER"
			fi
		else
			if [[ "$LOCKVER" == dev-* || "$LOCKVER" == *-dev ]]; then
				err "projects/plugins/$PLUGIN/composer.lock" "$PLUGIN: $PKG is locked to a dev version ($LOCKVER), expected $EXPECTVER"
			elif ! version_compare "${LOCKVER#v}" "${EXPECTVER#v}"; then
				err "projects/plugins/$PLUGIN/composer.lock" "$PLUGIN: $PKG is not at the expected release version ($LOCKVER < $EXPECTVER)"
			fi
		fi
	done <<<"$TMP"
done
exit $EXIT

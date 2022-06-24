#!/usr/bin/env bash

set -eo pipefail

cd $(dirname "${BASH_SOURCE[0]}")/..
BASE=$PWD
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"
. "$BASE/tools/includes/alpha-tag.sh"

# Print help and exit.
function usage {
	cat <<-EOH
		usage: $0 [-a] [-n <name>] [-v] [-U|-u] [<slug> ...]

		Check that all composer and pnpm dependencies between monorepo projects are up to date.

		If \`-u\` is passed, update any that aren't and add changelogger change files
		for the updates.

		If \`-U\` is passed, update any that aren't but do not create a change file.

		If <slug> is passed, only that project is checked.

		Other options:
		 -a: Pass --filename-auto-suffix to changelogger (avoids "file already exists" errors).
		 -n: Set changelogger filename.
		 -v: Output debug information.
	EOH
	exit 1
}

# Sets options.
UPDATE=false
VERBOSE=false
DOCL_EVER=true
AUTO_SUFFIX=false
CL_FILENAME=
while getopts ":uUvhan:" opt; do
	case ${opt} in
		u)
			UPDATE=true
			;;
		U)
			UPDATE=true
			DOCL_EVER=false
			;;
		a)
			AUTO_SUFFIX=true
			;;
		n)
			CL_FILENAME="$OPTARG"
			;;
		v)
			VERBOSE=true
			;;
		h)
			usage
			;;
		:)
			die "Argument -$OPTARG requires a value."
			;;
		?)
			error "Invalid argument: -$OPTARG"
			echo ""
			usage
			;;
	esac
done
shift "$(($OPTIND -1))"

if ! $VERBOSE; then
	. "$BASE/tools/includes/spin.sh"
	function debug {
		:
	}
else
	. "$BASE/tools/includes/nospin.sh"
	if [[ -n "$CI" ]]; then
		function debug {
			# Grey doesn't work well in GH's output.
			blue "$@"
		}
	fi
fi

function get_packages {
	PACKAGES_DEV=$(jq -nc 'reduce inputs as $in ({}; .[$in.name] |= if $in.extra["branch-alias"]["dev-trunk"] then [ $in.extra["branch-alias"]["dev-trunk"], ( $in.extra["branch-alias"]["dev-trunk"] | sub( "^(?<v>\\d+\\.\\d+)\\.x-dev$"; "^\(.v)" ) ) ] else [ "@dev" ] end )' "$BASE"/projects/packages/*/composer.json)
	PACKAGES_NODEV=$(jq -c '( .[][0] | select( . != "@dev" ) ) |= empty' <<<"$PACKAGES_DEV")
	PACKAGES_STAR=$(jq -c '.[] |= [ "@dev" ]' <<<"$PACKAGES_DEV")
	JSPACKAGES_PROJ=$(jq -nc 'reduce inputs as $in ({}; if $in.name then .[$in.name] |= [ "workspace:* || ^\( $in.version | sub( "^(?<v>[0-9]+\\.[0-9]+)(?:\\..*)$"; "\(.v)" ) )", "workspace:* || \($in.version)" ] else . end )' "$BASE"/projects/js-packages/*/package.json)
	JSPACKAGES_STAR=$(jq -c '.[] |= [ "workspace:*" ]' <<<"$JSPACKAGES_PROJ")
}

get_packages

DO_PNPM_LOCK=true
SLUGS=()
if [[ $# -le 0 ]]; then
	# Use a temp variable so pipefail works
	TMP="$(pnpm jetpack dependencies build-order --pretty)" || { echo "$TMP"; exit 1; }
	mapfile -t SLUGS <<<"$TMP"
	TMP="$(git ls-files '**/composer.json' '**/package.json' | sed -E -n -e '\!^projects/[^/]*/[^/]*/(composer|package)\.json$! d' -e 's!/(composer|package)\.json$!!' -e 's/^/nonproject:/p' | sort -u)"
	mapfile -t -O ${#SLUGS[@]} SLUGS <<<"$TMP"
else
	SLUGS=( "$@" )
	DO_PNPM_LOCK=false
fi

if $UPDATE; then
	DID_CL_INSTALL=false
	CL="$BASE/projects/packages/changelogger/bin/changelogger"

	function changelogger {
		local SLUG="$1"

		if ! $DID_CL_INSTALL; then
			debug "Making sure changelogger is runnable"
			(cd "$BASE/projects/packages/changelogger" && composer update --quiet)
			DID_CL_INSTALL=true
		fi

		local OLDDIR=$PWD
		cd "$BASE/projects/$SLUG"

		local ARGS=()
		ARGS=( add --no-interaction --significance=patch )
		local CLTYPE="$(jq -r '.extra["changelogger-default-type"] // "changed"' composer.json)"
		if [[ -n "$CLTYPE" ]]; then
			ARGS+=( "--type=$CLTYPE" )
		fi

		if [[ -n "$CL_FILENAME" ]]; then
			ARGS+=( --filename="$CL_FILENAME" )
		fi
		if $AUTO_SUFFIX; then
			ARGS+=( --filename-auto-suffix )
		fi

		ARGS+=( --entry="$2" --comment="$3" )

		local CHANGES_DIR="$(jq -r '.extra.changelogger["changes-dir"] // "changelog"' composer.json)"
		if [[ -d "$CHANGES_DIR" && "$(ls -- "$CHANGES_DIR")" ]]; then
			"$CL" "${ARGS[@]}"
		else
			"$CL" "${ARGS[@]}"
			info "Updating version for $SLUG"
			local PRERELEASE=$(alpha_tag "$CL" composer.json 0)
			local VER=$("$CL" version next --default-first-version --prerelease=$PRERELEASE) || { error "$VER"; EXIT=1; cd "$OLDDIR"; return; }
			"$BASE/tools/project-version.sh" -v -u "$VER" "$SLUG"
			get_packages
		fi
		cd "$OLDDIR"
	}
fi

EXIT=0
ANYJS=false
for SLUG in "${SLUGS[@]}"; do
	spin
	debug "Checking dependencies of $SLUG"
	if [[ "$SLUG" == monorepo ]]; then
		PACKAGES="$PACKAGES_DEV"
		JSPACKAGES="$JSPACKAGES_PROJ"
		DOCL=false
		DIR=.
	elif [[ "$SLUG" == nonproject:* ]]; then
		PACKAGES="$PACKAGES_STAR"
		JSPACKAGES="$JSPACKAGES_STAR"
		if [[ "$SLUG" == nonproject:tools/cli/skeletons/* ]]; then
			PACKAGES="$PACKAGES_DEV"
			JSPACKAGES="$JSPACKAGES_PROJ"
			if [[ "$SLUG" == "nonproject:tools/cli/skeletons/packages" ]]; then
				PACKAGES="$PACKAGES_NODEV"
			fi
		fi
		DOCL=false
		DIR="${SLUG#nonproject:}"
	else
		PACKAGES="$PACKAGES_DEV"
		JSPACKAGES="$JSPACKAGES_PROJ"
		if [[ "$SLUG" == packages/* ]]; then
			PACKAGES="$PACKAGES_NODEV"
		fi
		DOCL=$DOCL_EVER
		DIR="projects/$SLUG"
	fi
	if [[ ! -d "$DIR" ]]; then
		EXIT=1
		if [[ -n "$CI" ]]; then
			echo "::error::Cannot check $SLUG, as $DIR does not exist."
		else
			error "Cannot check $SLUG, as $DIR does not exist."
		fi
		continue
	fi
	PHPFILE="$DIR/composer.json"
	JSFILE="$DIR/package.json"
	if $UPDATE; then
		if [[ -e "$PHPFILE" ]]; then
			JSON=$(jq --tab --argjson packages "$PACKAGES" -r 'def ver(e): if $packages[e.key] then if e.value[0:1] == "^" then $packages[e.key][1] else null end // $packages[e.key][0] else e.value end; if .require then .require |= with_entries( .value = ver(.) ) else . end | if .["require-dev"] then .["require-dev"] |= with_entries( .value = ver(.) ) else . end' "$PHPFILE")
			if [[ "$JSON" != "$(<"$PHPFILE")" ]]; then
				info "PHP dependencies of $SLUG changed!"
				echo "$JSON" > "$PHPFILE"

				if $DOCL; then
					info "Creating changelog entry for $SLUG"
					changelogger "$SLUG" 'Updated package dependencies.'
					DOCL=false
				fi
			fi
		fi
		if [[ -e "$JSFILE" ]]; then
			JSON=$(jq --tab --argjson packages "$JSPACKAGES" -r 'def ver(e): if $packages[e.key] then if e.value[0:1] == "^" then $packages[e.key][1] else null end // $packages[e.key][0] else e.value end; def proc(k): if .[k] then .[k] |= with_entries( .value = ver(.) ) else . end; proc("dependencies") | proc("devDependencies") | proc("peerDependencies") | proc("optionalDependencies")' "$JSFILE")
			if [[ "$JSON" != "$(<"$JSFILE")" ]]; then
				info "JS dependencies of $SLUG changed!"
				echo "$JSON" > "$JSFILE"
				ANYJS=true

				if $DOCL; then
					info "Creating changelog entry for $SLUG"
					changelogger "$SLUG" 'Updated package dependencies.'
					DOCL=false
				fi
			fi
		fi
		if [[ -n "$(git -c core.quotepath=off ls-files "$DIR/composer.lock")" ]]; then
			PROJECTFOLDER="$BASE/$DIR"
			cd "$PROJECTFOLDER"
			debug "Updating $SLUG composer.lock"
			OLD="$(<composer.lock)"
			"$BASE/tools/composer-update-monorepo.sh" --quiet "$PROJECTFOLDER"
			if [[ "$OLD" != "$(<composer.lock)" ]] && $DOCL; then
				info "Creating changelog entry for $SLUG composer.lock update"
				changelogger "$SLUG" '' 'Updated composer.lock.'
				DOCL=false
			fi
			cd "$BASE"
		fi
	else
		while IFS=$'\t' read -r FILE PKG VER; do
			EXIT=1
			LINE=$(grep --line-number --fixed-strings --max-count=1 "$PKG" "$FILE")
			if [[ -n "$CI" ]]; then
				M="::error file=$FILE"
				[[ -n "$LINE" ]] && M="$M,line=${LINE%%:*}"
				echo "$M::Must depend on monorepo package $PKG version $VER%0AYou might use \`tools/check-intra-monorepo-deps.sh -u\` to fix this."
			else
				M="$FILE"
				[[ -n "$LINE" ]] && M="$M:${LINE%%:*}"
				error "$M: Must depend on monorepo package $PKG version $VER"
			fi
		done < <(
			if [[ -e "$PHPFILE" ]]; then
				jq --argjson packages "$PACKAGES" -r '.require // {}, .["require-dev"] // {} | to_entries[] | select( .value as $v | $packages[.key] as $vals | $vals and ( $vals | index( $v ) == null ) ) | [ input_filename, .key, ( $packages[.key] | join( " or " ) ) ] | @tsv' "$PHPFILE"
			fi
			if [[ -e "$JSFILE" ]]; then
				jq --argjson packages "$JSPACKAGES" -r '.dependencies // {}, .devDependencies // {}, .peerDependencies // {}, .optionalDependencies // {} | to_entries[] | select( .value as $v | $packages[.key] as $vals | $vals and ( $vals | index( $v ) == null ) ) | [ input_filename, .key, ( $packages[.key] | join( " or " ) ) ] | @tsv' "$JSFILE"
			fi
		)
	fi
done

if $ANYJS; then
	if $DO_PNPM_LOCK; then
		spin
		debug "Updating pnpm-lock.yaml"
		if [[ -n "$CI" ]]; then
			pnpm install --no-frozen-lockfile
		else
			pnpm install --silent
		fi
	else
		debug "Skipping pnpm-lock.yaml update because we were passed a list of packages"
	fi
fi

spinclear

if ! $UPDATE && [[ "$EXIT" != "0" ]]; then
	jetpackGreen 'You might use `tools/check-intra-monorepo-deps.sh -u` to fix these errors.'
fi

exit $EXIT

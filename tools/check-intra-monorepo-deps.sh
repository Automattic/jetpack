#!/usr/bin/env bash

set -eo pipefail

cd $(dirname "${BASH_SOURCE[0]}")/..
BASE=$PWD
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"
. "$BASE/tools/includes/changelogger.sh"
. "$BASE/tools/includes/alpha-tag.sh"

# Print help and exit.
function usage {
	cat <<-EOH
		usage: $0 [-a] [-n <name>] [-v] [-R] [-U|-u] [<slug> ...]

		Check that all composer and pnpm dependencies between monorepo projects are up to date.

		If \`-u\` is passed, update any that aren't and add changelogger change files
		for the updates.

		If \`-U\` is passed, update any that aren't but do not create a change file.

		If <slug> is passed, only that project is checked.

		Other options:
		 -a: Pass --filename-auto-suffix to changelogger (avoids "file already exists" errors).
		 -n: Set changelogger filename.
		 -v: Output debug information.
		 -R: When on a release branch, skip updating the corresponding plugins.
	EOH
	exit 1
}

# Sets options.
UPDATE=false
VERBOSE=false
DOCL_EVER=true
AUTO_SUFFIX=false
CL_FILENAME=
RELEASEBRANCH=false
while getopts ":uUvhHRan:" opt; do
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
		H|R)
			# -H is an old name, kept for back compat.
			RELEASEBRANCH=true
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

declare -A SKIPSLUGS
if $RELEASEBRANCH; then
	debug "Checking for release branch for -R"
	BRANCH="$(git symbolic-ref --short HEAD)"
	if [[ "$BRANCH" == */branch-* ]]; then
		for k in $(jq -r --arg prefix "${BRANCH%%/*}" '.extra["release-branch-prefix"] | if type == "array" then . else [ . ] end | if index( $prefix ) then input_filename | capture( "projects/(?<s>[^/]+/[^/]+)/composer.json" ).s else empty end' projects/*/*/composer.json); do
			debug "Release branch matches $k"
			SKIPSLUGS[$k]=$k
		done
		if [[ "${#SKIPSLUGS[@]}" -eq 0 ]]; then
			warn "-R was specified, but the current branch (\"$BRANCH\") does not appear to be a release branch for any monorepo plugin"
			RELEASEBRANCH=false
		else
			debug "Release branch matches ${SKIPSLUGS[*]}"
		fi
	else
		warn "-R was specified, but the current branch (\"$BRANCH\") does not appear to be a release branch"
		RELEASEBRANCH=false
	fi
fi

debug "Fetching PHP package versions"

function get_packages {
	local PKGS
	if [[ -z "$1" ]]; then
		PACKAGES='{}'
		PKGS=( "$BASE"/projects/packages/*/composer.json )
	elif [[ "$1" == packages/* ]]; then
		PKGS=( "$BASE"/projects/$1/composer.json )
	else
		PKGS=()
	fi
	if [[ "$PACKAGES" == '{}' && -n "$PACKAGE_VERSIONS_CACHE" && -s "$PACKAGE_VERSIONS_CACHE" ]]; then
		PACKAGES="$(<"$PACKAGE_VERSIONS_CACHE")"
	else
		for PKG in "${PKGS[@]}"; do
			PACKAGES=$(jq -c --argjson packages "$PACKAGES"  --arg ver "$(cd "${PKG%/composer.json}" && changelogger version current --default-first-version)" '.name as $k | $packages | .[$k] |= { rel: $ver, dep: ( "^" + $ver ) }' "$PKG")
		done
		if [[ -n "$PACKAGE_VERSIONS_CACHE" ]]; then
			echo "$PACKAGES" > "$PACKAGE_VERSIONS_CACHE"
		fi
	fi

	JSPACKAGES=$(jq -nc 'reduce inputs as $in ({}; if $in.name then .[$in.name] |= [ "workspace:*" ] else . end )' "$BASE"/projects/js-packages/*/package.json)
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
	function do_changelogger {
		local SLUG="$1"

		local OLDDIR=$PWD
		cd "$BASE/projects/$SLUG"

		local ARGS=( "$2" "$3" )
		if [[ -n "$CL_FILENAME" ]]; then
			ARGS+=( --filename="$CL_FILENAME" )
		fi
		if $AUTO_SUFFIX; then
			ARGS+=( --filename-auto-suffix )
		fi

		local CHANGES_DIR="$(jq -r '.extra.changelogger["changes-dir"] // "changelog"' composer.json)"
		if [[ -d "$CHANGES_DIR" && "$(ls -- "$CHANGES_DIR")" ]]; then
			changelogger_add "${ARGS[@]}"
		else
			changelogger_add "${ARGS[@]}"
			info "Updating version for $SLUG"
			local PRERELEASE=$(alpha_tag composer.json 0)
			local VER=$(changelogger version next --default-first-version --prerelease=$PRERELEASE) || { error "$VER"; EXIT=1; cd "$OLDDIR"; return; }
			"$BASE/tools/project-version.sh" -v -u "$VER" "$SLUG"
			get_packages "$SLUG"
		fi
		cd "$OLDDIR"
	}
fi

EXIT=0
ANYJS=false
SKIPPED=()
for SLUG in "${SLUGS[@]}"; do
	spin
	if [[ -n "${SKIPSLUGS[$SLUG]}" ]]; then
		debug "Skipping $SLUG, matches release branch"
		SKIPPED+=( "$SLUG" )
		continue
	fi
	debug "Checking dependencies of $SLUG"
	PACKAGES_CHECK_ALLOWED_SEL=
	PACKAGES_UPDATE_SEL='"@dev"'
	PACKAGES_CHECK_SEL='[ "@dev" ]'
	DOCL=false
	if [[ "$SLUG" == monorepo ]]; then
		DIR=.
	elif [[ "$SLUG" == nonproject:* ]]; then
		DIR="${SLUG#nonproject:}"
	else
		if [[ "$SLUG" == plugins/* ]]; then
			PACKAGES_UPDATE_SEL='( if e.value | endswith( "@dev" ) or endswith( "-dev" ) then "@dev" else $packages[e.key].dep end )'
			PACKAGES_CHECK_SEL='( if .value | endswith( "@dev" ) or endswith( "-dev" ) then [ "@dev" ] else [ $packages[.key].dep ] end )'
			PACKAGES_CHECK_ALLOWED_SEL='[ "@dev", $packages[.key].dep ]'
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
			JSON=$(jq --tab --argjson packages "$PACKAGES" -r 'def ver(e): if $packages[e.key] then '"$PACKAGES_UPDATE_SEL"' else e.value end; if .require then .require |= with_entries( .value = ver(.) ) else . end | if .["require-dev"] then .["require-dev"] |= with_entries( .value = ver(.) ) else . end' "$PHPFILE")
			if [[ "$JSON" != "$(<"$PHPFILE")" ]]; then
				info "PHP dependencies of $SLUG changed!"
				echo "$JSON" > "$PHPFILE"

				if $DOCL; then
					info "Creating changelog entry for $SLUG"
					do_changelogger "$SLUG" 'Updated package dependencies.'
					DOCL=false
				fi
			fi
		fi
		if [[ -e "$JSFILE" ]]; then
			JSON=$(jq --tab --argjson packages "$JSPACKAGES" -r 'def ver(e): if $packages[e.key] then $packages[e.key][0] else e.value end; def proc(k): if .[k] then .[k] |= with_entries( .value = ver(.) ) else . end; proc("dependencies") | proc("devDependencies") | proc("peerDependencies") | proc("optionalDependencies")' "$JSFILE")
			if [[ "$JSON" != "$(<"$JSFILE")" ]]; then
				info "JS dependencies of $SLUG changed!"
				echo "$JSON" > "$JSFILE"
				ANYJS=true

				if $DOCL; then
					info "Creating changelog entry for $SLUG"
					do_changelogger "$SLUG" 'Updated package dependencies.'
					DOCL=false
				fi
			fi
		fi
		if [[ -n "$(git -c core.quotepath=off ls-files "$DIR/composer.lock")" ]]; then
			PROJECTFOLDER="$BASE/$DIR"
			cd "$PROJECTFOLDER"
			debug "Updating $SLUG composer.lock"
			OLD="$(<composer.lock)"

			"$BASE/tools/composer-update-monorepo.sh" --quiet --no-audit "$PROJECTFOLDER"
			if [[ "$OLD" != "$(<composer.lock)" ]] && $DOCL; then
				info "Creating changelog entry for $SLUG composer.lock update"
				do_changelogger "$SLUG" '' 'Updated composer.lock.'
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
				jq --argjson packages "$PACKAGES" -r '.require // {}, .["require-dev"] // {} | to_entries[] | select( .value as $v | $packages[.key] and ( '"$PACKAGES_CHECK_SEL"' | index( $v ) == null ) ) | [ input_filename, .key, ( '"${PACKAGES_CHECK_ALLOWED_SEL:-$PACKAGES_CHECK_SEL}"' | join( " or " ) ) ] | @tsv' "$PHPFILE"
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

if $RELEASEBRANCH && [[ "${#SKIPPED[@]}" -gt 0 && "$EXIT" == "0" ]]; then
	jetpackGreen <<-EOF
		Due to use of \`-R\`, dependencies may not be fully updated. If you're doing a
		package release from a release branch, next steps are:
		 1. Commit the changes. Do not push yet.
		 2. Create a prerelease branch with this commit. Wait for CI to run, and verify
		    the new package versions are on Packagist.
		 3. Back on this release branch, update the release plugin's deps by running
		      tools/check-intra-monorepo-deps.sh -aU ${SKIPPED[*]}
		    then commit and push.
	EOF
fi

exit $EXIT

#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd $(dirname "${BASH_SOURCE[0]}")/.. && pwd)
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"
. "$BASE/tools/includes/alpha-tag.sh"
. "$BASE/tools/includes/changelogger.sh"
. "$BASE/tools/includes/proceed_p.sh"

# Print help and exit.
function usage {
	cat <<-EOH
		usage: $0 [-v] [-p] [-R] [-a|-b|-r <version>] <slug>

		Prepare a release of the specified project and everything it depends on.
		 - Run \`changelogger write\`
		 - Run \`tools/replace-next-version-tag.sh\`
		 - Run \`tools/project-version.sh\`

		Pass \`-p\` to add PR numbers to change entries by passing \`--add-pr-num\` to changelogger.
		Pass \`-a\` to prepare a developer release by passing \`--prerelease=a.N\` to changelogger.
		Pass \`-b\` to prepare a beta release by passing \`--prerelease=beta\` to changelogger.
		Pass \`-r <version>\` to prepare a release for a specific version number, passing \`--use-version=<version>\` to changelogger.
		Pass \`-R\` if doing a package release on a plugin release branch.
	EOH
	exit 1
}

if [[ $# -eq 0 ]]; then
	usage
fi

# Check whether it looks like a major version bump.
#
# 0.x -> 0.(x+1) also counts as major.
#
# @param $1 First version.
# @param $2 Second version.
# @return true if $1 >= $2, false otherwise.
function is_major_bump {
	if [[ "$1" == "$2" ]]; then
		return 0
	fi

	local V1="${1%%+*}" V2="${2%%+*}"

	local A=() B=() i

	IFS='.' read -r -a A <<<"${V1%%-*}"
	IFS='.' read -r -a B <<<"${V2%%-*}"

	while [[ ${#A[@]} -lt ${#B[@]} ]]; do
		A+=( 0 )
	done
	while [[ ${#B[@]} -lt ${#A[@]} ]]; do
		B+=( 0 )
	done

	[[ ${A[0]} -ne ${B[0]} || ${A[0]} -eq 0 && ${A[1]} -ne ${B[1]} ]]
}

# Sets options.
VERBOSE=
ADDPRNUM=
ALPHABETA=
RELEASEBRANCH=
while getopts ":vpabhHRr:" opt; do
	case ${opt} in
		v)
			if [[ -n "$VERBOSE" ]]; then
				VERBOSE="${VERBOSE}v"
			else
				VERBOSE="-v"
			fi
			;;
		p)
			ADDPRNUM="--add-pr-num"
			;;
		a)
			ALPHABETA=alpha
			;;
		b)
			ALPHABETA=beta
			;;
		r)
			ALPHABETA=$OPTARG
			;;
		H|R)
			# -H is an old name, kept for back compat.
			RELEASEBRANCH=-R
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

if [[ -z "$VERBOSE" ]]; then
	function debug {
		:
	}
fi

# Determine the project
[[ -z "$1" ]] && die "A project slug must be specified."
[[ $# -gt 1 ]] && die "Only one project slug must be specified, got:$(printf ' "%s"' "$@")"$'\n'"(note all options must come before the project slug)"
REL_SLUG="${1#projects/}" # DWIM
REL_SLUG="${REL_SLUG%/}" # Sanitize
if [[ ! -e "$BASE/projects/$REL_SLUG/composer.json" ]]; then
	die "Project $REL_SLUG does not exist."
fi

cd "$BASE"
init_changelogger

# Check if the project being released has any changes.
cd "$BASE/projects/$REL_SLUG"
CHANGES_DIR="$(jq -r '.extra.changelogger["changes-dir"] // "changelog"' composer.json)"
if [[ ! -d "$CHANGES_DIR" || -z "$(ls -- "$CHANGES_DIR")" ]]; then
	proceed_p "Project $SLUG has no changes." 'Do a release anyway?'
	changelogger_add 'Internal updates.' '' --filename=force-a-release
fi

cd "$BASE"

DEPTS=$( pnpm jetpack dependencies json | jq 'reduce to_entries[] as $e ({}; .[$e.value[]] |= ( . // [] ) + [ $e.key ] )' )

TO_RELEASE=()
# Use a temp variable so pipefail works
TMP="$(pnpm jetpack dependencies build-order --add-dependencies --pretty "$REL_SLUG")"
mapfile -t TO_RELEASE <<<"$TMP"

# If it's being released as a dependency (and is not a js-package), pre-check that it has a mirror repo set up.
# Can't do the release without one.
ANY=false
for SLUG in "${TO_RELEASE[@]}"; do
	if [[ "$SLUG" != "$REL_SLUG" && "$SLUG" != js-packages/* ]] &&
		! jq -e '.extra["mirror-repo"] // null' "$BASE/projects/$SLUG/composer.json" > /dev/null
	then
		error "Cannot release $SLUG as it has no mirror repo configured!"
		ANY=true
	fi
done
if $ANY; then
	info "See https://github.com/Automattic/jetpack/blob/trunk/docs/monorepo.md#mirror-repositories for details."
	exit 1
fi

# Release the projects, in build order so we can force a release of something if one of its deps got updated.
declare -A RELEASED
for SLUG in "${TO_RELEASE[@]}"; do
	cd "$BASE/projects/$SLUG"

	CHANGES_DIR=$(jq -r '.extra.changelogger["changes-dir"] // "changelog"' composer.json)
	if [[ ! -d "$CHANGES_DIR" || -z "$(ls -- "$CHANGES_DIR")" ]]; then
		debug "Project $SLUG has no changes, skipping."
		continue
	fi

	info "Processing $SLUG..."
	RELEASED[$SLUG]=1

	# Avoid "There are no changes with content for this write. Proceed?" prompts and empty changelog entries.
	ANY=false
	for f in "$CHANGES_DIR"/*; do
		if [[ -n $( sed -n -e '/^$/,$ { /[^ \t]/ p; }' "$f" ) ]]; then
			ANY=true
			break
		fi
	done
	if ! $ANY; then
		debug "  no changes with content, adding one"
		changelogger_add 'Internal updates.' '' --filename=avoid-empty-changelog-entry
	fi

	# Fetch old version from changelogger.
	debug "  changelogger version current (for old version)"
	if ! OLDVER=$( changelogger version current 2>/dev/null ); then
		OLDVER=''
	fi

	# Changelogger write.
	ARGS=( write )
	if [[ -n "$VERBOSE" ]]; then
		ARGS+=( "$VERBOSE" )
	fi
	if [[ -n "$ADDPRNUM" ]]; then
		ARGS+=( "$ADDPRNUM" )
	fi
	ARGS+=( "--default-first-version" )
	if [[ "$SLUG" == "$REL_SLUG" ]]; then
		if [[ "$ALPHABETA" == "alpha" ]]; then
			P=$(alpha_tag composer.json 1)
			[[ "$P" == "alpha" ]] && die "Cannot use -a with $SLUG"
			ARGS+=( "--prerelease=$P" )
		elif [[ "$ALPHABETA" == "beta" ]]; then
			ARGS+=( "--prerelease=beta" )
		elif [[ -n "$ALPHABETA" ]]; then
			ARGS+=( "--use-version=$ALPHABETA" )
		fi
	fi
	debug "  changelogger ${ARGS[*]}"
	changelogger "${ARGS[@]}"

	# Fetch new version from changelogger.
	debug "  changelogger version current"
	VER=$(changelogger version current)

	# If this looks like a major release, flag to force updates of any dependents.
	if [[ -z "$OLDVER" ]] || is_major_bump "$OLDVER" "$VER"; then
		debug "  Version bump ${OLDVER:-none} -> $VER looks like a major bump, adding a change entry to dependents without one"
		for S in $( jq -r --arg slug "$SLUG" '.[$slug] // empty | .[]' <<<"$DEPTS" ); do
			cd "$BASE/projects/$S"
			CHANGES_DIR=$(jq -r '.extra.changelogger["changes-dir"] // "changelog"' composer.json)
			if [[ ! -d "$CHANGES_DIR" || -z "$(ls -- "$CHANGES_DIR")" ]]; then
				debug "    $S"
				changelogger_add 'Update dependencies.' '' --filename=force-a-release
			fi
		done
		cd "$BASE/projects/$SLUG"
	fi

	# Replace $$next-version$$
	"$BASE"/tools/replace-next-version-tag.sh "$SLUG" "$(sed -E -e 's/-(beta|a\.[0-9]+)$//' <<<"$VER")"

	# Update versions.
	ARGS=()
	if [[ -n "$VERBOSE" ]]; then
		ARGS+=( "$VERBOSE" )
	fi
	ARGS+=( "-u" "$VER" "$SLUG" )
	debug "  tools/project-version.sh ${ARGS[*]}"
	"$BASE"/tools/project-version.sh "${ARGS[@]}"

	debug "Done processing $SLUG!"
done

cd "$BASE"
info "Updating dependencies..."
SLUGS=()
# Use a temp variable so pipefail works
TMP="$(pnpm jetpack dependencies build-order --pretty)"
mapfile -t SLUGS <<<"$TMP"

TMPDIR="${TMPDIR:-/tmp}"
TEMP=$(mktemp "${TMPDIR%/}/changelogger-release-XXXXXXXX")

for DEPENDENCY_SLUG in "${SLUGS[@]}"; do
	if [[ -n "${RELEASED[$DEPENDENCY_SLUG]}" ]]; then
		debug "  tools/check-intra-monorepo-deps.sh $VERBOSE $RELEASEBRANCH -U $DEPENDENCY_SLUG"
		PACKAGE_VERSIONS_CACHE="$TEMP" tools/check-intra-monorepo-deps.sh $VERBOSE $RELEASEBRANCH -U "$DEPENDENCY_SLUG"
	else
		debug "  tools/check-intra-monorepo-deps.sh $VERBOSE $RELEASEBRANCH -u $DEPENDENCY_SLUG"
		PACKAGE_VERSIONS_CACHE="$TEMP" tools/check-intra-monorepo-deps.sh $VERBOSE $RELEASEBRANCH -u "$DEPENDENCY_SLUG"
	fi
done

rm "$TEMP"

debug "  Updating pnpm.lock..."
pnpm install --silent

cat <<-EOM

	You can examine the changelogs with

	  git diff '**/CHANGELOG.md'

	Feel free to edit them as needed.

EOM

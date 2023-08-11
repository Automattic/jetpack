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
SLUG="${1#projects/}" # DWIM
SLUG="${SLUG%/}" # Sanitize
if [[ ! -e "$BASE/projects/$SLUG/composer.json" ]]; then
	die "Project $SLUG does not exist."
fi

cd "$BASE"
init_changelogger

DEPS="$(pnpm jetpack dependencies json)"
declare -A RELEASED

# Release a project
#  - $1: Project slug.
#  - $2: Alpha/Beta flag.
#  - $3: Project that depended on this project.
#  - $4: Indent.
function releaseProject {
	local SLUG="$1"
	local ALPHABETA="$2"
	local FROM="$3"
	local I="$4"

	cd "$BASE/projects/$SLUG"

	# If it's being depended on by something (and not a js-package), check that it has a mirror repo set up.
	# Can't do the release without one.
	if [[ -n "$FROM" && "$SLUG" != js-packages/* ]] &&
		! jq -e '.extra["mirror-repo"] // null' composer.json > /dev/null
	then
		error "${I}Cannot release $SLUG as it has no mirror repo configured!"
		info "${I}See https://github.com/Automattic/jetpack/blob/trunk/docs/monorepo.md#mirror-repositories for details."
		exit 1
	fi

	local CHANGES_DIR="$(jq -r '.extra.changelogger["changes-dir"] // "changelog"' composer.json)"
	if [[ ! -d "$CHANGES_DIR" || -z "$(ls -- "$CHANGES_DIR")" ]]; then
		if [[ -z "$FROM" ]]; then
			proceed_p "Project $SLUG has no changes." 'Do a release anyway?' || return
			changelogger_add 'Internal updates.' '' --filename=force-a-release
		else
			debug "${I}Project $SLUG has no changes, skipping."
			return
		fi
	fi

	info "${I}Processing $SLUG..."
	RELEASED[$SLUG]=1

	# Changelogger write.
	local ARGS=( write )
	if [[ -n "$VERBOSE" ]]; then
		ARGS+=( "$VERBOSE" )
	fi
	if [[ -n "$ADDPRNUM" ]]; then
		ARGS+=( "$ADDPRNUM" )
	fi
	ARGS+=( "--default-first-version" )
	if [[ "$ALPHABETA" == "alpha" ]]; then
		local P=$(alpha_tag composer.json 1)
		[[ "$P" == "alpha" ]] && die "Cannot use -a with $SLUG"
		ARGS+=( "--prerelease=$P" )
	elif [[ "$ALPHABETA" == "beta" ]]; then
		ARGS+=( "--prerelease=beta" )
	elif [[ -n "$ALPHABETA" ]]; then
		ARGS+=( "--use-version=$ALPHABETA" )
	fi
	debug "${I}  changelogger ${ARGS[*]}"
	changelogger "${ARGS[@]}"

	# Fetch version from changelogger.
	debug "${I}  changelogger version current"
	local VER=$(changelogger version current)

	# Replace $$next-version$$
	"$BASE"/tools/replace-next-version-tag.sh "$SLUG" "$(sed -E -e 's/-(beta|a\.[0-9]+)$//' <<<"$VER")"

	# Update versions.
	ARGS=()
	if [[ -n "$VERBOSE" ]]; then
		ARGS+=( "$VERBOSE" )
	fi
	ARGS+=( "-u" "$VER" "$SLUG" )
	debug "${I}  tools/project-version.sh ${ARGS[*]}"
	"$BASE"/tools/project-version.sh "${ARGS[@]}"

	# Release deps.
	debug "${I}  Processing dependencies..."
	for D in $(jq --argjson deps "$DEPS" --arg slug "$SLUG" -nr '$deps[$slug] // [] | .[]'); do
		releaseProject "$D" "" "$SLUG" "$I  "
	done

	debug "${I}Done processing $SLUG!"
}

releaseProject "$SLUG" "$ALPHABETA"

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

	Feel free to edit them as needed. Then commit and push those changes.

EOM

if [[ "$SLUG" == plugins/* ]]; then
	cd "$BASE"
	VER=$(cd "projects/$SLUG" && changelogger version current)
	if [[ -n "$VER" ]]; then
		cat <<-EOM
			When ready, you can create the release branch with

			  tools/create-release-branch.sh $SLUG ${VER%-beta}

		EOM
	fi
fi

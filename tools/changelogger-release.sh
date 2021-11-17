#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd $(dirname "${BASH_SOURCE[0]}")/.. && pwd)
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"
. "$BASE/tools/includes/alpha-tag.sh"

# Print help and exit.
function usage {
	cat <<-EOH
		usage: $0 [-v] [-a|-b] <slug>

		Prepare a release of the specified project and everything it depends on.
		 - Run \`changelogger write\`
		 - Run \`tools/replace-next-version-tag.sh\`
		 - Run \`tools/project-version.sh\`

		Pass \`-a\` to prepare a developer release by passing \`--prerelease=a.N\` to changelogger.
		Pass \`-b\` to prepare a beta release by passing \`--prerelease=beta\` to changelogger.
	EOH
	exit 1
}

if [[ $# -eq 0 ]]; then
	usage
fi

# Sets options.
VERBOSE=
ALPHABETA=
while getopts ":vabh" opt; do
	case ${opt} in
		v)
			if [[ -n "$VERBOSE" ]]; then
				VERBOSE="${VERBOSE}v"
			else
				VERBOSE="-v"
			fi
			;;
		a)
			ALPHABETA=alpha
			;;
		b)
			ALPHABETA=beta
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
SLUG="${1#projects/}" # DWIM
SLUG="${SLUG%/}" # Sanitize
if [[ ! -e "$BASE/projects/$SLUG/composer.json" ]]; then
	die "Project $SLUG does not exist."
fi

cd "$BASE"
pnpx jetpack install --all

DEPS="$(tools/find-project-deps.php)"
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
	local CHANGES_DIR="$(jq -r '.extra.changelogger["changes-dir"] // "changelog"' composer.json)"
	if [[ ! -d "$CHANGES_DIR" || -z "$(ls -- "$CHANGES_DIR")" ]]; then
		if [[ -z "$FROM" ]]; then
			info "Project $SLUG has no changes, skipping."
		else
			debug "${I}Project $SLUG has no changes, skipping."
		fi
		return
	fi

	info "${I}Processing $SLUG..."
	RELEASED[$SLUG]=1

	# Find changelogger.
	local CL
	if [[ -x vendor/bin/changelogger ]]; then
		CL=vendor/bin/changelogger
	else
		yellow "${I}No changelogger! Skipping."
		return
	fi

	# Changelogger write.
	local ARGS=( write )
	if [[ -n "$VERBOSE" ]]; then
		ARGS+=( "$VERBOSE" )
	fi
	ARGS+=( "--default-first-version" )
	if [[ "$ALPHABETA" == "alpha" ]]; then
		local P=$(alpha_tag "$CL" composer.json 1)
		[[ "$P" == "alpha" ]] && die "Cannot use -a with $SLUG"
		ARGS+=( "--prerelease=$P" )
	elif [[ "$ALPHABETA" == "beta" ]]; then
		ARGS+=( "--prerelease=beta" )
	fi
	debug "${I}  $CL ${ARGS[*]}"
	$CL "${ARGS[@]}"

	# Fetch version from changelogger.
	debug "${I}  $CL version current"
	local VER=$($CL version current)

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
TMP="$(tools/get-build-order.php 2>/dev/null)"
TMP=monorepo$'\n'"$TMP"
mapfile -t SLUGS <<<"$TMP"
for SLUG in "${SLUGS[@]}"; do
	if [[ -n "${RELEASED[$SLUG]}" ]]; then
		debug "  tools/check-intra-monorepo-deps.sh $VERBOSE -U $SLUG"
		tools/check-intra-monorepo-deps.sh $VERBOSE -U "$SLUG"
	else
		debug "  tools/check-intra-monorepo-deps.sh $VERBOSE -u $SLUG"
		tools/check-intra-monorepo-deps.sh $VERBOSE -u "$SLUG"
	fi
done

cat <<-EOM

	You can examine the changelogs with

	  git diff '**/CHANGELOG.md'

	Feel free to edit them as needed. Then commit and push a PR, and have it merged.

EOM

if [[ "$SLUG" == plugins/* ]]; then
	cd "$BASE"
	VER=
	if [[ -x "projects/$SLUG/vendor/bin/changelogger" ]]; then
		VER=$(cd "projects/$SLUG" && vendor/bin/changelogger version current)
	fi
	if [[ -n "$VER" ]]; then
		cat <<-EOM
			When ready, you can create the release branch with

			  tools/create-release-branch.sh $SLUG ${VER%-beta}

		EOM
	fi
fi

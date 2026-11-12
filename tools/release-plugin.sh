#!/usr/bin/env bash
# shellcheck disable=SC1091

set -eo pipefail

BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"
. "$BASE/tools/includes/proceed_p.sh"
. "$BASE/tools/includes/plugin-functions.sh"
. "$BASE/tools/includes/version-compare.sh"
. "$BASE/tools/includes/normalize-version.sh"
. "$BASE/tools/includes/changelogger.sh"
. "$BASE/tools/includes/send_tracks_event.sh"

VERSION_REGEX='^[0-9]+(\.[0-9]+)+(-.*)?$'
CUR_STEP=0
FROM_RELEASE_BRANCH=false
LIST_STEPS=false

RELEASE_STEPS=(
	'do_prerelease_branch_prep'
	'do_changelogs'
	'do_readme'
	'do_push_and_build'
	'do_packagist_check'
	'do_create_release_branches'
	'do_create_prerelease_PR'
	'do_final_instructions'
)

FROM_RELEASE_BRANCH_STEPS=(
	'do_create_release_branch_from_release_branch'
	'do_apply_patches'
	'do_changelogs'
	'do_readme'
	'do_prerelease_branch_prep'
	# 'do_push_and_build'
	# 'do_packagist_check'
	# 'do_push_release_branch'
	# 'do_create_backport_PR'
)

# Instructions
function usage {
	cat <<-EOH
		Usage:
		    $0 [-R] [-s <step>] <plugin> [<version>]

		Options:
		    -h, --help                 Show this help message.
		    -R, --from-release-branch  Release from an existing release branch.
		    -s <step>, --step <step>   Start at a given step.
		    <plugin>                   Plugin name to release (e.g. jetpack)
		    <version>                  Version number (defaults to next stable)

		Conduct a full release of specified plugins through release branch creation.
		Accepts the plugin name without a prefix, such as 'jetpack' or 'backup'. The
		version is optional; if not specified it will be set to the next stable version.

	EOH
	exit 1
}

handle_exit() {
	local exit_code=$?
	local PAYLOAD
	PAYLOAD="$(
		jq -n \
			--arg exit_code "$exit_code" \
			--arg step "$CUR_STEP" \
			'{"exit_code": $exit_code, "step": $step }'
	)"
	send_tracks_event "jetpack_release_exit" "$PAYLOAD"
}

# Preliminary environment checks.
function preflight_checks {
	# Make sure the GitHub CLI is installed.
	if ! command -v gh &> /dev/null; then
		yellow "This tool requires the GitHub CLI, which was not found."
		if command -v brew &> /dev/null; then
			proceed_p "Install the GitHub CLI via brew?" "" Y
			brew install gh || die 'Unable to install gh!'
		else
			die "Please install the GitHub CLI before proceeding"
		fi
	fi

	GH_VER="$( gh --version | grep -E -o -m1 '[0-9]+\.[0-9]+\.[0-9]+' )"
	if ! version_compare "$GH_VER" "2.21.2"; then
		command -v brew &> /dev/null && WITH=" with 'brew upgrade gh'" || WITH=
		die "Your version of the GH CLI is out of date. Please upgrade your version$WITH and start again"
	fi

	# Make sure we're signed into the GitHub CLI.
	if ! gh auth status --hostname github.com &> /dev/null; then
		yellow "You are not signed into the GitHub CLI."
		proceed_p "Sign in to the GitHub CLI?" "" Y
		gh auth login || die 'Failed to log in!'
	fi
}

function verify_on_branch {
	[[ $(git branch --show-current) != "$1" ]] && die "Not on $1 branch!"
	return 0
}

# Find the existing release branch on which to base the new release.
# On a normal run, it'll return `trunk`.
# On a -R run, it'll detect the branch to start from. For example:
#  - 16.4.X: jetpack/branch-16.4.W or jetpack/branch-16.4
#  - 16.4: jetpack/branch-16.4-beta.X or jetpack/branch-16.4-beta
#  - 16.4-beta.X: jetpack/branch-16.4-beta.W or jetpack/branch-16.4-beta
#  - 16.4-a.x: trunk
#
# Uses FROM_RELEASE_BRANCH, PLUGIN, and VERSION, and sets BASE_BRANCH.
# @todo: Consider if it's easy or even worth supporting semver.
function find_base_branch {
	local prefix stable suffix potential_base_branch branch_ver
	if ! $FROM_RELEASE_BRANCH; then
		BASE_BRANCH=trunk
		return
	fi
	prefix=$(jq -r '.extra["release-branch-prefix"] | if type == "array" then first else . end' "$BASE/projects/$PLUGIN/composer.json")
	stable=$(grep -oE '^[0-9]+\.[0-9]+' <<<"$VERSION")
	# We only fetch the subset of branches needed, as no one sort order fits both: branch-x.y must sort below
	# x.y-beta.N for stable and beta releases, but above it for point releases.
	if [[ ${VERSION%%-*} == "$stable" ]]; then
		suffix='-beta'
	else
		suffix='.'
	fi
	BASE_BRANCH=
	while read -r potential_base_branch; do
		branch_ver=${potential_base_branch#"$prefix/branch-"}
		if ! version_compare "$branch_ver" "$VERSION"; then
			BASE_BRANCH=$potential_base_branch
			break
		fi
	done < <(git ls-remote --heads origin "refs/heads/$prefix/branch-$stable" "refs/heads/$prefix/branch-$stable$suffix*" | sed 's|.*refs/heads/||' | sort -rV)
	[[ -n $BASE_BRANCH ]] || die "No release branch found for $PLUGIN $VERSION."
	echo "Found base release branch: $BASE_BRANCH"
}

function normalize_plugin_name {
	SLUG="$1"

	# Normalize slug
	SLUG="${SLUG#projects/}" # Remove leading 'projects/'
	SLUG="${SLUG#plugins/}" # Remove leading 'plugins/'
	SLUG="${SLUG%/}" # Remove trailing slash
	SLUG="plugins/$SLUG" # Add leading 'plugins/'
	if [[ ! -e "$BASE/projects/$SLUG/composer.json" ]]; then
		die "$SLUG isn't a valid project!"
	elif ! jq -e '.extra["release-branch-prefix"]' "$BASE/projects/$SLUG/composer.json" &>/dev/null; then
		die "$SLUG has no release branch prefix!"
	fi
	echo "$SLUG"
}

function current_version {
	process_plugin_arg "$PLUGIN"
	git show "origin/$BASE_BRANCH:${PLUGIN_FILE#"$BASE/"}" | sed -n -E 's/^ \* Version:[[:blank:]]+([^[:blank:]](.*[^[:blank:]])?)[[:blank:]]*$/\1/p'
}

# Generates a command that can be used to resume the release script from the current step.
# Currently unused.
function generate_resume_command() {
	local cmd="$0 -s $CUR_STEP"
	for PLUGIN in "${!PROJECTS[@]}"; do
		cmd+=" ${PLUGIN#plugins/} ${PROJECTS[$PLUGIN]}"
	done
	echo "$cmd"
}

# Create the prerelease branch from the local release branch with -R, else from origin/trunk.
function do_prerelease_branch_prep() {
	if [[ -n "$(git status --porcelain)" ]]; then
		die "Working directory not clean, make sure you're working from a clean checkout and try again."
	fi

	yellow "Checking out prerelease branch."
	# Is there an upstream prerelease branch already?
	R=$( git ls-remote --heads origin prerelease )
	if [[ -n "$R" ]]; then
		error "There's an existing prerelease branch on GitHub!"
		R=${R%%[ $'\t']*}
		TMP=$( gh pr list --head=prerelease --state=open --json number,author,url,createdAt,title --jq '.[] | "\( .url ) - \( .createdAt | fromdateiso8601 | strftime( "%F %H:%IZ" ) ) - \( .title ) [\( .author.name )]"' )
		if [[ -n "$TMP" ]]; then
			echo "Someone probably needs to merge the following PR:"
			echo "$TMP"
			exit 1
		fi
		git fetch -q origin trunk "$R" || die "Something unexpected went wrong fetching the commit from GitHub"
		if git diff --quiet origin/trunk..."$R"; then
			echo "There don't seem to be any changes between that and trunk. If its author has abandoned the release it should be safe to delete the branch."
			exit 1
		fi
		if ! git diff --quiet origin/trunk..."$R" '*/CHANGELOG.md'; then
			echo "Looks like someone is in the middle of a release! Wait for them to merge the changes back into trunk."
			exit 1
		fi
		echo "Looks like someone may be in the middle of a release! Wait for them to merge the changes back into trunk, or to abandon the release."
		exit 1
	fi

	# Check out and push pre-release branch
	if git rev-parse --verify prerelease &>/dev/null; then
		proceed_p "Existing local prerelease branch found." "Delete it?" Y
		git branch -D prerelease
	fi

	if $FROM_RELEASE_BRANCH; then
		git checkout --no-track -b prerelease "$RELEASE_BRANCH"
	else
		git fetch origin "$BASE_BRANCH"
		git checkout --no-track -b prerelease "origin/$BASE_BRANCH"
	fi
	yellow "Installing root packages."
	pnpm jetpack install --root
	# @todo: Push once we're ready to test more lively.
	$FROM_RELEASE_BRANCH && return
	if ! git push -u origin HEAD; then
		send_tracks_event "jetpack_release_prerelease_push" '{"result": "failure"}'
		die "Branch push failed. Check #jetpack-releases and make sure no one is doing a release already, then delete the branch at https://github.com/Automattic/jetpack/branches"
	fi
	send_tracks_event "jetpack_release_prerelease_push" '{"result": "success"}'
}

function do_create_release_branch_from_release_branch {
	if [[ -n "$(git status --porcelain)" ]]; then
		die "Working directory not clean, make sure you're working from a clean checkout and try again."
	fi
	if [[ -n "$(git ls-remote --heads origin "$RELEASE_BRANCH")" ]]; then
		die "Release branch $RELEASE_BRANCH already exists on GitHub."
	fi
	if git rev-parse --verify "refs/heads/$RELEASE_BRANCH" &>/dev/null; then
		proceed_p "Existing local $RELEASE_BRANCH branch found." "Delete it?" Y
		git branch -D "$RELEASE_BRANCH"
	fi

	git checkout --no-track -b "$RELEASE_BRANCH" "origin/$BASE_BRANCH"
	yellow "Installing root packages."
	pnpm jetpack install --root
}

# Prompt for PRs or commits to apply, committing each.
function do_apply_patches {
	verify_on_branch "$RELEASE_BRANCH"

	local pr_or_commit commits

	START_COMMIT=$(git rev-parse HEAD)
	while true; do
		read -rep "PR or commit to cherry-pick, or 'done' if finished: " pr_or_commit
		[[ $pr_or_commit == "done" ]] && break
		[[ -n $pr_or_commit ]] || continue

		# Abort if a failure left changes behind (e.g. an aborted commit).
		if ! "$BASE/tools/apply-patch.sh" "$pr_or_commit" && [[ -n $(git status --porcelain) ]]; then
			exit 1
		fi
	done

	commits=$(git log --reverse --format='  %h %s' "$START_COMMIT..HEAD")
	echo 'Commits added:'
	echo "${commits:-  (none)}"

	# Add changelogs for any projects that need them.
	pnpm jetpack changelog add
}

function do_changelogs {
	verify_on_branch "${RELEASE_BRANCH:-prerelease}"
	# Loop through the projects and update the changelogs after building the arguments.
	for PLUGIN in "${!PROJECTS[@]}"; do
		yellow "Updating the changelog files for $PLUGIN."

		# Add the PR numbers to the changelog.
		ARGS=('-p')

		# Add alpha and beta flags.
		VERSION="${PROJECTS[$PLUGIN]}"
		case $VERSION in
			*-a* ) ARGS+=('-a');;
			*-beta ) ARGS+=('-b');;
		esac

		# Explicitly pass the version number we want so there are no surprises.
		ARGS+=( '-r' "${PROJECTS[$PLUGIN]}" )
		ARGS+=("$PLUGIN");
		if $FROM_RELEASE_BRANCH; then
			tools/changelogger-release.sh -R "${ARGS[@]}"
		else
			tools/changelogger-release.sh "${ARGS[@]}"
		fi
	done

	git add --all
	git commit -m "Aggregate raw changelogs and bump versions"

	# When it completes, wait for user to edit anything they want, then push key to continue.
	read -r -s -p $'Edit and save all the changelog entries you want in a separate terminal or in your text editor of choice.\nCheck for consistency between the different entries, and keep in mind that your plugin changelog will be used in the plugin readme file.\n\nOnce you are happy with your work, press enter to continue the release process.'
	echo ""

	if ! git diff --quiet; then
		git commit -am "Edit changelogs"
	fi
}

function do_readme {
	verify_on_branch "${RELEASE_BRANCH:-prerelease}"
	for PLUGIN in "${!PROJECTS[@]}"; do
		# check if the plugin even has a readme.txt file.
		if [[ ! -e "$BASE/projects/$PLUGIN/readme.txt" ]]; then
			yellow "$PLUGIN has no readme.txt file, skipping."
			continue
		fi
		yellow "Updating the readme.txt file for $PLUGIN."
		ARGS=()
		# Add alpha and beta flags.
		VERSION="${PROJECTS[$PLUGIN]}"
		case $VERSION in
			*-a* ) ARGS+=('-a');;
			*-beta ) ARGS+=('-b');;
			* ) ARGS+=('-s');;
		esac
		pnpm jetpack release "$PLUGIN" readme "${ARGS[@]}"
	done

	# If we're releasing Jetpack and it's a beta, amend the readme.txt
	if [[ -v PROJECTS["plugins/jetpack"] && "${PROJECTS[plugins/jetpack]}" == *-beta ]]; then
		yellow "Releasing a beta for Jetpack, amending the readme.txt"
		pnpm jetpack changelog squash plugins/jetpack readme
	fi

	if ! git diff --quiet; then
		git commit -am "Update readme.txt"
	fi
}

function do_push_and_build {
	verify_on_branch prerelease
	HEADSHA=$(git rev-parse HEAD)
	yellow "Pushing changes."
	git push -u origin prerelease

	yellow "Waiting for build to complete and push to mirror repos"
	BUILDID=

	# If the build ID doesn't exist, try every five seconds until timeout after a minute.
	TIMEOUT=$((SECONDS+60))
	while [[ $SECONDS -lt $TIMEOUT &&  -z "$BUILDID" ]]; do
		echo "Waiting for build to become available..."
		sleep 5
		BUILDID="$( gh run list -b prerelease -w Build --json event,databaseId,headSha | jq --arg HEADSHA "$HEADSHA" '.[] | select(.event=="push" and .headSha==$HEADSHA) | .databaseId' )"
	done

	if [[ -z "$BUILDID" ]]; then
		send_tracks_event "jetpack_release_github_build" '{"result": "not_found"}'
		die "Build ID not found. Check GitHub actions to see if build on prerelease branch is running, then continue with manual steps."
	fi

	yellow "Build ID found, waiting for build to complete and push to mirror repos."
	if ! gh run watch "${BUILDID[0]}" --exit-status; then
		send_tracks_event "jetpack_release_github_build" '{"result": "failure"}'
		die "Build failed! Check for build errors on GitHub for more information."
	fi

	send_tracks_event "jetpack_release_github_build" '{"result": "success"}'
	yellow "Build is complete."
}

function do_packagist_check {
	verify_on_branch prerelease
	# Wait for new versions of any composer packages to be up.
	# We expect a new version when (1) the package is touched in this release and (2) it has no change entry files remaining.
	POLL_ARGS=()
	cd "$BASE"
	GITBASE=$(git merge-base "origin/$BASE_BRANCH" HEAD)
	for PKGDIR in $(git -c core.quotepath=off diff --name-only "$GITBASE..HEAD" projects/packages/ | sed 's!^\(projects/packages/[^/]*\)/.*!\1!' | sort -u); do
		cd "$BASE/$PKGDIR"
		CHANGES_DIR=$(jq -r '.extra.changelogger["changes-dir"] // "changelog"' composer.json)
		if [[ ! -d "$CHANGES_DIR" || -z "$(ls -- "$CHANGES_DIR")" ]] && jq -e '.extra["mirror-repo"] // null' composer.json &>/dev/null; then
			POLL_ARGS+=( "$( jq -r .name composer.json )=$( changelogger version current )" )
		fi
	done
	cd "$BASE"
	if [[ ${#POLL_ARGS[@]} -gt 0 ]]; then
		yellow "Waiting for packagist to get updated packages..."
		tools/js-tools/await-packagist-updates.mjs "${POLL_ARGS[@]}"
		yellow "Packagist is updated!"
	fi
}

function do_push_release_branch {
	yellow "Pushing release branch $RELEASE_BRANCH."
	git push -u origin "$RELEASE_BRANCH"
}

function do_create_release_branches {
	# Run tools/create-release-branch.sh to create a release branch for each project.
	for PREFIX in "${PREFIXES[@]}"; do
		git checkout prerelease
		PROJECT=$(jq -r --arg prefix "$PREFIX" '.[$prefix] | if length == 1 then "plugins/\(first)" else empty end' <<<"$PREFIXDATA")
		if [[ -n "$PROJECT" && -n "${PROJECTS[$PROJECT]}" ]]; then
			VERSION="${PROJECTS[$PROJECT]}"
			yellow "Creating release branch for $PROJECT $VERSION"
			tools/create-release-branch.sh "$PROJECT" "$VERSION"
		else
			yellow "Creating release branch for $PREFIX"
			tools/create-release-branch.sh "$PREFIX"
		fi
	done

	yellow "Release branches created!"
}

function do_create_prerelease_PR {
	yellow "Creating a PR to merge the prerelease branch into trunk."
	git checkout prerelease

	# Handle any package changes merged into trunk while we were working.
	git fetch
	git merge origin/trunk
	tools/fixup-project-versions.sh
	if [[ -n "$(git status --porcelain)" ]]; then
		git commit -am 'Version bumps'
	fi
	git push
	PLUGINS_CHANGED=
	for PLUGIN in "${!PROJECTS[@]}"; do
		PLUGINS_CHANGED+="$(basename "$PLUGIN") ${PROJECTS[$PLUGIN]}, "

		# If the plugin has a readme.txt, update its stable tag to the release version.
		README_FILE="$BASE/projects/$PLUGIN/readme.txt"
		if [[ -f "$README_FILE" ]]; then
			sed -i.bak -e "s/^Stable tag: .*/Stable tag: ${PROJECTS[$PLUGIN]}/" "$README_FILE"
			rm -f "$README_FILE.bak"
		fi
	done

	if [[ -n "$(git status --porcelain)" ]]; then
		git commit -am 'Update stable tag in readme.txt'
	fi
	git push

	# Remove the trailing comma and space
	PLUGINS_CHANGED=${PLUGINS_CHANGED%, }
	sed "s/%RELEASED_PLUGINS%/$PLUGINS_CHANGED/g" .github/files/BACKPORT_RELEASE_CHANGES.md > .github/files/TEMP_BACKPORT_RELEASE_CHANGES.md
	gh pr create --title "Backport $PLUGINS_CHANGED changes" --body "$(cat .github/files/TEMP_BACKPORT_RELEASE_CHANGES.md)" --label "[Status] Needs Review" --label "[Type] Janitorial" --repo "Automattic/jetpack" --head "$(git rev-parse --abbrev-ref HEAD)"
	rm .github/files/TEMP_BACKPORT_RELEASE_CHANGES.md
}

# @todo: Implement. Prints what's needed until then.
function do_create_backport_PR {
	cat <<-EOF
		The changes on $RELEASE_BRANCH still needs backporting to trunk:
		  1. Verify prerelease matches $RELEASE_BRANCH, then delete it remotely and locally. Otherwise stop.
		  2. Create a new prerelease branch from origin/trunk.
		  3. Cherry-pick the patch commits from $RELEASE_BRANCH onto it, skipping the changelog and readme
		     commits. Patches already in trunk drop out as empty.
		  4. Bring over the changelog changes, without changing any versions:
		     - For the plugin and packages released normally, copy the new CHANGELOG.md files from
		       $RELEASE_BRANCH and delete the change files they came from.
		     - For packages released with a four-point version, add no entry and leave their change files.
		     - Maybe update the readme.txt stable tag.
		  5. Run tools/fixup-project-versions.sh and commit any changes.
		  6. Push, and open a PR to merge prerelease into trunk.
	EOF
}

function do_final_instructions {
	yellow "Release script complete!"

	echo ''
	echo 'Backport the changes into trunk by reviewing and merging the above PR.'

	AUTO=()
	MANUALPUB=()
	for PLUGIN in "${!PROJECTS[@]}"; do
		F="$BASE/projects/$PLUGIN/composer.json"
		if ! jq -e '.extra["mirror-repo"] // false' "$F" &>/dev/null; then
			continue
		fi

		if ! jq -e '.extra["wp-plugin-slug"] // false' "$F" &>/dev/null; then
			continue
		fi

		if jq -e '.extra["wp-svn-autopublish"] // false' "$F" &>/dev/null; then
			AUTO+=( "$PLUGIN" )
		else
			MANUALPUB+=( "$PLUGIN" )
		fi
	done

	if [[ ${#AUTO[@]} -gt 0 ]]; then
		cat <<-EOM

		For these plugins: ${AUTO[*]}
		  1. Wait for the release to be automatically tagged in GitHub.
		  2. Wait for the changes to be automatically deployed to SVN.
		  3. Smoke test.
		  4. Update the stable tag (if stable release): \`./tools/stable-tag.sh <plugin>\`
		EOM
	fi

	if [[ ${#MANUALPUB[@]} -gt 0 ]]; then
		cat <<-EOM

		For these plugins: ${MANUALPUB[*]}
		  1. Wait for the release to be automatically tagged in GitHub.
		  2. Deploy to SVN: \`./tools/deploy-to-svn.sh <plugin> <tag>\`
		  3. Smoke test.
		  4. Update the stable tag (if stable release): \`./tools/stable-tag.sh <plugin>\`
		EOM
	fi
}

trap 'exit 130' SIGINT
trap 'exit 143' SIGTERM
trap 'handle_exit' EXIT

preflight_checks

while [[ $# -gt 0 ]]; do
	case $1 in
		-h|--help)
			usage
			;;
		-R|--from-release-branch)
			FROM_RELEASE_BRANCH=true
			shift
			;;
		-s|--step)
			[[ $2 =~ ^[0-9]$ ]] || usage
			CUR_STEP=$2
			shift 2
			;;
		--list-steps)
			LIST_STEPS=true
			shift
			;;
		-*)
			usage
			;;
		*)
			[[ -z $PLUGIN ]] || usage
			PLUGIN=$(normalize_plugin_name "$1")
			shift
			if [[ $1 =~ $VERSION_REGEX ]]; then
				VERSION=$1
				shift
			fi
			;;
	esac
done

if $FROM_RELEASE_BRANCH; then
	STEPS=( "${FROM_RELEASE_BRANCH_STEPS[@]}" )
else
	STEPS=( "${RELEASE_STEPS[@]}" )
fi

if $LIST_STEPS; then
	echo 'Use the following steps at your own risk:'
	for i in "${!STEPS[@]}"; do
		echo "  $i: ${STEPS[$i]}"
	done
	exit 1
fi

[[ -n $PLUGIN ]] || usage

if [[ -z $VERSION ]]; then
	cd "$BASE/projects/$PLUGIN"
	VERSION=$(changelogger version next) || die "Cannot determine version number for $PLUGIN. Please supply one on the command line."
	cd "$BASE"
fi

# @todo: Rip out multi-plugin release support altogether.
declare -A PROJECTS=( ["$PLUGIN"]="$VERSION" )

find_base_branch
git fetch origin "$BASE_BRANCH"
if $FROM_RELEASE_BRANCH; then
	RELEASE_BRANCH="${BASE_BRANCH%%/*}/branch-$VERSION"
fi

for PLUGIN in "${!PROJECTS[@]}"; do
	normalize_version_number "${PROJECTS[$PLUGIN]}"
	if [[ ! "$NORMALIZED_VERSION" =~ $VERSION_REGEX ]]; then
		red "\"$NORMALIZED_VERSION\" does not appear to be a valid version number."
		die "Please specify a valid version number."
	fi
	CUR_VERSION=$(current_version)
	# shellcheck disable=SC2310
	if version_compare "$CUR_VERSION" "$NORMALIZED_VERSION"; then
		proceed_p "$PLUGIN: Version $NORMALIZED_VERSION is not higher than $CUR_VERSION." || die "User aborted script."
	fi
	echo "$PLUGIN: $CUR_VERSION -> ${PROJECTS[$PLUGIN]}"
done

proceed_p "" "Proceed releasing above projects?" Y

# Sending tracking event
RELEASED_PLUGINS="{}"
for PLUGIN in "${!PROJECTS[@]}"; do

	CUR_VERSION=$(current_version)
	VERSION_DIFF=$( version_diff "$CUR_VERSION" "${PROJECTS[$PLUGIN]}" )

	if [[ "${PROJECTS[$PLUGIN]}" == *-* ]]; then

		# The version is a prerelease.
		if proceed_p "" "Is this $PLUGIN release fixing a known problem caused by a previous release?" N; then
			VERSION_DIFF="bugfix"
		fi

	elif [[ "${PROJECTS[$PLUGIN]}" =~ ^[0-9]+\.[0-9]+\.[0.]*[1-9] ]]; then

		# The version in patch-level.
		VERSION_DIFF="bugfix"

		# If a project follows semver versioning, we prompt.
		if jq -e '.extra.changelogger["versioning"] == "semver"' "$BASE/projects/$PLUGIN/composer.json" &>/dev/null; then
			if ! proceed_p "" "Is this $PLUGIN release fixing a known problem caused by a previous release?" N; then
				VERSION_DIFF="patch"
			fi
		fi
	fi

	RELEASED_PLUGINS=$(
		jq \
			--arg property "${PLUGIN//[\/-]/_}_release_type" \
			--arg value "$VERSION_DIFF" \
			'.[ $property ] = $value' <<< "$RELEASED_PLUGINS"
	)
	RELEASED_PLUGINS=$(
		jq \
			--arg property "${PLUGIN//[\/-]/_}_version" \
			--arg value "${PROJECTS[$PLUGIN]}" \
			'.[ $property ] = $value' <<< "$RELEASED_PLUGINS"
	)
done

send_tracks_event "jetpack_release_start" "$RELEASED_PLUGINS"

# Figure out which release branch prefixes to use.
PREFIXDATA=$(jq -n 'reduce inputs as $in ({}; .[ $in.extra["release-branch-prefix"] | if . == null then empty elif type == "array" then .[] else . end ] += [ input_filename | capture( "projects/plugins/(?<p>[^/]+)/composer\\.json$" ).p ] ) | to_entries | sort_by( ( .value | -length ), .key ) | from_entries' "$BASE"/projects/plugins/*/composer.json)
TMP=$(jq -rn --argjson d "$PREFIXDATA" '$d | reduce to_entries[] as $p ({ s: ( $ARGS.positional | map( sub( "^plugins/"; "" ) ) ), o: []}; if $p.value - .s == [] then .o += [ $p.key ] | .s -= $p.value else . end) | .o[]' --args "${!PROJECTS[@]}")
mapfile -t PREFIXES <<<"$TMP"
[[ ${#PREFIXES[@]} -eq 0 ]] && die "Could not determine prefixes for projects ${!PROJECTS[*]}"
if [[ ${#PREFIXES[@]} -gt 1 ]]; then
	yellow "The specified set of plugins will require multiple release branches: ${PREFIXES[*]}"
	proceed_p "" "" Y
fi

# Run each release step.
for ((i = CUR_STEP; i < ${#STEPS[@]}; i++)); do
	green "Step $i: ${STEPS[$i]}"
	"${STEPS[$i]}"
	((CUR_STEP+=1))
done

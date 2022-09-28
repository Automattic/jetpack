#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd $(dirname "${BASH_SOURCE[0]}")/.. && pwd)
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"
. "$BASE/tools/includes/plugin-functions.sh"
. "$BASE/tools/includes/proceed_p.sh"

# Instructions
function usage {
	cat <<-EOH
		usage: $0 [options] <plugin> <tag>

		Clone a plugin mirror repository in preparation for deploying it to
		WordPress.org SVN.

		The <plugin> may be either the name of a directory in projects/plugins/,
		or a path to a plugin directorty or file.

		The <tag> is the tag or branch name in the GitHub mirror repo to be
		deployed.

		Options:
		  --non-interactive  Exit instead of prompting for questionable cases.
		  --dir <dir>        Use the specified directory for the SVN checkout,
		                     instead of creating a random directory in TMPDIR.
	EOH
	exit 1
}

# Process args.
ARGS=()
BUILD_DIR=
INTERACTIVE=true
while [[ $# -gt 0 ]]; do
	arg="$1"
	shift
	case $arg in
		--non-interactive)
			INTERACTIVE=false
			;;
		--dir)
			BUILD_DIR="$1"
			shift
			;;
		--dir=*)
			BUILD_DIR="${arg#--dir=}"
			;;
		--help)
			usage
			;;
		*)
			ARGS+=( "$arg" )
			;;
	esac
done

if $INTERACTIVE && [[ ! -t 0 ]]; then
	debug "Input is not a terminal, forcing --non-interactive."
	INTERACTIVE=false
fi
if [[ ${#ARGS[@]} -ne 2 ]]; then
	usage
fi

TAG="${ARGS[1]}"
SVNTAG="${TAG#v}"

# Check plugin.
process_plugin_arg "${ARGS[0]}"
PLUGIN_NAME=$(jq --arg n "${ARGS[0]}" -r '.name // $n' "$PLUGIN_DIR/composer.json")
MIRROR=$(jq -r '.extra["mirror-repo"] // ""' "$PLUGIN_DIR/composer.json")
WPSLUG=$(jq -r '.extra["wp-plugin-slug"] // ""' "$PLUGIN_DIR/composer.json")
FAIL=false
if [[ -z "$MIRROR" ]]; then
	FAIL=true
	error "Plugin $PLUGIN_NAME has no mirror repo. Cannot deploy."
fi
if [[ -z "$WPSLUG" ]]; then
	FAIL=true
	error "Plugin $PLUGIN_NAME has no WordPress.org plugin slug. Cannot deploy." >&2
fi
$FAIL && exit 1

# Check build dir.
if [[ -z "$BUILD_DIR" ]]; then
	TMPDIR="${TMPDIR:-/tmp}"
	BUILD_DIR=$(mktemp -d "${TMPDIR%/}/deploy-to-svn.XXXXXXXX")
elif [[ ! -e "$BUILD_DIR" ]]; then
	mkdir -p "$BUILD_DIR"
else
	if [[ ! -d "$BUILD_DIR" ]]; then
		proceed_p "$BUILD_DIR already exists, and is not a directory." "Delete it?"
	elif [[ $(ls -A -- "$BUILD_DIR") ]]; then
		proceed_p "Directory $BUILD_DIR already exists, and is not empty." "Delete it?"
	fi
	rm -rf "$BUILD_DIR"
	mkdir -p "$BUILD_DIR"
fi
cd "$BUILD_DIR"
DIR=$(pwd)
debug "Using build dir $DIR"

info "Checking mirror repo"
git init -q .
git remote add origin "https://github.com/${MIRROR}.git"
if [[ "$(git ls-remote --tags origin "$TAG" 2>/dev/null)" ]]; then
	: # Tag exists
elif [[ "$(git ls-remote --heads origin "$TAG" 2>/dev/null)" ]]; then
	proceed_p "You are about to deploy a change from an unstable state 'HEAD'. This should only be done to update string typos for translators."
else
	die "Tag $TAG not found in git repository. Please try again with a valid tag."
fi

info "Checking out SVN shallowly to $DIR"
svn -q checkout "https://plugins.svn.wordpress.org/$WPSLUG/" --depth=empty "$DIR"
success "Done!"

info "Checking out SVN trunk to $DIR/trunk"
svn up trunk | while IFS= read -r LINE; do printf "\r\e[K%s" $LINE; done
printf "\r\e[K"
success "Done!"

info "Checking out SVN tags shallowly to $DIR/tags"
svn -q up tags --depth=empty
success "Done!"

info "Deleting everything in trunk except for .svn directories"
find trunk ! \( -path '*/.svn/*' -o -path "*/.svn" \) \( ! -type d -o -empty \) -delete
[[ -e trunk ]] || mkdir -p trunk # If there were no .svn directories, trunk itself might have been removed.
success "Done!"

info "Checking out $MIRROR $TAG into trunk"
mv .git trunk/
cd trunk
git fetch --depth=1 origin "$TAG"
git checkout -q FETCH_HEAD
success "Done!"

info "Removing .git files and empty directories"
find . -name '.git*' -print -exec rm -rf {} +
find . -type d -empty -print -delete
success "Done!"

info "Checking for added and removed files"
ANY=false
while IFS=" " read -r FLAG FILE; do
	if [[ "$FLAG" == '!' ]]; then
		svn rm "$FILE"
		ANY=true
	elif [[ "$FLAG" == "?" ]]; then
		svn add "$FILE"
		ANY=true
	fi
done < <( svn status )
if $ANY; then
	proceed_p "Files were added and/or removed."
else
	success "None found!"
fi

cd "$DIR"

STABLE_TAG="$(sed -n -E -e 's/^Stable tag: +([^ ]+) *$/\1/p' trunk/readme.txt)"
if [[ "$SVNTAG" == "$STABLE_TAG" ]]; then
	warn "The stable tag in trunk/readme.txt is already $STABLE_TAG!"
	echo "Usually we wait until a final, manual step to update the stable tag."
	proceed_p ""
else
	debug "Stable tag in trunk/readme.txt is $STABLE_TAG. Good, that's !== $SVNTAG."
fi

proceed_p "We're ready to update trunk and tag $SVNTAG!" "Do it?"
info "Updating trunk"
svn commit -m "Updating trunk to version $SVNTAG"
success "Done!"
info "Tagging $SVNTAG"
svn cp ^/$WPSLUG/trunk ^/$WPSLUG/tags/$SVNTAG -m "Creating the $SVNTAG tag"
success "Done!"
if [[ "$SVNTAG" =~ ^[0-9]+(\.[0-9]+)+$ ]]; then
	info "Updating stable tag in readme.txt in SVN tags/$SVNTAG"
	svn up tags/$SVNTAG | while IFS= read -r LINE; do printf "\r\e[K%s" $LINE; done
	printf "\r\e[K"
	sed -i.bak -e "s/Stable tag: .*/Stable tag: $SVNTAG/" "tags/$SVNTAG/readme.txt"
	rm "tags/$SVNTAG/readme.txt.bak"
	svn commit -m "Updating stable tag in version $SVNTAG"
	success "Done!"
else
	debug "As $TAG appears to be a prerelease version, skipping update of stable tag in readme.txt in SVN tags/$SVNTAG"
fi

info "Reminder that SVN trunk is at $DIR/trunk"

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
git remote update
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
svn -q up trunk
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

success "Your SVN checkout is at $DIR"

# Tag the release.
# svn cp trunk tags/$TAG

# Change stable tag in the tag itself, and commit (tags shouldn't be modified after comitted)
# perl -pi -e "s/Stable tag: .*/Stable tag: $TAG/" tags/$TAG/readme.txt
# svn ci

# Update trunk to point to the freshly tagged and shipped release.
# perl -pi -e "s/Stable tag: .*/Stable tag: $TAG/" trunk/readme.txt
# svn ci

#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"
. "$BASE/tools/includes/plugin-functions.sh"
. "$BASE/tools/includes/proceed_p.sh"

# Instructions
function usage {
	cat <<-EOH
		usage: $0 [options] <plugin>

		Deploy updated assets (.w.org-assets dir) and readme.txt to
		WordPress.org SVN.

		The <plugin> may be either the name of a directory in projects/plugins/,
		or a path to a plugin directorty or file.

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
if [[ ${#ARGS[@]} -ne 1 ]]; then
	usage
fi

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
	BUILD_DIR=$(mktemp -d "${TMPDIR%/}/deploy-assets-to-svn.XXXXXXXX")
elif [[ ! -e "$BUILD_DIR" ]]; then
	mkdir -p "$BUILD_DIR"
else
	if [[ ! -d "$BUILD_DIR" ]]; then
		proceed_p "$BUILD_DIR already exists, and is not a directory." "Delete it?"
	elif [[ -n "$(ls -A -- "$BUILD_DIR")" ]]; then
		proceed_p "Directory $BUILD_DIR already exists, and is not empty." "Delete it?"
	fi
	rm -rf "$BUILD_DIR"
	mkdir -p "$BUILD_DIR"
fi
DIR=$(cd "$BUILD_DIR" && pwd)
debug "Using build dir $DIR"

info "Checking repo status"
if [[ -n "$(git status --porcelain)" ]]; then
	die "Working directory not clean, make sure you're working from a clean checkout and try again."
fi

CURRENT_BRANCH="$( git rev-parse --abbrev-ref HEAD )"
if [[ "$CURRENT_BRANCH" != "trunk" ]]; then
	if proceed_p "Not currently checked out to trunk!" "Check out trunk before continuing?"; then
		git checkout trunk && git pull
	else
		proceed_p '' "Really deploy assets from $CURRENT_BRANCH instead of trunk?"
	fi
else
	git pull
fi

info "Checking out SVN shallowly to $DIR"
svn -q checkout "https://plugins.svn.wordpress.org/$WPSLUG/" --depth=empty "$DIR"
success "Done!"

info "Checking out SVN assets to $DIR/assets"
svn -q up "$DIR/assets"
success "Done!"

info "Checking out SVN trunk readme to $DIR/trunk/readme.txt"
svn -q up "$DIR/trunk/readme.txt" --parents
success "Done!"

TAG=$( sed -n 's/^Stable tag: \(.*\)/\1/p' "$DIR/trunk/readme.txt" )
info "Stable tag is $TAG"
info "Checking out SVN $TAG readme to $DIR/tags/$TAG/readme.txt"
svn -q up "$DIR/tags/$TAG/readme.txt" --parents
success "Done!"

info "Updating assets from $PLUGIN_DIR/.w.org-assets"
find "$DIR/assets" -delete
cp -a "$PLUGIN_DIR/.w.org-assets" "$DIR/assets"
rm -f "$DIR/assets/README.md"
find "$DIR/assets" -name '.git*' -exec rm -rf {} +
find "$DIR/assets" -type d -empty -print -delete
cd "$DIR"
while IFS= read -r LINE; do
	FLAGS="${LINE:0:7}"
	FILE="${LINE:8}"
	if [[ "$FLAGS" != ?'      ' ]]; then
		echo "Unexpected svn flags: $LINE"
	fi
	# The appending of an `@` to the filename here avoids problems with filenames containing `@` being interpreted as "peg revisions".
	if [[ "${FLAGS:0:1}" == '!' ]]; then
		svn rm "${FILE}@"
	elif [[ "${FLAGS:0:1}" == "?" ]]; then
		svn add "${FILE}@"
	fi
done < <( svn status )
success "Done!"

info "Copying readme from $PLUGIN_DIR/readme.txt to SVN trunk"
cp "$PLUGIN_DIR/readme.txt" trunk/readme.txt

TAG2=$( sed -n 's/^Stable tag: \(.*\)/\1/p' trunk/readme.txt )
if [[ "$TAG" != "$TAG2" ]]; then
	warn "Stable tag in new readme was $TAG2, changing it back. Stable tag changes must be done manually."
	sed -i.bak "s/^Stable tag: .*/Stable tag: $TAG/" trunk/readme.txt
	rm -f trunk/readme.txt.bak
fi

info "Copying readme (except changelog) to SVN tags/$TAG"

# Extract the stable tag and changelog section from existing readme.
SCRIPT="
	/^== Changelog ==/ {
		:a
		# Add some escaping, needed later.
		s/\\\\/\\\\\\\\/
		s/$/\\\\/
		p
		n
		/^== |^--------/!ba
	}
"
ENTRY=$'\n'"$( sed -n -E -e "$SCRIPT" "tags/$TAG/readme.txt" )"
TAG2=$( sed -n 's/^Stable tag: \(.*\)/\1/p' "tags/$TAG/readme.txt" )

# Create new readme.
SCRIPT="
	/^== Changelog ==/ {
		a\\${ENTRY%\\}
		:a
		n
		/^== |^--------/!ba
	}
	s/^Stable tag: .*/Stable tag: $TAG2/
	p
"
sed -n -E -e "$SCRIPT" < trunk/readme.txt > "tags/$TAG/readme.txt"

if [[ -z "$(svn status "tags/$TAG/readme.txt")" ]]; then
	function point_release_warning {
		:
	}
else
	function point_release_warning {
		warn <<-EOF

			${1}If there's any chance of a point release for $TAG, you should commit
			the new readme to the appropriate release branch in the monorepo to ensure
			your changes aren't overwritten should a point release happen.
		EOF
	}
fi
point_release_warning ''

success "Done!"

if [[ -z "$(svn status)" ]]; then
	info "No update is needed."
else
	info "Displaying diff"
	for PAGER in sensible-pager pager less more cat; do
		command -v "$PAGER" &>/dev/null && break
	done
	svn diff | "$PAGER" || true
	proceed_p "We're ready to update!" "Do it?" Y
	info "Updating assets and readme"
	svn commit -m "Updating assets and readme"
	success "Done!"

	point_release_warning 'P.S. '
fi

# Clean up
cd "$BASE"
rm -rf "$BUILD_DIR"

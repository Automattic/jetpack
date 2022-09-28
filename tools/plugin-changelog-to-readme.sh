#!/usr/bin/env bash

set -eo pipefail

cd $(dirname "${BASH_SOURCE[0]}")/..
BASE=$PWD
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"
. "$BASE/tools/includes/plugin-functions.sh"

# Print help and exit.
function usage {
	cat <<-EOH
		usage: $0 [-v version] <slug>

		Copy the specified (or most recent) changelog entry from CHANGELOG.md to
		readme.txt.

		All content in the readme.txt from a header \`== Changelog ==\` up to the
		next line starting with \`== \` or \`--------\` is replaced.
	EOH
	exit 1
}

if [[ $# -eq 0 ]]; then
	usage
fi

# Sets options.
STARTRE="^## "
while getopts ":v:h" opt; do
	case ${opt} in
		v)
			STARTRE="^## \\[?$(sed 's/[.\[\]\\*^$\/()+?{}|]/\\&/g' <<<"$OPTARG")\\]? - "
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

# Determine the plugin
if [[ -z "$1" ]]; then
	die "A plugin must be specified unless -n is used."
else
	process_plugin_arg "$1"
fi
[[ -e "$PLUGIN_DIR/CHANGELOG.md" ]] || die "Plugin $1 has no CHANGELOG.md"
[[ -e "$PLUGIN_DIR/readme.txt" ]] || die "Plugin $1 has no readme.txt"

# Extract the changelog section.
SCRIPT="
	/$STARTRE/ {
		bc
		:a
		n
		/^## / {
			q
		}
		:c

		# Remove markdown links from section header.
		s/^## \[([^]]+)\]/## \1/

		# Increase section header level by 1.
		s/^#/##/

		# Remove PR numbers from the ends of lines.
		s/ \[#[0-9]+\]$//

		# Add some escaping, needed later.
		s/\\\\/\\\\\\\\/
		s/$/\\\\/

		p
		ba
	}
"
ENTRY=$(sed -n -E -e "$SCRIPT" "$PLUGIN_DIR/CHANGELOG.md")
[[ -z "$ENTRY" ]] && die "Failed to find requested section in CHANGELOG.md"

# Strip unwanted sections.
SCRIPT="
	:a
	/^#### .* This section will not be copied to readme\.txt/ {
		:b
		n
		/^#/ ba
		bb
	}
	p
"
ENTRY=$(sed -n -E -e "$SCRIPT" <<<"$ENTRY")

# Generate the replacement readme.txt.
ENTRY=$'\n'"$ENTRY"
SCRIPT="
	/^== Changelog ==/ {
		a\\${ENTRY%\\}
		p
		:a
		n
		/^== |^--------/!ba
	}
	p
"
sed -i.bak -n -E -e "$SCRIPT" "$PLUGIN_DIR/readme.txt"
rm -f "$PLUGIN_DIR/readme.txt.bak"

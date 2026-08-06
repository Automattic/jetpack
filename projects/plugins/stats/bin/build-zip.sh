#!/usr/bin/env bash

set -euo pipefail

PLUGIN_SLUG="jetpack-stats"
PROJECT="plugins/stats"

SCRIPT_DIR="$(
	cd "$(dirname "${BASH_SOURCE[0]}")"
	pwd -P
)"
PLUGIN_DIR="$(
	cd "$SCRIPT_DIR/.."
	pwd -P
)"
# projects/plugins/stats -> monorepo root is three levels up.
MONOREPO_ROOT="$(
	cd "$PLUGIN_DIR/../../.."
	pwd -P
)"
JETPACK_CLI="$MONOREPO_ROOT/tools/cli/bin/jetpack.js"
OUTPUT_PATH="$PLUGIN_DIR/${PLUGIN_SLUG}.zip"

usage() {
	cat <<EOF
Build an installable Jetpack Stats plugin zip.

The zip is built from the current monorepo working tree: the plugin is compiled
for production in place and staged with the same file-collection that
\`jetpack rsync\` uses, so the archive contains exactly the production file set
(plugin PHP, the bundled package build output, and the production autoloader).

Usage:
  composer build-zip
  bin/build-zip.sh [options]

Options:
  -h, --help               Show this help text.

Requirements:
  - A monorepo dev environment (run \`pnpm install\` at the repo root first).
  - Standard rsync. macOS ships openrsync, which cannot sync the package
    symlinks; install real rsync with \`brew install rsync\`.

Note: this performs a production build (\`composer install --no-dev\`) in your
working tree. Re-run \`jetpack build $PROJECT\` afterwards to restore dev
dependencies.
EOF
}

log() {
	printf '%s\n' "$*"
}

error() {
	printf 'Error: %s\n' "$*" >&2
	exit 1
}

require_command() {
	if ! command -v "$1" >/dev/null 2>&1; then
		error "Missing required command: $1"
	fi
}

require_rsync() {
	require_command rsync

	# Apple ships a fork of openrsync that cannot properly sync the package
	# symlinks; it silently copies nothing. Match the guidance from
	# tools/cli/commands/rsync.js and fail fast.
	if [[ "$(uname)" == "Darwin" ]] && rsync --version 2>/dev/null | grep -q openrsync; then
		error "macOS's built-in rsync (openrsync) cannot sync the package symlinks. Please install standard rsync (e.g. \`brew install rsync\`)."
	fi
}

jetpack() {
	node "$JETPACK_CLI" "$@"
}

while [[ $# -gt 0 ]]; do
	case "$1" in
		-h|--help)
			usage
			exit 0
			;;
		*)
			error "Unknown option: $1"
			;;
	esac
done

require_command node
require_command zip
require_rsync

[[ -f "$JETPACK_CLI" ]] || error "Jetpack CLI not found at $JETPACK_CLI. Run this from a monorepo checkout."

WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/${PLUGIN_SLUG}-zip.XXXXXX")"
PLUGIN_STAGE="$WORK_DIR/$PLUGIN_SLUG"

cleanup() {
	rm -rf "$WORK_DIR"
}
trap cleanup EXIT

log "Building production assets for $PROJECT..."
# --deps also builds the bundled packages so any build output they produce
# exists for the symlinks that rsync follows.
jetpack build "$PROJECT" --production --deps

log "Staging production files via jetpack rsync..."
mkdir -p "$PLUGIN_STAGE"
jetpack rsync stats "$PLUGIN_STAGE/" --non-interactive

# rsync can exit 0 while copying nothing (e.g. an unsupported rsync fork or a
# filter mishap), and `zip` happily archives an empty directory. Verify the
# stage contains the plugin bootstrap and the production autoloader before zipping.
[[ -f "$PLUGIN_STAGE/jetpack-stats.php" ]] || error "Staged tree at $PLUGIN_STAGE is missing jetpack-stats.php; refusing to zip an incomplete stage."
[[ -f "$PLUGIN_STAGE/vendor/autoload_packages.php" ]] || error "Staged tree at $PLUGIN_STAGE is missing vendor/autoload_packages.php; refusing to zip an incomplete stage."

log "Creating zip..."
mkdir -p "$(dirname "$OUTPUT_PATH")"
rm -f "$OUTPUT_PATH"
(
	cd "$WORK_DIR"
	zip -qr "$OUTPUT_PATH" "$PLUGIN_SLUG"
)

log "Zip created: $OUTPUT_PATH"

#!/usr/bin/env bash

set -euo pipefail

PLUGIN_SLUG="jetpack-premium-analytics"
PACKAGE_REPO_URL="${PACKAGE_REPO_URL:-https://github.com/Automattic/jetpack-premium-analytics.git}"
PACKAGE_REF="trunk"
PACKAGE_PATH=""

SCRIPT_DIR="$(
	cd "$(dirname "${BASH_SOURCE[0]}")"
	pwd -P
)"
PLUGIN_DIR="$(
	cd "$SCRIPT_DIR/.."
	pwd -P
)"
OUTPUT_PATH="$PLUGIN_DIR/${PLUGIN_SLUG}.zip"

usage() {
	cat <<EOF
Build an installable Jetpack Premium Analytics plugin zip.

Usage:
  composer build-zip -- [options]
  bin/build-zip.sh [options]

Options:
  --package-ref <ref>      Branch, tag, or SHA to fetch from the package mirror. Default: trunk
  --package-path <path>    Use a local Premium Analytics package checkout instead of cloning.
  -h, --help               Show this help text.

Environment:
  PACKAGE_REPO_URL         Override the package mirror URL. Default: ${PACKAGE_REPO_URL}
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

absolute_dir() {
	local path="$1"

	if [[ ! -d "$path" ]]; then
		error "Directory does not exist: $path"
	fi

	(
		cd "$path"
		pwd -P
	)
}

fetch_package_source() {
	local source_dir="$1"

	log "Cloning ${PACKAGE_REPO_URL} at ${PACKAGE_REF}..."

	if git clone --no-tags --depth=1 --branch "$PACKAGE_REF" "$PACKAGE_REPO_URL" "$source_dir"; then
		return
	fi

	rm -rf "$source_dir"

	log "Fetching ${PACKAGE_REF} directly..."
	git clone --no-tags --depth=1 "$PACKAGE_REPO_URL" "$source_dir"
	git -C "$source_dir" fetch --depth=1 origin "$PACKAGE_REF"
	git -C "$source_dir" checkout --detach FETCH_HEAD
}

validate_package_source() {
	local package_source="$1"

	[[ -f "$package_source/composer.json" ]] || error "No composer.json found in package source: $package_source"
	[[ -f "$package_source/build/build.php" ]] || error "No build/build.php found in package source: $package_source. Use the package mirror, or build the package before using --package-path."
}

write_staged_composer_json() {
	local composer_json="$1"
	local package_source="$2"

	php -r '
		$composer_file = $argv[1];
		$package_source = $argv[2];
		$data = json_decode( file_get_contents( $composer_file ), true );

		if ( ! is_array( $data ) ) {
			fwrite( STDERR, "Unable to decode staged composer.json.\n" );
			exit( 1 );
		}

		unset( $data["require-dev"] );

		if ( isset( $data["scripts"] ) && is_array( $data["scripts"] ) ) {
			unset( $data["scripts"]["phpunit"], $data["scripts"]["test-php"], $data["scripts"]["test-php-coverage"] );
			if ( array() === $data["scripts"] ) {
				unset( $data["scripts"] );
			}
		}

		if ( ! isset( $data["extra"] ) || ! is_array( $data["extra"] ) ) {
			$data["extra"] = array();
		}
		$data["extra"]["wp-plugin-slug"] = "jetpack-premium-analytics";

		$plugin_file = dirname( $composer_file ) . "/jetpack-premium-analytics.php";
		if ( is_readable( $plugin_file ) && preg_match( "/^\\s*\\*\\s*Version:\\s*([^\\r\\n]+)/m", file_get_contents( $plugin_file ), $matches ) ) {
			$data["version"] = trim( $matches[1] );
		}

		$data["repositories"] = array(
			array(
				"type" => "path",
				"url" => $package_source,
				"options" => array(
					"symlink" => false,
				),
			),
		);

		file_put_contents(
			$composer_file,
			json_encode( $data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . "\n"
		);
	' "$composer_json" "$package_source"
}

prune_development_artifacts() {
	local plugin_stage="$1"

	find "$plugin_stage" \
		\( -type d \( -name .git -o -name node_modules -o -name .cache -o -name .idea -o -name tests -o -name test -o -name changelog \) -prune \) \
		-exec rm -rf {} +

	find "$plugin_stage" \
		\( -name '.DS_Store' -o -name 'phpunit*.xml.dist' -o -name 'phpunit.xml' \) \
		-delete
}

while [[ $# -gt 0 ]]; do
	case "$1" in
		--package-ref)
			[[ $# -ge 2 ]] || error "--package-ref requires a value"
			PACKAGE_REF="$2"
			shift 2
			;;
		--package-ref=*)
			PACKAGE_REF="${1#*=}"
			shift
			;;
		--package-path)
			[[ $# -ge 2 ]] || error "--package-path requires a value"
			PACKAGE_PATH="$2"
			shift 2
			;;
		--package-path=*)
			PACKAGE_PATH="${1#*=}"
			shift
			;;
		-h|--help)
			usage
			exit 0
			;;
		*)
			error "Unknown option: $1"
			;;
	esac
done

require_command composer
require_command php
require_command zip

if [[ -z "$PACKAGE_PATH" ]]; then
	require_command git
fi

WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/${PLUGIN_SLUG}-zip.XXXXXX")"
PACKAGE_SOURCE="$WORK_DIR/package-source"
PLUGIN_STAGE="$WORK_DIR/$PLUGIN_SLUG"

cleanup() {
	rm -rf "$WORK_DIR"
}
trap cleanup EXIT

if [[ -n "$PACKAGE_PATH" ]]; then
	PACKAGE_SOURCE="$(absolute_dir "$PACKAGE_PATH")"
else
	fetch_package_source "$PACKAGE_SOURCE"
fi

validate_package_source "$PACKAGE_SOURCE"

log "Staging plugin files..."
mkdir -p "$PLUGIN_STAGE/src"
cp "$PLUGIN_DIR/jetpack-premium-analytics.php" "$PLUGIN_STAGE/"
cp "$PLUGIN_DIR/composer.json" "$PLUGIN_STAGE/"
cp "$PLUGIN_DIR/readme.txt" "$PLUGIN_STAGE/"
cp "$PLUGIN_DIR/README.md" "$PLUGIN_STAGE/"
cp "$PLUGIN_DIR/src/class-jetpack-premium-analytics.php" "$PLUGIN_STAGE/src/"

write_staged_composer_json "$PLUGIN_STAGE/composer.json" "$PACKAGE_SOURCE"

log "Installing production dependencies..."
(
	cd "$PLUGIN_STAGE"
	composer install --no-dev --no-interaction --optimize-autoloader
)

log "Pruning development artifacts..."
prune_development_artifacts "$PLUGIN_STAGE"

log "Creating zip..."
mkdir -p "$(dirname "$OUTPUT_PATH")"
rm -f "$OUTPUT_PATH"
(
	cd "$WORK_DIR"
	zip -qr "$OUTPUT_PATH" "$PLUGIN_SLUG"
)

log "Zip created: $OUTPUT_PATH"

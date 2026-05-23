#!/usr/bin/env bash

##
## Generate test instructions from changelog for Jetpack releases.
##
## This bash script serves as a user-friendly wrapper around the Node.js
## implementation at tools/js-tools/gen-test-instructions.mjs. It provides:
## - Prerequisite checking (gh CLI, Node.js, authentication)
## - Path resolution and validation
## - User-friendly prompts and error messages
## - Integration with standard Jetpack tooling (chalk-lite, etc.)
##
## The actual logic for parsing, fetching, and generating test instructions
## is in the JavaScript module, while this script handles the CLI interface
## and environment setup.
##

set -eo pipefail

# Get the base directory
BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

# Source common includes
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"

# Default values
CHANGELOG_PATH="projects/plugins/jetpack/CHANGELOG.md"
OUTPUT_FILE=""
SINCE_VERSION=""
SINCE_DATE=""
TO_VERSION=""
TO_DATE=""
SKIP_AI=false
VERBOSE=false

##
## Print usage information and exit
##
function usage {
	cat <<-'EOH'
		usage: gen-test-instructions.sh [options]

		Generate consolidated test instructions from Jetpack changelog entries.

		OPTIONS:
		  -c, --changelog <path>    Path to CHANGELOG.md file (default: projects/plugins/jetpack/CHANGELOG.md)
		  -o, --output <file>       Output file path for test instructions
		  -v, --since-version <ver> Start from this version (e.g., 15.1). Defaults to last stable release
		  -d, --since-date <date>   Include entries since this date (YYYY-MM-DD)
		      --to-version <ver>    Stop at this version (inclusive). Caps the upper end of the range.
		      --to-date <date>      Include entries up to this date (YYYY-MM-DD, inclusive)
		  -s, --skip-ai             Skip AI consolidation and output raw format
		  -h, --help                Show this help message

		EXAMPLES:
		  # Generate since last stable release (default)
		  tools/gen-test-instructions.sh

		  # Generate since specific version
		  tools/gen-test-instructions.sh --since-version 15.1

		  # Recreate testing instructions for a past release (15.1 cycle)
		  tools/gen-test-instructions.sh --since-version 15.0 --to-version 15.1

		  # Recreate testing instructions as of a given date (e.g. when Call for Testing was posted)
		  tools/gen-test-instructions.sh --since-version 15.0 --to-date 2025-10-07

		  # Specify output file
		  tools/gen-test-instructions.sh --output test-guide.md

		  # Skip AI consolidation
		  tools/gen-test-instructions.sh --skip-ai

		REQUIREMENTS:
		  - Node.js (available in monorepo)
		  - GitHub CLI (gh) - must be installed and authenticated
		  - Claude Code CLI (claude) - required unless --skip-ai is used
	EOH
	exit 1
}

##
## Parse command line arguments
##
while [[ $# -gt 0 ]]; do
	case "$1" in
		-c|--changelog)
			CHANGELOG_PATH="$2"
			shift 2
			;;
		-o|--output)
			OUTPUT_FILE="$2"
			shift 2
			;;
		-v|--since-version)
			SINCE_VERSION="$2"
			shift 2
			;;
		-d|--since-date)
			SINCE_DATE="$2"
			shift 2
			;;
		--to-version)
			TO_VERSION="$2"
			shift 2
			;;
		--to-date)
			TO_DATE="$2"
			shift 2
			;;
		-s|--skip-ai)
			SKIP_AI=true
			shift
			;;
		--verbose)
			VERBOSE=true
			shift
			;;
		-h|--help)
			usage
			;;
		*)
			error "Unknown option: $1"
			usage
			;;
	esac
done

# Main execution starts here
info "🧪 Generating Testing Instructions..."
echo ""

# Check prerequisites
if ! command -v gh &> /dev/null; then
	error "GitHub CLI (gh) is not installed. Please install it first:"
	echo "  macOS: brew install gh"
	echo "  See: https://github.com/cli/cli/blob/trunk/docs/install_linux.md for other platforms"
	exit 1
fi

# Check if gh is authenticated
if ! gh auth status &> /dev/null; then
	error "GitHub CLI is not authenticated. Please run: gh auth login"
	exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
	error "Node.js is not installed"
	exit 1
fi

# Check if claude CLI is available (unless skipping AI consolidation)
if [[ "$SKIP_AI" != true ]] && ! command -v claude &> /dev/null; then
	error "Claude Code CLI (claude) is not installed. Install it or re-run with --skip-ai."
	echo "  See: https://docs.claude.com/en/docs/claude-code"
	exit 1
fi

# Resolve changelog path
if [[ ! "$CHANGELOG_PATH" = /* ]]; then
	CHANGELOG_PATH="$BASE/$CHANGELOG_PATH"
fi

# Check if changelog exists
if [[ ! -f "$CHANGELOG_PATH" ]]; then
	error "Changelog file not found at: $CHANGELOG_PATH"
	exit 1
fi

# Set default output file if not specified
if [[ -z "$OUTPUT_FILE" ]]; then
	if [[ -n "$SINCE_VERSION" ]]; then
		OUTPUT_FILE="test-instructions-${SINCE_VERSION}.md"
	else
		OUTPUT_FILE="test-instructions-latest.md"
	fi

	# Prompt for confirmation
	info "Output file will be: $OUTPUT_FILE"
	read -p "Press Enter to continue, provide a different name, or press Ctrl+C to cancel: " USER_INPUT
	if [[ -n "$USER_INPUT" ]]; then
		OUTPUT_FILE="$USER_INPUT"
		info "Output file updated to: $OUTPUT_FILE"
	fi
fi

# Build arguments for the Node.js script
NODE_ARGS=()
NODE_ARGS+=("--changelog" "$CHANGELOG_PATH")
NODE_ARGS+=("--output" "$OUTPUT_FILE")

if [[ -n "$SINCE_VERSION" ]]; then
	NODE_ARGS+=("--since-version" "$SINCE_VERSION")
fi

if [[ -n "$SINCE_DATE" ]]; then
	NODE_ARGS+=("--since-date" "$SINCE_DATE")
fi

if [[ -n "$TO_VERSION" ]]; then
	NODE_ARGS+=("--to-version" "$TO_VERSION")
fi

if [[ -n "$TO_DATE" ]]; then
	NODE_ARGS+=("--to-date" "$TO_DATE")
fi

if [[ "$SKIP_AI" = true ]]; then
	NODE_ARGS+=("--skip-ai")
fi

if [[ "$VERBOSE" = true ]]; then
	NODE_ARGS+=("--verbose")
fi

# Run the Node.js script
NODE_SCRIPT="$BASE/tools/js-tools/gen-test-instructions.mjs"

if [[ ! -f "$NODE_SCRIPT" ]]; then
	error "Node.js script not found at: $NODE_SCRIPT"
	exit 1
fi

# Execute the Node.js script
if [[ "$VERBOSE" = true ]]; then
	info "Running: node $NODE_SCRIPT ${NODE_ARGS[*]}"
fi

node "$NODE_SCRIPT" "${NODE_ARGS[@]}"

# Check if the script succeeded
if [[ $? -eq 0 ]]; then
	success "✅ Test guide generated successfully!"
	echo ""
	info "📄 Output file: $(cyan "$OUTPUT_FILE")"
	echo ""
	echo "You can now review and edit the test instructions before sharing."
else
	error "Failed to generate test instructions"
	exit 1
fi

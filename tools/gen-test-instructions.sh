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
VERSION_NAME=""
SINCE_VERSION=""
SINCE_DATE=""
TO_VERSION=""
TO_DATE=""
SKIP_AI=false
AI_PROVIDER="claude"
VERBOSE=false
EXCLUDE_PRS=""
INCLUDE_ONLY=""
NON_INTERACTIVE=false
COVERAGE_JSON=""
PIPELINE="loop"
SKIP_COVERAGE_AI=false
SKIP_REVIEWER=false
MAX_REVIEWER_ITERATIONS=""

##
## Print usage information and exit
##
function usage {
	cat <<-'EOH'
		usage: gen-test-instructions.sh [options]

		Generate consolidated test instructions from Jetpack changelog entries.

		OPTIONS:
		      --version-name <name> (REQUIRED) Release label used in headers and the AI prompt (e.g. 15.9)
		  -c, --changelog <path>    Path to CHANGELOG.md file (default: projects/plugins/jetpack/CHANGELOG.md)
		  -o, --output <file>       Output file path for test instructions
		  -v, --since-version <ver> Start from this version (e.g., 15.1). Defaults to last stable release
		  -d, --since-date <date>   Include entries since this date (YYYY-MM-DD)
		      --to-version <ver>    Stop at this version (inclusive). Caps the upper end of the range.
		      --to-date <date>      Include entries up to this date (YYYY-MM-DD, inclusive)
		  -s, --skip-ai             Skip AI consolidation and output raw format
		      --ai <provider>       AI provider for consolidation: claude (default) or codex
		      --pipeline <mode>     Pipeline mode: loop (default) or single. Loop runs coverage-AI → plan → reviewer in a feedback loop; single is the legacy one-pass behavior.
		      --skip-coverage-ai    Skip the AI classification pass (loop mode only); use deterministic classification only.
		      --skip-reviewer       Skip the reviewer + iteration loop; run the plan generator once.
		      --max-reviewer-iterations <N>
		                            Cap reviewer iterations (loop mode, default 3). After the cap, unresolved blockers escalate to human decisions.
		      --exclude-prs <csv>   Comma-separated PR numbers to exclude from the AI pass (they go to "Other PRs")
		      --include-only <csv>  Inverse of --exclude-prs: only these PRs reach the AI pass
		      --non-interactive     Skip interactive prompts; in loop mode, unresolved reviewer decisions exit 3 and are surfaced via the sidecar JSON.
		      --coverage-json <p>   Sidecar coverage JSON path (default: <output>.coverage.json)
		  -h, --help                Show this help message

		EXAMPLES:
		  # Generate since last stable release for the upcoming 15.9
		  tools/gen-test-instructions.sh --version-name 15.9

		  # Recreate testing instructions for a past release (15.1 cycle)
		  tools/gen-test-instructions.sh --version-name 15.1 --since-version 15.0 --to-version 15.1

		  # Recreate testing instructions as of a given date (e.g. when Call for Testing was posted)
		  tools/gen-test-instructions.sh --version-name 15.1 --since-version 15.0 --to-date 2025-10-07

		  # Specify output file
		  tools/gen-test-instructions.sh --version-name 15.9 --output test-guide.md

		  # Use codex (gpt-5.5, xhigh effort) instead of claude
		  tools/gen-test-instructions.sh --version-name 15.9 --ai codex

		  # Run the legacy single-shot pipeline (no coverage-AI, no reviewer loop)
		  tools/gen-test-instructions.sh --version-name 15.9 --pipeline single

		  # Loop pipeline with no reviewer (coverage-AI + one plan call)
		  tools/gen-test-instructions.sh --version-name 15.9 --skip-reviewer

		  # CI use: loop pipeline, decisions go to sidecar; exit 3 if any are open
		  tools/gen-test-instructions.sh --version-name 15.9 --non-interactive

		  # Skip AI consolidation
		  tools/gen-test-instructions.sh --version-name 15.9 --skip-ai

		REQUIREMENTS:
		  - Node.js (available in monorepo)
		  - GitHub CLI (gh) - must be installed and authenticated
		  - One of the following AI CLIs is required unless --skip-ai is used:
		      * Claude Code CLI (claude) - default
		      * Codex CLI (codex) - when --ai codex is set
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
		--version-name)
			VERSION_NAME="$2"
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
		--ai)
			AI_PROVIDER="$2"
			if [[ "$AI_PROVIDER" != "claude" && "$AI_PROVIDER" != "codex" ]]; then
				error "Unknown --ai provider: \"$AI_PROVIDER\". Supported: claude, codex."
				usage
			fi
			shift 2
			;;
		--exclude-prs)
			EXCLUDE_PRS="$2"
			shift 2
			;;
		--include-only)
			INCLUDE_ONLY="$2"
			shift 2
			;;
		--non-interactive)
			NON_INTERACTIVE=true
			shift
			;;
		--coverage-json)
			COVERAGE_JSON="$2"
			shift 2
			;;
		--pipeline)
			PIPELINE="$2"
			if [[ "$PIPELINE" != "loop" && "$PIPELINE" != "single" ]]; then
				error "Unknown --pipeline: \"$PIPELINE\". Supported: loop, single."
				usage
			fi
			shift 2
			;;
		--skip-coverage-ai)
			SKIP_COVERAGE_AI=true
			shift
			;;
		--skip-reviewer)
			SKIP_REVIEWER=true
			shift
			;;
		--max-reviewer-iterations)
			MAX_REVIEWER_ITERATIONS="$2"
			shift 2
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

# Check that the selected AI CLI is available (unless skipping AI consolidation)
if [[ "$SKIP_AI" != true ]]; then
	if [[ "$AI_PROVIDER" == "claude" ]] && ! command -v claude &> /dev/null; then
		error "Claude Code CLI (claude) is not installed. Install it, pass --ai codex, or re-run with --skip-ai."
		echo "  See: https://docs.claude.com/en/docs/claude-code"
		exit 1
	fi
	if [[ "$AI_PROVIDER" == "codex" ]] && ! command -v codex &> /dev/null; then
		error "Codex CLI (codex) is not installed. Install it, pass --ai claude, or re-run with --skip-ai."
		echo "  See: https://github.com/openai/codex"
		exit 1
	fi
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
	if [[ -n "$VERSION_NAME" ]]; then
		OUTPUT_FILE="test-instructions-${VERSION_NAME}.md"
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

if [[ -n "$VERSION_NAME" ]]; then
	NODE_ARGS+=("--version-name" "$VERSION_NAME")
fi

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

NODE_ARGS+=("--ai" "$AI_PROVIDER")

if [[ -n "$EXCLUDE_PRS" ]]; then
	NODE_ARGS+=("--exclude-prs" "$EXCLUDE_PRS")
fi

if [[ -n "$INCLUDE_ONLY" ]]; then
	NODE_ARGS+=("--include-only" "$INCLUDE_ONLY")
fi

if [[ "$NON_INTERACTIVE" = true ]]; then
	NODE_ARGS+=("--non-interactive")
fi

if [[ -n "$COVERAGE_JSON" ]]; then
	NODE_ARGS+=("--coverage-json" "$COVERAGE_JSON")
fi

NODE_ARGS+=("--pipeline" "$PIPELINE")

if [[ "$SKIP_COVERAGE_AI" = true ]]; then
	NODE_ARGS+=("--skip-coverage-ai")
fi

if [[ "$SKIP_REVIEWER" = true ]]; then
	NODE_ARGS+=("--skip-reviewer")
fi

if [[ -n "$MAX_REVIEWER_ITERATIONS" ]]; then
	NODE_ARGS+=("--max-reviewer-iterations" "$MAX_REVIEWER_ITERATIONS")
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

# Run the node script. We disable `set -e` momentarily so we can distinguish
# exit code 3 (decisions pending in non-interactive mode) from a hard failure.
set +e
node "$NODE_SCRIPT" "${NODE_ARGS[@]}"
NODE_EXIT=$?
set -e

if [[ $NODE_EXIT -eq 0 ]]; then
	success "✅ Test guide generated successfully!"
	echo ""
	info "📄 Output file: $(cyan "$OUTPUT_FILE")"
	echo ""
	echo "You can now review and edit the test instructions before sharing."
elif [[ $NODE_EXIT -eq 3 ]]; then
	# Loop pipeline surfaced reviewer decisions that need a human; the markdown
	# and sidecar were still written so the release lead can inspect them.
	error "⏸️  Reviewer decisions pending. Inspect the coverage sidecar JSON, resolve, and re-run interactively."
	echo ""
	info "📄 Output file: $(cyan "$OUTPUT_FILE")"
	echo ""
	exit 3
else
	error "Failed to generate test instructions"
	exit "$NODE_EXIT"
fi

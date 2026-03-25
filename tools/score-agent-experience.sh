#!/usr/bin/env bash
#
# Evaluate a repository's AI agent experience quality.
# Uses the same prompt as the agent-experience-eval GitHub Action.
#
# Usage:
#   ./tools/score-agent-experience.sh
#   ./tools/score-agent-experience.sh -o report.json
#   ./tools/score-agent-experience.sh -m 10

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROMPT_FILE="$SCRIPT_DIR/../projects/github-actions/agent-experience-eval/prompt.md"
OUTPUT="agent-experience-eval.json"
MAX_TURNS=15

while [[ $# -gt 0 ]]; do
  case "$1" in
    --)           shift ;;
    -o|--output)  OUTPUT="$2"; shift 2 ;;
    -m|--max-turns) MAX_TURNS="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: ./tools/score-agent-experience.sh [-o output.json] [-m max-turns]"
      exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

if git rev-parse --show-toplevel &>/dev/null; then
  cd "$(git rev-parse --show-toplevel)"
fi

[[ -z "${ANTHROPIC_API_KEY:-}" ]] && { echo "ERROR: ANTHROPIC_API_KEY is not set." >&2; exit 1; }
command -v claude &>/dev/null || { echo "ERROR: claude CLI not found." >&2; exit 1; }
command -v jq &>/dev/null || { echo "ERROR: jq not found." >&2; exit 1; }

PROMPT=$(cat "$PROMPT_FILE")

echo "Running evaluation..." >&2
RAW=$(claude --print --output-format text --max-turns "$MAX_TURNS" "$PROMPT" < /dev/null 2>/dev/null)

# Extract JSON
if echo "$RAW" | jq . > "$OUTPUT" 2>/dev/null; then
  :
elif FENCED=$(echo "$RAW" | sed -n '/^```\(json\)\?$/,/^```$/{ /^```/d; p; }') && \
     [[ -n "$FENCED" ]] && echo "$FENCED" | jq . > "$OUTPUT" 2>/dev/null; then
  :
elif BRACED=$(echo "$RAW" | sed -n '/^{/,/^}/p') && \
     [[ -n "$BRACED" ]] && echo "$BRACED" | jq . > "$OUTPUT" 2>/dev/null; then
  :
else
  echo "ERROR: Could not parse JSON from Claude output." >&2
  echo "${RAW:0:500}" >&2
  exit 1
fi

# Print summary
SCORE=$(jq -r '.score' "$OUTPUT")
GRADE=$(jq -r '.grade' "$OUTPUT")
echo "" >&2
echo "Score: $SCORE/100 (Grade: $GRADE)" >&2
jq -r '.criteria | to_entries[] | "\(.key)\t\(.value.score)\t\(.value.max)"' "$OUTPUT" |
while IFS=$'\t' read -r key score max; do
  label=$(echo "$key" | tr '_' ' ' | sed 's/\b\(.\)/\u\1/g')
  filled=$(( score * 20 / max ))
  bar=$(printf '█%.0s' $(seq 1 "$filled") 2>/dev/null || true)$(printf '░%.0s' $(seq 1 $((20 - filled))) 2>/dev/null || true)
  printf "  %-22s %s  %s/%s\n" "$label" "$bar" "$score" "$max" >&2
done
echo "" >&2
echo "Report written to $OUTPUT" >&2

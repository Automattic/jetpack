#!/usr/bin/env bash
#
# Shared evaluation logic for agent-experience-eval.
# Called by action.yml (in CI) and score-agent-experience.sh (locally).
#
# Required environment variables:
#   ANTHROPIC_API_KEY — Anthropic API key
#   MAX_TURNS         — Maximum turns for Claude CLI
#   PROMPT            — The evaluation prompt text
#   OUTPUT_PATH       — Where to write the JSON report
#
# Optional environment variables:
#   GITHUB_OUTPUT     — If set, writes score/grade/json_path outputs (CI mode)

set -euo pipefail

# Establish trap before mktemp so cleanup is always registered
trap 'rm -f "${CLAUDE_STDERR:-}"' EXIT
CLAUDE_STDERR=$(mktemp)

if ! RAW=$(claude --print --output-format text --max-turns "$MAX_TURNS" "$PROMPT" < /dev/null 2>"$CLAUDE_STDERR"); then
  echo "ERROR: Claude CLI failed:" >&2
  head -c 1000 "$CLAUDE_STDERR" >&2
  exit 1
fi

# Extract JSON: direct parse, code fences, or brace extraction
if echo "$RAW" | jq . > "$OUTPUT_PATH" 2>/dev/null; then
  :
elif FENCED=$(echo "$RAW" | sed -n '/^```\(json\)\?$/,/^```$/{ /^```/d; p; }') && \
     [[ -n "$FENCED" ]] && echo "$FENCED" | jq . > "$OUTPUT_PATH" 2>/dev/null; then
  :
elif BRACED=$(echo "$RAW" | sed -n '/^{/,/^}/p') && \
     [[ -n "$BRACED" ]] && echo "$BRACED" | jq . > "$OUTPUT_PATH" 2>/dev/null; then
  :
else
  echo "ERROR: Could not parse JSON from Claude output." >&2
  echo "Raw output (first 500 chars): ${RAW:0:500}" >&2
  exit 1
fi

# Validate extracted fields
SCORE=$(jq -r '.score' "$OUTPUT_PATH")
GRADE=$(jq -r '.grade' "$OUTPUT_PATH")

if [[ "$SCORE" == "null" || -z "$SCORE" ]]; then
  echo "ERROR: JSON missing 'score' field." >&2; exit 1
fi
if [[ "$GRADE" == "null" || -z "$GRADE" ]]; then
  echo "ERROR: JSON missing 'grade' field." >&2; exit 1
fi
if ! [[ "$SCORE" =~ ^[0-9]+$ ]]; then
  echo "ERROR: Invalid score: $SCORE" >&2; exit 1
fi
if ! [[ "$GRADE" =~ ^[A-F]$ ]]; then
  echo "ERROR: Invalid grade: $GRADE" >&2; exit 1
fi

# Write CI outputs if in GitHub Actions context
if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  echo "score=$SCORE" >> "$GITHUB_OUTPUT"
  echo "grade=$GRADE" >> "$GITHUB_OUTPUT"
  echo "json_path=$OUTPUT_PATH" >> "$GITHUB_OUTPUT"
fi

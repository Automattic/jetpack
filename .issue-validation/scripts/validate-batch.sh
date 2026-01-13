#!/bin/bash
set -e

# Interactive or automated batch validation of issues
# Can be run in AI-assisted mode where Claude reviews each issue

MODE="${1:-interactive}"
BATCH_SIZE="${2:-10}"

DATA_DIR="$(dirname "$0")/../data"
PROGRESS_DIR="$(dirname "$0")/../progress"
ISSUES_FILE="$DATA_DIR/issues.json"
PROGRESS_FILE="$PROGRESS_DIR/progress.json"
VALIDATED_FILE="$PROGRESS_DIR/validated.jsonl"

if [ ! -f "$ISSUES_FILE" ]; then
    echo "❌ Error: Issues file not found. Run fetch-issues.sh first."
    exit 1
fi

# Get list of already validated issue numbers
validated_numbers=()
if [ -f "$VALIDATED_FILE" ] && [ -s "$VALIDATED_FILE" ]; then
    while IFS= read -r line; do
        num=$(echo "$line" | jq -r '.number')
        validated_numbers+=("$num")
    done < "$VALIDATED_FILE"
fi

echo "📋 Loading issues..."
total=$(jq '. | length' "$ISSUES_FILE")
validated=${#validated_numbers[@]}
remaining=$((total - validated))

echo "Total issues: $total"
echo "Already validated: $validated"
echo "Remaining: $remaining"
echo ""

if [ "$remaining" -eq 0 ]; then
    echo "✅ All issues have been validated!"
    exit 0
fi

echo "Processing next $BATCH_SIZE issues..."
echo ""

# Get next batch of unvalidated issues
batch=()
count=0

while IFS= read -r issue; do
    number=$(echo "$issue" | jq -r '.number')

    # Check if already validated
    skip=0
    for vnum in "${validated_numbers[@]}"; do
        if [ "$vnum" -eq "$number" ]; then
            skip=1
            break
        fi
    done

    if [ "$skip" -eq 0 ]; then
        batch+=("$issue")
        count=$((count + 1))

        if [ "$count" -ge "$BATCH_SIZE" ]; then
            break
        fi
    fi
done < <(jq -c '.[]' "$ISSUES_FILE")

echo "Batch ready: ${#batch[@]} issues to review"
echo ""
echo "=== Batch Contents ==="
for item in "${batch[@]}"; do
    num=$(echo "$item" | jq -r '.number')
    title=$(echo "$item" | jq -r '.title')
    url=$(echo "$item" | jq -r '.url')
    updated=$(echo "$item" | jq -r '.updated_at')

    echo "#$num: $title"
    echo "  URL: $url"
    echo "  Last updated: $updated"
    echo ""
done

echo "=== Next Steps ==="
echo ""
echo "For AI-assisted validation:"
echo "1. Review each issue URL above"
echo "2. For each issue, determine: valid, invalid, needs-info, or needs-triage"
echo "3. Record decision in validated.jsonl:"
echo ""
echo "   echo '{\"number\": 12345, \"decision\": \"invalid\", \"reason\": \"Already fixed in v1.2\", \"validated_at\": \"'"\$(date -Iseconds)"'\"}' >> $VALIDATED_FILE"
echo ""
echo "4. Run this script again to get next batch"
echo ""
echo "Tip: Save batch to separate file for processing:"
printf '%s\n' "${batch[@]}" | jq -s '.' > "$PROGRESS_DIR/current-batch.json"
echo "  Saved to: $PROGRESS_DIR/current-batch.json"

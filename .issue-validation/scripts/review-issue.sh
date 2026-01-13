#!/bin/bash
# Helper script to record issue analysis

ANALYSIS_FILE="$(dirname "$0")/../progress/issue-analysis.jsonl"

if [ "$#" -lt 3 ]; then
    echo "Usage: $0 <issue_number> <type:bug|enhancement> <recommendation:open|needs-info|close> [priority:critical|high|medium|low] [reason]"
    exit 1
fi

issue_number="$1"
issue_type="$2"
recommendation="$3"
priority="${4:-medium}"
reason="${5:-}"

# Create analysis record
cat >> "$ANALYSIS_FILE" <<EOF
{"number":$issue_number,"type":"$issue_type","recommendation":"$recommendation","priority":"$priority","reason":"$reason","analyzed_at":"$(date -Iseconds)"}
EOF

echo "✅ Recorded analysis for issue #$issue_number: $recommendation ($priority priority)"

#!/bin/bash
set -e

# Fetch all open issues from Automattic/jetpack repository
# Excludes pull requests, includes only actual issues

REPO="Automattic/jetpack"
OUTPUT_DIR="$(dirname "$0")/../data"
ISSUES_FILE="$OUTPUT_DIR/issues.json"
TEMP_FILE="$OUTPUT_DIR/issues-temp.json"

mkdir -p "$OUTPUT_DIR"

echo "Fetching open issues from $REPO..."
echo "This may take several minutes for ~2.5k issues..."

# Initialize empty array
echo "[]" > "$TEMP_FILE"

page=1
total_fetched=0

while true; do
    echo "Fetching page $page..."

    # Fetch page of issues (100 per page, max allowed by GitHub API)
    # Filter out pull requests by checking for pull_request field
    response=$(curl -s "https://api.github.com/repos/$REPO/issues?state=open&per_page=100&page=$page")

    # Check if response is empty array or error
    if [ "$(echo "$response" | jq '. | length')" -eq 0 ]; then
        echo "No more issues found."
        break
    fi

    # Filter out pull requests (they have a "pull_request" field)
    # and extract relevant fields
    filtered=$(echo "$response" | jq '[.[] | select(.pull_request == null) | {
        number: .number,
        title: .title,
        url: .html_url,
        api_url: .url,
        state: .state,
        created_at: .created_at,
        updated_at: .updated_at,
        closed_at: .closed_at,
        labels: [.labels[].name],
        assignees: [.assignees[].login],
        milestone: .milestone.title,
        author: .user.login,
        comments_count: .comments,
        locked: .locked,
        body_preview: (.body // "" | .[0:200])
    }]')

    # Check how many items we got from API (before filtering)
    api_count=$(echo "$response" | jq '. | length')

    count=$(echo "$filtered" | jq '. | length')
    total_fetched=$((total_fetched + count))

    echo "  Found $count issues on this page (API returned $api_count items, total issues: $total_fetched)"

    # Merge with existing data
    jq -s '.[0] + .[1]' "$TEMP_FILE" <(echo "$filtered") > "$TEMP_FILE.new"
    mv "$TEMP_FILE.new" "$TEMP_FILE"

    # Check if API returned less than 100 items, meaning this is the last page
    if [ "$api_count" -lt 100 ]; then
        echo "  API returned less than 100 items, this is the last page."
        break
    fi

    page=$((page + 1))

    # Rate limiting: GitHub API allows 60 requests/hour for unauthenticated
    # Add small delay to be respectful
    sleep 1
done

# Move temp file to final location
mv "$TEMP_FILE" "$ISSUES_FILE"

echo ""
echo "✅ Successfully fetched $total_fetched open issues"
echo "📁 Saved to: $ISSUES_FILE"

# Generate summary statistics
echo ""
echo "=== Summary Statistics ==="
echo "Total open issues: $(jq '. | length' "$ISSUES_FILE")"
echo ""
echo "By age:"
jq -r '
    map(
        (.created_at | fromdateiso8601) as $created |
        (now - $created) / 86400 | floor as $days |
        if $days < 90 then "< 3 months"
        elif $days < 180 then "3-6 months"
        elif $days < 365 then "6-12 months"
        else "> 1 year"
        end
    ) | group_by(.) | map({key: .[0], count: length}) | .[] |
    "  \(.key): \(.count)"
' "$ISSUES_FILE"

echo ""
echo "By last activity:"
jq -r '
    map(
        (.updated_at | fromdateiso8601) as $updated |
        (now - $updated) / 86400 | floor as $days |
        if $days < 30 then "< 1 month"
        elif $days < 90 then "1-3 months"
        elif $days < 180 then "3-6 months"
        elif $days < 365 then "6-12 months"
        else "> 1 year"
        end
    ) | group_by(.) | map({key: .[0], count: length}) | .[] |
    "  \(.key): \(.count)"
' "$ISSUES_FILE"

echo ""
echo "Top 10 labels:"
jq -r '
    [.[].labels[]] | group_by(.) | map({label: .[0], count: length}) |
    sort_by(-.count) | .[0:10] | .[] |
    "  \(.label): \(.count)"
' "$ISSUES_FILE"

echo ""
echo "Next step: Review validation criteria in specs/validation-criteria.md"

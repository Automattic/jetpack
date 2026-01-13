#!/bin/bash
set -e

# Fetch additional issues using GitHub Search API
# Search API has different pagination limits than REST API

DATA_DIR="$(dirname "$0")/../data"
EXISTING_FILE="$DATA_DIR/issues.json"
NEW_FILE="$DATA_DIR/issues-extended.json"
TEMP_FILE="$DATA_DIR/issues-search-temp.json"

# Get the oldest issue date from existing data to avoid duplicates
OLDEST_DATE=$(jq -r '.[-1].updated_at' "$EXISTING_FILE")
EXISTING_COUNT=$(jq '. | length' "$EXISTING_FILE")

echo "Existing issues: $EXISTING_COUNT"
echo "Oldest in existing data: $OLDEST_DATE"
echo ""
echo "Fetching older issues using Search API..."
echo ""

# Initialize with existing data
cp "$EXISTING_FILE" "$NEW_FILE"

# Fetch issues older than what we have
page=1
new_count=0

while [ $page -le 10 ]; do
    echo "Fetching page $page..."

    # Use search API to get issues updated before our oldest date
    response=$(curl -s "https://api.github.com/search/issues?q=repo:Automattic/jetpack+is:issue+is:open+updated:<${OLDEST_DATE}&per_page=100&page=$page")

    # Check if we got results
    count=$(echo "$response" | jq '.items | length')

    if [ "$count" -eq 0 ]; then
        echo "No more results"
        break
    fi

    # Extract and filter issue data
    issues=$(echo "$response" | jq '[.items[] | {
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

    # Merge with existing
    jq -s '.[0] + .[1]' "$NEW_FILE" <(echo "$issues") > "$TEMP_FILE"
    mv "$TEMP_FILE" "$NEW_FILE"

    new_count=$((new_count + count))
    echo "  Added $count issues (total new: $new_count)"

    # Update oldest date for next iteration
    OLDEST_DATE=$(echo "$response" | jq -r '.items[-1].updated_at')

    page=$((page + 1))
    sleep 1
done

FINAL_COUNT=$(jq '. | length' "$NEW_FILE")

echo ""
echo "✅ Extended fetch complete!"
echo "Previous count: $EXISTING_COUNT"
echo "New issues added: $new_count"
echo "Total now: $FINAL_COUNT"
echo ""
echo "📁 Saved to: $NEW_FILE"

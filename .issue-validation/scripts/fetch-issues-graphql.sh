#!/bin/bash
set -e

# Fetch all open issues using GitHub GraphQL API (supports better pagination)
# Note: Requires GitHub CLI (gh) for authentication, or set GITHUB_TOKEN env var

REPO_OWNER="Automattic"
REPO_NAME="jetpack"
OUTPUT_DIR="$(dirname "$0")/../data"
ISSUES_FILE="$OUTPUT_DIR/issues-graphql.json"

mkdir -p "$OUTPUT_DIR"

echo "Fetching all open issues using GraphQL API..."
echo "This will fetch ALL issues, bypassing REST API pagination limits."
echo ""

# Check if we have authentication
if [ -z "$GITHUB_TOKEN" ]; then
    echo "⚠️  Warning: No GITHUB_TOKEN set. Unauthenticated requests are rate-limited."
    echo "   To fetch all 2.5k+ issues, set GITHUB_TOKEN or install gh CLI."
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    AUTH_HEADER=""
else
    AUTH_HEADER="Authorization: bearer $GITHUB_TOKEN"
fi

# GraphQL query to fetch issues (not PRs)
query='
query($owner: String!, $name: String!, $cursor: String) {
  repository(owner: $owner, name: $name) {
    issues(first: 100, after: $cursor, states: OPEN, orderBy: {field: CREATED_AT, direction: DESC}) {
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
      nodes {
        number
        title
        url
        createdAt
        updatedAt
        closedAt
        state
        locked
        author {
          login
        }
        labels(first: 20) {
          nodes {
            name
          }
        }
        assignees(first: 10) {
          nodes {
            login
          }
        }
        milestone {
          title
        }
        comments {
          totalCount
        }
        body
      }
    }
  }
}
'

# Initialize variables
cursor="null"
has_next_page=true
all_issues="[]"
total_fetched=0
page=1

while [ "$has_next_page" = "true" ]; do
    echo "Fetching page $page..."

    # Build GraphQL request
    if [ "$cursor" = "null" ]; then
        variables="{\"owner\": \"$REPO_OWNER\", \"name\": \"$REPO_NAME\"}"
    else
        variables="{\"owner\": \"$REPO_OWNER\", \"name\": \"$REPO_NAME\", \"cursor\": $cursor}"
    fi

    payload=$(jq -n \
        --arg query "$query" \
        --argjson variables "$variables" \
        '{query: $query, variables: $variables}')

    # Make request
    if [ -n "$AUTH_HEADER" ]; then
        response=$(curl -s -X POST \
            -H "Content-Type: application/json" \
            -H "$AUTH_HEADER" \
            -d "$payload" \
            https://api.github.com/graphql)
    else
        response=$(curl -s -X POST \
            -H "Content-Type: application/json" \
            -d "$payload" \
            https://api.github.com/graphql)
    fi

    # Check for errors
    errors=$(echo "$response" | jq '.errors // []')
    if [ "$errors" != "[]" ]; then
        echo "❌ GraphQL Error:"
        echo "$errors" | jq .
        exit 1
    fi

    # Extract issues
    issues=$(echo "$response" | jq '.data.repository.issues.nodes // [] | map({
        number: .number,
        title: .title,
        url: .url,
        state: .state,
        created_at: .createdAt,
        updated_at: .updatedAt,
        closed_at: .closedAt,
        labels: [.labels.nodes[].name],
        assignees: [.assignees.nodes[].login],
        milestone: .milestone.title,
        author: .author.login,
        comments_count: .comments.totalCount,
        locked: .locked,
        body_preview: (.body // "" | .[0:200])
    })')

    count=$(echo "$issues" | jq '. | length')
    total_fetched=$((total_fetched + count))

    total_count=$(echo "$response" | jq '.data.repository.issues.totalCount')
    echo "  Found $count issues (total so far: $total_fetched / $total_count)"

    # Merge with existing data
    all_issues=$(jq -s '.[0] + .[1]' <(echo "$all_issues") <(echo "$issues"))

    # Check pagination
    has_next_page=$(echo "$response" | jq -r '.data.repository.issues.pageInfo.hasNextPage')
    cursor=$(echo "$response" | jq -r '.data.repository.issues.pageInfo.endCursor | @json')

    page=$((page + 1))

    # Be nice to API
    sleep 0.5
done

# Save results
echo "$all_issues" | jq 'sort_by(.number) | reverse' > "$ISSUES_FILE"

echo ""
echo "✅ Successfully fetched $total_fetched open issues"
echo "📁 Saved to: $ISSUES_FILE"

# Generate summary
echo ""
echo "=== Summary ==="
/home/user/jetpack/.issue-validation/scripts/generate-summary.sh "$ISSUES_FILE"

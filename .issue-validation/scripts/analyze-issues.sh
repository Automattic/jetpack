#!/bin/bash
set -e

# Analyze fetched issues and categorize by validation priority

DATA_DIR="$(dirname "$0")/../data"
OUTPUT_DIR="$(dirname "$0")/../reports"
ISSUES_FILE="$DATA_DIR/issues.json"

mkdir -p "$OUTPUT_DIR"

if [ ! -f "$ISSUES_FILE" ]; then
    echo "❌ Error: Issues file not found. Run fetch-issues.sh first."
    exit 1
fi

echo "Analyzing issues for validation priority..."

# Generate categorized lists for efficient batch processing

# Category 1: High priority - likely stale (no activity > 1 year)
echo "Creating Category 1: Likely stale issues (no activity > 1 year)..."
jq '[.[] | select(
    (.updated_at | sub("\\+00:00$"; "Z") | fromdateiso8601) as $updated |
    (now - $updated) / 86400 > 365
)] | sort_by(.updated_at) | {
    count: length,
    issues: map({
        number: .number,
        title: .title,
        url: .url,
        created_at: .created_at,
        updated_at: .updated_at,
        days_inactive: (((now - (.updated_at | sub("\\+00:00$"; "Z") | fromdateiso8601)) / 86400) | floor),
        labels: .labels,
        comments_count: .comments_count
    })
}' "$ISSUES_FILE" > "$OUTPUT_DIR/category-1-likely-stale.json"

cat_1_count=$(jq '.count' "$OUTPUT_DIR/category-1-likely-stale.json")
echo "  ✅ Found $cat_1_count likely stale issues"

# Category 2: Needs author reply (has label, old)
echo "Creating Category 2: Needs author reply (> 3 months)..."
jq '[.[] | select(
    (.labels | map(select(. | contains("Needs Author Reply") or contains("needs-feedback"))) | length > 0) and
    (.updated_at | sub("\\+00:00$"; "Z") | fromdateiso8601) as $updated |
    (now - $updated) / 86400 > 90
)] | sort_by(.updated_at) | {
    count: length,
    issues: map({
        number: .number,
        title: .title,
        url: .url,
        updated_at: .updated_at,
        days_inactive: (((now - (.updated_at | sub("\\+00:00$"; "Z") | fromdateiso8601)) / 86400) | floor),
        labels: .labels,
        comments_count: .comments_count
    })
}' "$ISSUES_FILE" > "$OUTPUT_DIR/category-2-needs-reply.json"

cat_2_count=$(jq '.count' "$OUTPUT_DIR/category-2-needs-reply.json")
echo "  ✅ Found $cat_2_count issues needing author reply"

# Category 3: Zero engagement (0 comments, old)
echo "Creating Category 3: Zero engagement issues..."
jq '[.[] | select(
    .comments_count == 0 and
    (.created_at | sub("\\+00:00$"; "Z") | fromdateiso8601) as $created |
    (now - $created) / 86400 > 180
)] | sort_by(.created_at) | {
    count: length,
    issues: map({
        number: .number,
        title: .title,
        url: .url,
        created_at: .created_at,
        age_days: (((now - (.created_at | sub("\\+00:00$"; "Z") | fromdateiso8601)) / 86400) | floor),
        labels: .labels
    })
}' "$ISSUES_FILE" > "$OUTPUT_DIR/category-3-zero-engagement.json"

cat_3_count=$(jq '.count' "$OUTPUT_DIR/category-3-zero-engagement.json")
echo "  ✅ Found $cat_3_count zero-engagement issues"

# Category 4: Active/Recent (last 3 months) - lower priority for cleanup
echo "Creating Category 4: Recently active issues..."
jq '[.[] | select(
    (.updated_at | sub("\\+00:00$"; "Z") | fromdateiso8601) as $updated |
    (now - $updated) / 86400 < 90
)] | sort_by(.updated_at) | reverse | {
    count: length,
    issues: map({
        number: .number,
        title: .title,
        url: .url,
        updated_at: .updated_at,
        labels: .labels,
        milestone: .milestone
    })
}' "$ISSUES_FILE" > "$OUTPUT_DIR/category-4-recent.json"

cat_4_count=$(jq '.count' "$OUTPUT_DIR/category-4-recent.json")
echo "  ✅ Found $cat_4_count recently active issues"

# Category 5: Medium age (3-12 months) - manual review
echo "Creating Category 5: Medium-age issues (3-12 months inactive)..."
jq '[.[] | select(
    (.updated_at | sub("\\+00:00$"; "Z") | fromdateiso8601) as $updated |
    (now - $updated) / 86400 >= 90 and (now - $updated) / 86400 <= 365
)] | sort_by(.updated_at) | {
    count: length,
    issues: map({
        number: .number,
        title: .title,
        url: .url,
        updated_at: .updated_at,
        days_inactive: (((now - (.updated_at | sub("\\+00:00$"; "Z") | fromdateiso8601)) / 86400) | floor),
        labels: .labels,
        comments_count: .comments_count
    })
}' "$ISSUES_FILE" > "$OUTPUT_DIR/category-5-medium-age.json"

cat_5_count=$(jq '.count' "$OUTPUT_DIR/category-5-medium-age.json")
echo "  ✅ Found $cat_5_count medium-age issues"

# Generate validation priority report
echo ""
echo "=== Validation Priority Report ==="
echo "Recommended order for validation:"
echo ""
echo "1️⃣  Category 1 - Likely Stale (> 1 year inactive): $cat_1_count issues"
echo "    Quick wins - add 'confirm still relevant' comment or close"
echo ""
echo "2️⃣  Category 3 - Zero Engagement (> 6 months old, 0 comments): $cat_3_count issues"
echo "    Likely spam, unclear, or not actionable - review and close"
echo ""
echo "3️⃣  Category 2 - Needs Author Reply (> 3 months): $cat_2_count issues"
echo "    Waiting on reporter - close with 'no response' template"
echo ""
echo "4️⃣  Category 5 - Medium Age (3-12 months): $cat_5_count issues"
echo "    Manual review needed - still potentially relevant"
echo ""
echo "5️⃣  Category 4 - Recently Active (< 3 months): $cat_4_count issues"
echo "    Lower priority - likely still valid"
echo ""

total=$((cat_1_count + cat_2_count + cat_3_count + cat_4_count + cat_5_count))
echo "📊 Total: $total issues"
echo ""
echo "📁 Reports saved to: $OUTPUT_DIR/"
echo ""
echo "💡 Next steps:"
echo "   1. Review category-1-likely-stale.json - these are best candidates for cleanup"
echo "   2. Use scripts/validate-batch.sh to process batches"
echo "   3. Track progress in progress/progress.json"

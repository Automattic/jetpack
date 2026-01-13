#!/bin/bash
# Automatically analyze zero-engagement issues based on clear patterns

CATEGORY_FILE="/home/user/jetpack/.issue-validation/reports/category-3-zero-engagement.json"
OUTPUT_FILE="/home/user/jetpack/.issue-validation/analysis/category-3-automated-analysis.json"

echo "Analyzing zero-engagement issues..."

jq '{
  category: "Zero Engagement (>6 months, 0 comments)",
  total_issues: .count,
  analyzed_date: "2026-01-13",
  analysis_method: "automated_pattern_matching",

  recommendations: {
    close: [
      .issues[] | select(
        (.age_days > 1000 and (.labels | map(select(. == "[Type] Enhancement" or . == "[Type] Feature Request")) | length > 0)) or
        (.age_days > 1200 and (.labels | map(select(. == "[Type] Bug")) | length > 0) and (.labels | map(select(. == "[Pri] Low")) | length > 0)) or
        (.labels | map(select(. == "[Status] Stale")) | length > 0)
      ) | {
        number,
        title,
        age_days,
        labels,
        reason: (
          if (.labels | map(select(. == "[Status] Stale")) | length > 0) then "Already marked stale"
          elif (.age_days > 1000 and (.labels | map(select(. == "[Type] Enhancement" or . == "[Type] Feature Request")) | length > 0)) then "Old enhancement with zero community interest"
          else "Old low-priority bug with zero engagement"
          end
        )
      }
    ],

    needs_triage: [
      .issues[] | select(
        .age_days < 1000 and
        (.labels | map(select(. == "[Type] Bug")) | length > 0) and
        (.labels | map(select(. == "[Pri] High" or . == "[Pri] Normal")) | length > 0) and
        (.labels | map(select(. == "[Status] Stale")) | length == 0)
      ) | {
        number,
        title,
        age_days,
        labels,
        reason: "Recent bug with no engagement - needs review"
      }
    ],

    possible_spam: [
      .issues[] | select(
        .age_days > 700 and
        (.labels | length == 0 or (.labels | map(select(. == "Needs triage")) | length > 0))
      ) | {
        number,
        title,
        age_days,
        labels,
        reason: "Old issue with no labels or only needs-triage - likely incomplete/spam"
      }
    ]
  },

  summary: {
    recommend_close: [.issues[] | select(
      (.age_days > 1000 and (.labels | map(select(. == "[Type] Enhancement" or . == "[Type] Feature Request")) | length > 0)) or
      (.age_days > 1200 and (.labels | map(select(. == "[Type] Bug")) | length > 0) and (.labels | map(select(. == "[Pri] Low")) | length > 0)) or
      (.labels | map(select(. == "[Status] Stale")) | length > 0)
    )] | length,

    needs_triage: [.issues[] | select(
      .age_days < 1000 and
      (.labels | map(select(. == "[Type] Bug")) | length > 0) and
      (.labels | map(select(. == "[Pri] High" or . == "[Pri] Normal")) | length > 0) and
      (.labels | map(select(. == "[Status] Stale")) | length == 0)
    )] | length,

    possible_spam: [.issues[] | select(
      .age_days > 700 and
      (.labels | length == 0 or (.labels | map(select(. == "Needs triage")) | length > 0))
    )] | length
  }
}' "$CATEGORY_FILE" > "$OUTPUT_FILE"

echo "✅ Analysis complete!"
echo ""
jq '.summary' "$OUTPUT_FILE"
echo ""
echo "📁 Detailed analysis saved to: $OUTPUT_FILE"

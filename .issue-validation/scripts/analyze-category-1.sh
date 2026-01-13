#!/bin/bash
# Automated analysis of Category 1 (likely stale, >1 year inactive)

INPUT="/home/user/jetpack/.issue-validation/reports/category-1-likely-stale.json"
OUTPUT="/home/user/jetpack/.issue-validation/analysis/category-1-analysis.json"

echo "Analyzing Category 1: Likely Stale Issues (>1 year inactive)..."

jq '{
  category: "Likely Stale (>1 year inactive)",
  total_issues: .count,
  analyzed_date: "2026-01-13",
  analysis_method: "automated_pattern_matching",

  summary: {
    total: .count,
    recommend_close: (
      [.issues[] | select(
        (.labels | any(. == "[Status] Stale")) or
        (.days_inactive > 730 and (.labels | any(. == "[Type] Enhancement" or . == "[Type] Feature Request"))) or
        (.days_inactive > 1095 and (.labels | any(. == "[Pri] Low") or (.labels | any(startswith("[Pri]")) | not)))
      )] | length
    ),
    keep_open: (
      [.issues[] | select(
        (.labels | any(. == "[Status] Auto-allocated" or . == "Triaged" or . == "[Status] Escalated to Product Ambassadors")) and
        (.labels | any(. == "[Status] Stale") | not) and
        .days_inactive < 730
      )] | length
    ),
    needs_review: (
      [.issues[] | select(
        (.labels | any(. == "[Type] Bug")) and
        (.labels | any(. == "[Pri] Normal" or . == "[Pri] High")) and
        (.labels | any(. == "[Status] Stale") | not) and
        .days_inactive > 365 and .days_inactive < 730
      )] | length
    )
  },

  recommendations: {

    high_confidence_close: [
      .issues[] | select(
        (.labels | any(. == "[Status] Stale")) or
        (.days_inactive > 1095 and (.labels | any(. == "[Pri] Low") or (.labels | any(startswith("[Pri]")) | not))) or
        (.days_inactive > 730 and (.labels | any(. == "[Type] Enhancement" or . == "[Type] Feature Request")) and .comments_count == 0)
      ) | {
        number,
        title,
        url,
        days_inactive,
        labels,
        comments_count,
        closure_reason: (
          if (.labels | any(. == "[Status] Stale")) then "already_marked_stale"
          elif .days_inactive > 1095 then "very_old_low_priority"
          else "old_enhancement_no_engagement"
          end
        )
      }
    ] | sort_by(-.days_inactive),

    medium_confidence_close: [
      .issues[] | select(
        (.days_inactive > 730 and (.labels | any(. == "[Type] Enhancement" or . == "[Type] Feature Request")) and .comments_count > 0) or
        (.days_inactive > 900 and (.labels | any(. == "[Type] Bug")) and (.labels | any(. == "[Pri] Low")))
      ) | {
        number,
        title,
        url,
        days_inactive,
        labels,
        comments_count,
        closure_reason: (
          if (.labels | any(. == "[Type] Bug")) then "old_low_priority_bug"
          else "old_enhancement_minimal_engagement"
          end
        )
      }
    ] | sort_by(-.days_inactive),

    keep_open: [
      .issues[] | select(
        (.labels | any(. == "[Status] Auto-allocated" or . == "Triaged" or . == "[Status] Escalated to Product Ambassadors")) and
        (.labels | any(. == "[Status] Stale") | not) and
        (
          (.labels | any(. == "[Type] Bug")) or
          (.labels | any(. == "[Pri] Normal" or . == "[Pri] High")) or
          .comments_count > 5
        )
      ) | {
        number,
        title,
        url,
        days_inactive,
        labels,
        comments_count,
        keep_reason: (
          if (.labels | any(. == "[Status] Escalated to Product Ambassadors")) then "escalated"
          elif (.labels | any(. == "[Status] Auto-allocated")) then "assigned"
          elif (.labels | any(. == "Triaged")) then "triaged"
          elif .comments_count > 5 then "active_discussion"
          else "valid_bug_or_priority"
          end
        )
      }
    ] | sort_by(.days_inactive),

    needs_manual_review: [
      .issues[] | select(
        (.labels | any(. == "[Type] Bug")) and
        (.labels | any(. == "[Pri] Normal")) and
        (.labels | any(. == "[Status] Stale") | not) and
        (.labels | any(. == "[Status] Auto-allocated" or . == "Triaged") | not) and
        .days_inactive > 500 and .days_inactive < 900
      ) | {
        number,
        title,
        url,
        days_inactive,
        labels,
        comments_count,
        review_reason: "normal_priority_bug_needs_verification"
      }
    ] | sort_by(-.days_inactive)
  }
}' "$INPUT" > "$OUTPUT"

echo "✅ Category 1 analysis complete!"
echo ""
echo "Summary:"
jq '.summary' "$OUTPUT"
echo ""
echo "High confidence closures: $(jq '.recommendations.high_confidence_close | length' "$OUTPUT")"
echo "Medium confidence closures: $(jq '.recommendations.medium_confidence_close | length' "$OUTPUT")"
echo "Keep open: $(jq '.recommendations.keep_open | length' "$OUTPUT")"
echo "Needs manual review: $(jq '.recommendations.needs_manual_review | length' "$OUTPUT")"
echo ""
echo "📁 Full analysis: $OUTPUT"

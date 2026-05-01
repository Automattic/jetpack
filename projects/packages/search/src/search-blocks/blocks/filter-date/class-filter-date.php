<?php
/**
 * Filter-date block helpers.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Helper methods for the jetpack/filter-date block.
 *
 * Mirrors Filter_Checkbox so the page-level filterConfig seed walk in
 * Search_Blocks::collect_filter_configs_from_post() and the block's own
 * render.php share one source of truth. The block groups search hits into
 * yearly or monthly buckets via an Elasticsearch date_histogram aggregation;
 * selecting a bucket narrows the result set with a `range` filter clause.
 */
class Filter_Date {

	/**
	 * URL key the filter selections round-trip under (`?post_date[]=2024`).
	 * Doubles as the JS-side filterKey; the JS store uses `date` separately
	 * as the WPCOM Search aggregation/filter field.
	 *
	 * Constant rather than configurable because the v1.3 search API only
	 * whitelists `date` for date_histogram aggs — the other WP date columns
	 * (`date_modified`, etc.) return `bad_request` on this endpoint, so
	 * exposing a field selector would let authors build queries that 400
	 * silently. Filtering by publish date is also what visitors expect from
	 * a "filter by year" UI.
	 */
	const FILTER_KEY = 'post_date';

	/**
	 * Date histogram intervals exposed to authors. Year is the most common
	 * "filter by year" shape; month is for archive-heavy news/blog sites.
	 * `calendar_interval` semantics are documented at
	 * https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-datehistogram-aggregation.html
	 */
	const ALLOWED_INTERVALS = array( 'year', 'month' );

	/**
	 * Derive a stable, URL-safe filter key from block attributes.
	 *
	 * Always returns the constant `FILTER_KEY` since the block has no
	 * field selector — the WPCOM Search v1.3 endpoint only accepts `date`
	 * for date_histogram aggs. The signature still takes attributes to
	 * stay drop-in compatible with the helper-class registry shape used
	 * by `Search_Blocks::walk_blocks_for_filter_configs()`.
	 *
	 * The reserved-query-param collision check that sits inside
	 * Filter_Checkbox::derive_filter_key() is unnecessary here — both
	 * sides are constants, so any collision is a development-time error
	 * caught by `test_filter_key_does_not_collide_with_reserved_params`
	 * rather than a runtime branch. Phan's `PhanImpossibleTypeComparison`
	 * sniff also flags the runtime check as provably-dead given today's
	 * constants.
	 *
	 * @param array $_attributes Block attributes (unused, kept for shape).
	 * @return string Filter key.
	 */
	public static function derive_filter_key( array $_attributes ): string {
		// Underscore-prefixed parameter name signals "intentionally unused"
		// to readers; VariableAnalysis doesn't honor that convention so we
		// "use" it here as a no-op to satisfy the sniff.
		unset( $_attributes );
		return self::FILTER_KEY;
	}

	/**
	 * Default group label for the date filter. Returns the localized "Date"
	 * label so a pattern can omit an explicit label and still render a
	 * sensible heading.
	 *
	 * @return string
	 */
	public static function default_label(): string {
		return __( 'Date', 'jetpack-search-pkg' );
	}

	/**
	 * Build the filterConfig entry this block contributes to the shared
	 * Interactivity state. JS reads this to construct the date_histogram
	 * aggregation, the `range` filter clause, and (when the active-filters
	 * pill formatter task lands) the date pill display label.
	 *
	 * `filterType` is set to 'date' so store/api.js can branch on it and
	 * route the filter through the date_histogram / range path instead of
	 * the term aggregation / term clause path the other filter types use.
	 *
	 * @param array  $attributes Block attributes.
	 * @param string $filter_key Result of derive_filter_key().
	 * @return array<string, mixed>
	 */
	public static function build_config( array $attributes, string $filter_key ): array {
		$label = sanitize_text_field( (string) ( $attributes['label'] ?? '' ) );
		if ( '' === $label ) {
			$label = static::default_label();
		}

		return array(
			'filterKey'       => $filter_key,
			'filterType'      => 'date',
			'interval'        => static::normalize_interval( $attributes['interval'] ?? null ),
			'label'           => $label,
			'showCount'       => (bool) ( $attributes['showCount'] ?? true ),
			'maxItems'        => max( 1, (int) ( $attributes['maxItems'] ?? 10 ) ),
			'bucketSortOrder' => static::normalize_bucket_sort_order( $attributes['bucketSortOrder'] ?? null ),
		);
	}

	/**
	 * Normalize the interval attribute to one of ALLOWED_INTERVALS. Unknown
	 * values fall back to `year` so the seeded filterConfig always carries a
	 * valid `calendar_interval` for the date_histogram aggregation.
	 *
	 * @param mixed $value Raw attribute value.
	 * @return string Either 'year' or 'month'.
	 */
	public static function normalize_interval( $value ): string {
		$value = (string) $value;
		return in_array( $value, self::ALLOWED_INTERVALS, true ) ? $value : 'year';
	}

	/**
	 * Normalize bucketSortOrder. Date filters default to `newest` (most-recent
	 * bucket first) since visitors usually expect "this month" or "this year"
	 * to lead the list — diverges from filter-checkbox where the legacy
	 * instant-search default `count` makes more sense.
	 *
	 * @param mixed $value Raw attribute value.
	 * @return string One of 'newest' | 'oldest' | 'count'.
	 */
	public static function normalize_bucket_sort_order( $value ): string {
		if ( 'oldest' === $value ) {
			return 'oldest';
		}
		if ( 'count' === $value ) {
			return 'count';
		}
		return 'newest';
	}
}

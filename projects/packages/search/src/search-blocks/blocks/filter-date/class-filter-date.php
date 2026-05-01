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
 * Mirrors Filter_Checkbox so the SSR seed path, the block render, and any
 * future server-side bucket formatting share one source of truth. The block
 * groups search hits into yearly or monthly buckets via an Elasticsearch
 * date_histogram aggregation; selecting a bucket narrows the result set with
 * a `range` filter clause.
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
	 * by `Search_Blocks::walk_blocks_for_filter_configs()`. Returns ''
	 * if the URL key collides with a reserved query param so the render
	 * short-circuits rather than registering a clobbered filterConfig.
	 *
	 * @param array $_attributes Block attributes (unused, kept for shape).
	 * @return string Filter key.
	 */
	public static function derive_filter_key( array $_attributes ): string {
		// Underscore-prefixed parameter name signals "intentionally unused"
		// to readers; VariableAnalysis doesn't honor that convention so we
		// "use" it here as a no-op to satisfy the sniff.
		unset( $_attributes );
		if ( in_array( self::FILTER_KEY, Search_Blocks::RESERVED_QUERY_PARAMS, true ) ) {
			return '';
		}
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

	/**
	 * Format a date_histogram bucket key as a human-readable label.
	 *
	 * Used as the canonical server-side formatter so any SSR consumer (and
	 * the active-filter pill PHP path, when added) produces the same label
	 * the client view bundle does. The JS counterpart in store/api.js mirrors
	 * the `month` formatting via `Intl.DateTimeFormat`; for year buckets the
	 * label is the bare four-digit year on both sides.
	 *
	 * `wp_date()` honours the site's timezone and locale, which matches how
	 * the rest of Jetpack Search labels dates on the front end.
	 *
	 * @param string $bucket_key Bucket key as produced by ES `date_histogram`
	 *                           with the formats this block requests — `Y` for
	 *                           year buckets, `Y-m` for month buckets.
	 * @param string $interval   'year' | 'month'.
	 * @return string Formatted label, or the raw key when it can't be parsed.
	 */
	public static function format_bucket_label( string $bucket_key, string $interval ): string {
		if ( '' === $bucket_key ) {
			return '';
		}
		// Year buckets render verbatim — `2024` doesn't need locale-specific
		// formatting and `wp_date()` would surround it with extraneous
		// surroundings on some locales (e.g. era markers).
		if ( 'year' === $interval ) {
			return $bucket_key;
		}

		// Strict `Y-m` parse. strtotime() alone is too lenient — it would
		// gladly accept `not-a-date-01 00:00:00` as a relative expression
		// and silently anchor it on `today`. Regex-gate the slug shape so
		// only well-formed bucket keys make it to wp_date().
		if ( ! preg_match( '/^(\d{4})-(\d{2})$/', $bucket_key, $matches ) ) {
			return $bucket_key;
		}
		$month = (int) $matches[2];
		if ( $month < 1 || $month > 12 ) {
			return $bucket_key;
		}
		// Anchor the timestamp explicitly in UTC. `strtotime()` reads the
		// PHP server timezone (typically UTC, but not guaranteed); `wp_date()`
		// then converts the timestamp to the WordPress site timezone before
		// formatting. On a site configured to a large negative UTC offset
		// (e.g. UTC-12, Baker Island), a server-TZ midnight of `2024-01-01`
		// shifts back into `December 2023` once `wp_date()` applies the site
		// offset. Using DateTimeImmutable with a fixed UTC zone keeps the
		// PHP path bit-identical to the JS side, which uses
		// `Date.UTC(year, month - 1, 1)` paired with `timeZone: 'UTC'`.
		$dt = \DateTimeImmutable::createFromFormat(
			'Y-m-d H:i:s',
			$bucket_key . '-01 00:00:00',
			new \DateTimeZone( 'UTC' )
		);
		if ( false === $dt ) {
			return $bucket_key;
		}
		$timestamp = $dt->getTimestamp();
		/* translators: PHP date() format string for month + year bucket labels (e.g. `F Y` → "March 2024"). See https://www.php.net/manual/en/datetime.format.php for token reference. */
		return (string) wp_date( __( 'F Y', 'jetpack-search-pkg' ), $timestamp );
	}
}

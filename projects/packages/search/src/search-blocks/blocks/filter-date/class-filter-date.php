<?php
/**
 * Filter-date block helpers.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Helper for the jetpack/filter-date block. Mirrors Filter_Checkbox so the
 * page-level filterConfig seed walk and render.php share one source of truth.
 */
class Filter_Date {

	/**
	 * Filter key.
	 *
	 * Constant because WPCOM Search v1.3 only whitelists `date` for date_histogram aggs.
	 */
	const FILTER_KEY = 'post_date';

	const ALLOWED_INTERVALS = array( 'year', 'month' );

	/**
	 * Derive the filter key.
	 *
	 * @param array $_attributes Unused; kept for helper-registry shape.
	 * @return string
	 */
	public static function derive_filter_key( array $_attributes ): string {
		unset( $_attributes ); // Satisfy VariableAnalysis sniff.
		return self::FILTER_KEY;
	}

	/**
	 * Default group label.
	 *
	 * @return string
	 */
	public static function default_label(): string {
		return __( 'Date', 'jetpack-search-pkg' );
	}

	/**
	 * Build the filterConfig entry. `filterType: date` routes through
	 * date_histogram + range in store/api.js.
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
	 * Normalize interval to 'year' | 'month'.
	 *
	 * @param mixed $value Raw attribute value.
	 * @return string
	 */
	public static function normalize_interval( $value ): string {
		$value = (string) $value;
		return in_array( $value, self::ALLOWED_INTERVALS, true ) ? $value : 'year';
	}

	/**
	 * Normalize bucketSortOrder. Date filters default to `newest`; filter-checkbox
	 * defaults to `count` for legacy parity.
	 *
	 * @param mixed $value Raw attribute value.
	 * @return string 'newest' | 'oldest' | 'count'.
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

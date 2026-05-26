<?php
/**
 * Filter by WC rating block helpers.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Helpers for `jetpack-search/filter-wc-rating`. `filterType: 'wc_rating'`
 * drives the histogram agg + per-star range filter clauses in `store/api.js`
 * (see `WC_RATING_RANGES`).
 */
class Filter_Wc_Rating {

	/**
	 * URL + IA-state key. Mirrors WC's native `?rating_filter[]=N` so deep
	 * links interoperate with WC's own rating filter.
	 */
	const FILTER_KEY = 'rating_filter';

	/**
	 * Star option list, highest-first (conventional "& up" order). Each row
	 * applies a `≥ N − 0.5` threshold; 5★ has no "& up" suffix (no higher tier).
	 *
	 * @return int[]
	 */
	public static function get_star_values(): array {
		return array( 5, 4, 3, 2, 1 );
	}

	/**
	 * Author-configured subset of star rows. Empty/malformed falls back to
	 * all five so a stale attribute can't render an empty `<ul>`. Sanitized
	 * to 1..5, deduplicated, sorted high-to-low.
	 *
	 * @param array $attributes Block attributes.
	 * @return int[]
	 */
	public static function get_enabled_stars( array $attributes ): array {
		$raw = $attributes['enabledStars'] ?? null;
		if ( ! is_array( $raw ) || empty( $raw ) ) {
			return static::get_star_values();
		}
		$clean = array();
		foreach ( $raw as $value ) {
			$int = (int) $value;
			if ( $int >= 1 && $int <= 5 ) {
				$clean[ $int ] = $int;
			}
		}
		if ( empty( $clean ) ) {
			return static::get_star_values();
		}
		krsort( $clean );
		return array_values( $clean );
	}

	/**
	 * Filter key — constant. Method form mirrors `Filter_Checkbox::derive_filter_key()`.
	 *
	 * @param array $attributes Unused; interface parity.
	 * @return string
	 */
	public static function derive_filter_key( array $attributes = array() ): string { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return self::FILTER_KEY;
	}

	/**
	 * Default group label.
	 *
	 * @return string
	 */
	public static function default_label(): string {
		return __( 'Rating', 'jetpack-search-pkg' );
	}

	/**
	 * Build the filterConfig entry.
	 *
	 * @param array  $attributes Block attributes.
	 * @param string $key        Ignored; always `FILTER_KEY`.
	 * @return array<string, mixed>
	 */
	public static function build_config( array $attributes, string $key = '' ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$label = sanitize_text_field( (string) ( $attributes['label'] ?? '' ) );
		if ( '' === $label ) {
			$label = static::default_label();
		}

		return array(
			'filterKey'  => self::FILTER_KEY,
			'filterType' => 'wc_rating',
			'label'      => $label,
			'showCount'  => (bool) ( $attributes['showCount'] ?? true ),
		);
	}
}

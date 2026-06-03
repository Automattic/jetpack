<?php
/**
 * Search product filter — WC attribute block helpers.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Helpers for `jetpack-search/filter-wc-attribute` — each instance targets
 * one WC attribute taxonomy (`pa_color`, `pa_size`, …). Rides
 * `filterType: 'taxonomy'` so `resolveFilterFields()` doesn't need a new
 * branch; the block exists separately so the picker can constrain to `pa_*`.
 */
class Filter_Wc_Attribute {

	/**
	 * WC product-attribute taxonomy prefix. Single constant so picker,
	 * validator, and editor preview agree.
	 */
	const ATTRIBUTE_PREFIX = 'pa_';

	/**
	 * Derive the URL key from the chosen attribute slug. Empty / reserved /
	 * non-`pa_` slugs return '' so render.php bails before half-registering.
	 *
	 * @param array $attributes Block attributes.
	 * @return string
	 */
	public static function derive_filter_key( array $attributes ): string {
		$slug = sanitize_key( (string) ( $attributes['attributeTaxonomy'] ?? '' ) );
		if ( '' === $slug || in_array( $slug, Search_Blocks::RESERVED_QUERY_PARAMS, true ) ) {
			return '';
		}
		// Defensive: only `pa_*` slugs may reach this block.
		if ( 0 !== strpos( $slug, self::ATTRIBUTE_PREFIX ) ) {
			return '';
		}
		return $slug;
	}

	/**
	 * Default group label. Prefers the taxonomy's `singular_name`, falls back
	 * to humanized slug ("pa_screen_size" → "Screen Size").
	 *
	 * @param array $attributes Block attributes.
	 * @return string
	 */
	public static function default_label( array $attributes ): string {
		$slug = sanitize_key( (string) ( $attributes['attributeTaxonomy'] ?? '' ) );
		// Mirror the prefix guard so a direct caller skipping build_config gets ''.
		if ( '' === $slug || 0 !== strpos( $slug, self::ATTRIBUTE_PREFIX ) ) {
			return '';
		}
		if ( function_exists( 'get_taxonomy' ) ) {
			$tax = get_taxonomy( $slug );
			if ( $tax && ! empty( $tax->labels->singular_name ) ) {
				return (string) $tax->labels->singular_name;
			}
		}
		$bare = preg_replace( '/^' . preg_quote( self::ATTRIBUTE_PREFIX, '/' ) . '/', '', $slug );
		$bare = (string) str_replace( '_', ' ', (string) $bare );
		return ucwords( $bare );
	}

	/**
	 * Build the filterConfig entry. Rides `filterType: 'taxonomy'` →
	 * `taxonomy.<slug>.slug_slash_name` aggregation field.
	 *
	 * @param array  $attributes Block attributes.
	 * @param string $filter_key Result of `derive_filter_key()`.
	 * @return array<string, mixed>
	 */
	public static function build_config( array $attributes, string $filter_key ): array {
		$label = sanitize_text_field( (string) ( $attributes['label'] ?? '' ) );
		if ( '' === $label ) {
			$label = static::default_label( $attributes );
		}

		return array(
			'filterKey'       => $filter_key,
			'filterType'      => 'taxonomy',
			'taxonomy'        => $filter_key,
			'label'           => $label,
			'showCount'       => (bool) ( $attributes['showCount'] ?? true ),
			'maxItems'        => max( 1, (int) ( $attributes['maxItems'] ?? 10 ) ),
			'bucketSortOrder' => Filter_Checkbox::normalize_bucket_sort_order(
				$attributes['bucketSortOrder'] ?? null
			),
			'valueLabels'     => array(),
		);
	}
}

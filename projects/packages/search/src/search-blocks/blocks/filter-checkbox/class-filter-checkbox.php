<?php
/**
 * Filter-checkbox block helpers.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Helper methods for the jetpack/filter-checkbox block.
 *
 * Keeps filter-key derivation and default labels out of render.php so both
 * the SSR fetch (which needs to know the filterKey to read the URL-seeded
 * activeFilters for this block) and the block render share one source of
 * truth. Conventions mirror instant-search so deep links round-trip — see
 * src/instant-search/lib/filters.js mapFilterToFilterKey().
 */
class Filter_Checkbox {

	/**
	 * Derive a stable, URL-safe filter key from block attributes.
	 *
	 * @param array $attributes Block attributes.
	 * @return string  e.g. 'category', 'post_tag', 'post_types', 'authors', or a custom taxonomy slug.
	 */
	public static function derive_filter_key( array $attributes ): string {
		$filter_type = (string) ( $attributes['filterType'] ?? '' );
		switch ( $filter_type ) {
			case 'taxonomy':
				$key = sanitize_key( (string) ( $attributes['taxonomy'] ?? '' ) );
				// A custom taxonomy whose slug collides with a reserved URL param
				// (e.g. `s`, `orderby`) would be dropped by parse_url_filters()
				// and by store/url-state.js on serialize, so selections could
				// never round-trip. Reject the filter entirely so the block
				// renders nothing rather than silently no-oping.
				if ( '' === $key || in_array( $key, Search_Blocks::RESERVED_QUERY_PARAMS, true ) ) {
					return '';
				}
				return $key;
			case 'post_type':
				return 'post_types';
			case 'author':
				return 'authors';
		}
		return '';
	}

	/**
	 * Default group label for built-in filter variations. Returns an empty
	 * string for custom taxonomies — the block editor user is expected to
	 * supply a label in that case.
	 *
	 * @param array $attributes Block attributes.
	 * @return string
	 */
	public static function default_label( array $attributes ): string {
		$filter_type = (string) ( $attributes['filterType'] ?? '' );
		if ( 'post_type' === $filter_type ) {
			return __( 'Post Type', 'jetpack-search-pkg' );
		}
		if ( 'author' === $filter_type ) {
			return __( 'Author', 'jetpack-search-pkg' );
		}
		if ( 'taxonomy' === $filter_type ) {
			$taxonomy = sanitize_key( (string) ( $attributes['taxonomy'] ?? '' ) );
			if ( 'category' === $taxonomy ) {
				return __( 'Category', 'jetpack-search-pkg' );
			}
			if ( 'post_tag' === $taxonomy ) {
				return __( 'Tag', 'jetpack-search-pkg' );
			}
		}
		return '';
	}

	/**
	 * Build the filterConfig entry this block contributes to the shared
	 * Interactivity state. JS reads this to construct aggregation requests,
	 * ES filter clauses, and the active-filters pill list.
	 *
	 * @param array  $attributes Block attributes.
	 * @param string $filter_key Result of derive_filter_key().
	 * @return array<string, mixed>
	 */
	public static function build_config( array $attributes, string $filter_key ): array {
		$label = (string) ( $attributes['label'] ?? '' );
		if ( '' === $label ) {
			$label = static::default_label( $attributes );
		}

		return array(
			'filterKey'  => $filter_key,
			'filterType' => (string) ( $attributes['filterType'] ?? '' ),
			'taxonomy'   => sanitize_key( (string) ( $attributes['taxonomy'] ?? '' ) ),
			'label'      => $label,
			'showCount'  => (bool) ( $attributes['showCount'] ?? true ),
			'maxItems'   => max( 1, (int) ( $attributes['maxItems'] ?? 10 ) ),
		);
	}
}

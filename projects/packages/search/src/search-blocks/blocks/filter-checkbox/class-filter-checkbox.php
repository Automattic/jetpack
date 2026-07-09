<?php
/**
 * Filter-checkbox block helpers.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Helpers for the `jetpack-search/filter-checkbox` block — filter-key derivation,
 * default labels, and the filterConfig the block contributes to IA state.
 * Conventions mirror `src/instant-search/lib/filters.js mapFilterToFilterKey()`
 * so deep links round-trip.
 */
class Filter_Checkbox {

	/**
	 * Derive a stable URL-safe filter key from block attributes. Returns ''
	 * (rejecting the filter) when a custom taxonomy collides with a reserved
	 * URL param — selections couldn't round-trip otherwise.
	 *
	 * @param array $attributes Block attributes.
	 * @return string e.g. 'category', 'post_tag', 'post_types', 'authors', or a custom taxonomy slug.
	 */
	public static function derive_filter_key( array $attributes ): string {
		$filter_type = (string) ( $attributes['filterType'] ?? '' );
		switch ( $filter_type ) {
			case 'taxonomy':
				$key = sanitize_key( (string) ( $attributes['taxonomy'] ?? '' ) );
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
	 * Default group label for built-in variations. Empty for custom taxonomies
	 * (author supplies the label).
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
			// Distinct prefixed labels so "Filter by Category" and "Filter by Product
			// Category" read differently. Don't fall back to `get_taxonomy()->labels` —
			// that collapses product labels back to the post-taxonomy strings.
			if ( 'product_cat' === $taxonomy ) {
				return __( 'Product Category', 'jetpack-search-pkg' );
			}
			if ( 'product_tag' === $taxonomy ) {
				return __( 'Product Tag', 'jetpack-search-pkg' );
			}
			if ( 'product_brand' === $taxonomy ) {
				return __( 'Product Brand', 'jetpack-search-pkg' );
			}
		}
		return '';
	}

	/**
	 * Build the filterConfig entry this block contributes to IA state.
	 *
	 * @param array  $attributes Block attributes.
	 * @param string $filter_key Result of `derive_filter_key()`.
	 * @return array<string, mixed>
	 */
	public static function build_config( array $attributes, string $filter_key ): array {
		$filter_type = (string) ( $attributes['filterType'] ?? '' );

		$label = sanitize_text_field( (string) ( $attributes['label'] ?? '' ) );
		if ( '' === $label ) {
			$label = static::default_label( $attributes );
		}

		$taxonomy = sanitize_key( (string) ( $attributes['taxonomy'] ?? '' ) );

		return array(
			'filterKey'       => $filter_key,
			'filterType'      => $filter_type,
			'taxonomy'        => $taxonomy,
			// Pre-resolved ES slug. Equals `$taxonomy` for natively-indexed
			// taxonomies, or the `jetpack-search-tagN` slot when mapped.
			// Resolving here keeps `resolveFilterFields` in JS pure.
			'effectiveSlug'   => 'taxonomy' === $filter_type
				? Search_Blocks::resolve_taxonomy_slot( $taxonomy )
				: '',
			'label'           => $label,
			'showCount'       => (bool) ( $attributes['showCount'] ?? true ),
			'maxItems'        => max( 1, (int) ( $attributes['maxItems'] ?? 10 ) ),
			'bucketSortOrder' => static::normalize_bucket_sort_order( $attributes['bucketSortOrder'] ?? null ),
			'queryType'       => static::normalize_query_type( $attributes['queryType'] ?? null, $filter_type ),
			// Pre-resolved value→label map for buckets that don't ship one
			// (post_type aggs are bare slugs; taxonomy/author use slug_slash_name).
			'valueLabels'     => static::build_value_labels( $filter_type ),
		);
	}

	/**
	 * Value→label map for filter types whose buckets don't carry a label.
	 * Empty for taxonomy/author (their `slug_slash_name` buckets do).
	 *
	 * @param string $filter_type Block `filterType` attribute.
	 * @return array<string, string>
	 */
	protected static function build_value_labels( string $filter_type ): array {
		if ( 'post_type' !== $filter_type ) {
			return array();
		}
		$labels = array();
		// Match aggregation scope: only search-opted-in types land in `post_types` buckets.
		$objects = get_post_types( array( 'exclude_from_search' => false ), 'objects' );
		foreach ( $objects as $slug => $object ) {
			// `singular_name` is plugin/theme-supplied; sanitize same as the block label.
			$singular = sanitize_text_field( (string) ( $object->labels->singular_name ?? '' ) );
			if ( '' !== $singular ) {
				$labels[ (string) $slug ] = $singular;
			}
		}
		return $labels;
	}

	/**
	 * Normalize `bucketSortOrder` — unknown values fall back to `count`
	 * (matches the instant-search overlay default).
	 *
	 * @param mixed $value Raw attribute value.
	 * @return string 'count' or 'alpha'.
	 */
	public static function normalize_bucket_sort_order( $value ): string {
		return 'alpha' === $value ? 'alpha' : 'count';
	}

	/**
	 * Normalize `queryType`. Returns 'and' only when literal 'and' AND the
	 * filter targets a taxonomy — post_type/author are single-valued per doc,
	 * so AND with 2+ selections always returns zero. Gating here protects the
	 * ES query builder from tampered saved data.
	 *
	 * @param mixed  $value       Raw attribute value.
	 * @param string $filter_type Block `filterType` attribute.
	 * @return string 'or' or 'and'.
	 */
	public static function normalize_query_type( $value, string $filter_type ): string {
		return ( 'and' === $value && 'taxonomy' === $filter_type ) ? 'and' : 'or';
	}

	/**
	 * Back-compat wrapper around `Search_Blocks::normalize_display_style()`.
	 * Kept so older callers + the unit test still work.
	 *
	 * @param mixed $value Raw attribute value.
	 * @return string 'checkbox-list' or 'chips'.
	 */
	public static function normalize_display_style( $value ): string {
		return Search_Blocks::normalize_display_style( $value );
	}
}

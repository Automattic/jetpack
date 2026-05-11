<?php
/**
 * Filter-checkbox block helpers.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Helper methods for the jetpack-search/filter-checkbox block.
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
			// Product taxonomies get distinct, prefixed defaults so an author
			// using both "Filter by Category" (post taxonomy) and "Filter by
			// Product Category" on the same page sees two clearly different
			// headings. Skipping `get_taxonomy()->labels->singular_name`
			// here is intentional — that lookup would collapse the product
			// label back to the same "Category" / "Tag" / "Brand" string WC
			// uses for its own admin and break the differentiation.
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
	 * Build the filterConfig entry this block contributes to the shared
	 * Interactivity state. JS reads this to construct aggregation requests,
	 * ES filter clauses, and the active-filters pill list.
	 *
	 * @param array  $attributes Block attributes.
	 * @param string $filter_key Result of derive_filter_key().
	 * @return array<string, mixed>
	 */
	public static function build_config( array $attributes, string $filter_key ): array {
		$filter_type = (string) ( $attributes['filterType'] ?? '' );

		$label = sanitize_text_field( (string) ( $attributes['label'] ?? '' ) );
		if ( '' === $label ) {
			$label = static::default_label( $attributes );
		}

		return array(
			'filterKey'       => $filter_key,
			'filterType'      => $filter_type,
			'taxonomy'        => sanitize_key( (string) ( $attributes['taxonomy'] ?? '' ) ),
			'label'           => $label,
			'showCount'       => (bool) ( $attributes['showCount'] ?? true ),
			'maxItems'        => max( 1, (int) ( $attributes['maxItems'] ?? 10 ) ),
			'bucketSortOrder' => static::normalize_bucket_sort_order( $attributes['bucketSortOrder'] ?? null ),
			// AND vs. OR combination across multi-value selections. Only
			// honoured for taxonomy filters — see normalize_query_type().
			'queryType'       => static::normalize_query_type( $attributes['queryType'] ?? null, $filter_type ),
			// Pre-resolved value→label map used by the active-filters pill list
			// and the checkbox list. Taxonomy and author aggregations use
			// `slug_slash_name` keys, so the bucket already carries the label
			// — JS post-slash-splits at render time. Post-type buckets are
			// bare slugs (`post`, `page`), so without a lookup the pill would
			// read "post" instead of "Post"; we seed the singular_name here.
			'valueLabels'     => static::build_value_labels( $filter_type ),
		);
	}

	/**
	 * Build the value→label map for filter types whose aggregation buckets
	 * don't carry a display name. Returns an empty array for taxonomy and
	 * author filters because their `slug_slash_name` buckets already do.
	 *
	 * @param string $filter_type Block `filterType` attribute.
	 * @return array<string, string>
	 */
	protected static function build_value_labels( string $filter_type ): array {
		if ( 'post_type' !== $filter_type ) {
			return array();
		}
		$labels = array();
		// Match the aggregation scope: post types that opt into search are the
		// only ones whose buckets can land in `post_types` aggregations.
		$objects = get_post_types( array( 'exclude_from_search' => false ), 'objects' );
		foreach ( $objects as $slug => $object ) {
			// `singular_name` is plugin/theme-supplied via register_post_type();
			// run it through the same sanitizer as the block's `label` attribute
			// so stray HTML or whitespace can never reach the rendered pill.
			$singular = sanitize_text_field( (string) ( $object->labels->singular_name ?? '' ) );
			if ( '' !== $singular ) {
				$labels[ (string) $slug ] = $singular;
			}
		}
		return $labels;
	}

	/**
	 * Normalize the bucketSortOrder attribute. Unknown values fall back to
	 * `count` so aggregation requests always carry a valid ES `order` key and
	 * the rendered bucket order matches the instant-search overlay default
	 * (count, descending).
	 *
	 * @param mixed $value Raw attribute value.
	 * @return string Either 'count' or 'alpha'.
	 */
	public static function normalize_bucket_sort_order( $value ): string {
		return 'alpha' === $value ? 'alpha' : 'count';
	}

	/**
	 * Normalize the queryType attribute. Returns 'and' only when the literal
	 * string is 'and' AND the filter targets a taxonomy — post_type and
	 * author are single-valued per document, so an AND combination with 2+
	 * selections is guaranteed to return zero results. Gating here means
	 * tampered saved data can never reach the ES query builder with a
	 * value that would silently zero out the result set.
	 *
	 * @param mixed  $value       Raw attribute value.
	 * @param string $filter_type Block `filterType` attribute.
	 * @return string Either 'or' or 'and'.
	 */
	public static function normalize_query_type( $value, string $filter_type ): string {
		return ( 'and' === $value && 'taxonomy' === $filter_type ) ? 'and' : 'or';
	}

	/**
	 * Normalize display style attribute so render wrappers always emit one of
	 * the supported CSS variants. Thin pass-through to the shared
	 * `Search_Blocks::normalize_display_style()` so the four sibling filter
	 * blocks (`filter-date`, `filter-wc-attribute`, `filter-wc-rating`,
	 * `filter-wc-stock-status`) and this one all share one implementation.
	 *
	 * Kept as a delegating wrapper rather than dropped so older
	 * `Filter_Checkbox::normalize_display_style()` callers (and the existing
	 * unit test that pins the contract) keep working — the API surface is
	 * identical to before, just sourced from the shared helper.
	 *
	 * @param mixed $value Raw attribute value.
	 * @return string Either 'checkbox-list' or 'chips'.
	 */
	public static function normalize_display_style( $value ): string {
		return Search_Blocks::normalize_display_style( $value );
	}
}

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
	 * Memoized blog-id labels for the current request. `null` means
	 * "not yet resolved"; resolution writes either an empty array or the
	 * sanitized labels map. See get_blog_id_labels().
	 *
	 * @var array<string, string>|null
	 */
	protected static $blog_id_labels_cache = null;

	/**
	 * Derive a stable, URL-safe filter key from block attributes.
	 *
	 * @param array $attributes Block attributes.
	 * @return string  e.g. 'category', 'post_tag', 'post_types', 'authors', 'blog_ids', or a custom taxonomy slug.
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
			case 'blog_id':
				return 'blog_ids';
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
		if ( 'blog_id' === $filter_type ) {
			return __( 'Blog', 'jetpack-search-pkg' );
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
		$label = sanitize_text_field( (string) ( $attributes['label'] ?? '' ) );
		if ( '' === $label ) {
			$label = static::default_label( $attributes );
		}

		$filter_type = (string) ( $attributes['filterType'] ?? '' );
		$config      = array(
			'filterKey'       => $filter_key,
			'filterType'      => $filter_type,
			'taxonomy'        => sanitize_key( (string) ( $attributes['taxonomy'] ?? '' ) ),
			'label'           => $label,
			'showCount'       => (bool) ( $attributes['showCount'] ?? true ),
			'maxItems'        => max( 1, (int) ( $attributes['maxItems'] ?? 10 ) ),
			'bucketSortOrder' => static::normalize_bucket_sort_order( $attributes['bucketSortOrder'] ?? null ),
		);

		// blog_id aggregation buckets are numeric blog IDs — without a labels
		// map the filter list and active-filter pills would render as raw
		// numbers. Surface the legacy `blogIdFilteringLabels` map on the
		// config so view.js / activePills can resolve a human label without
		// a special case for this filter type.
		if ( 'blog_id' === $filter_type ) {
			$config['displayLabels'] = static::get_blog_id_labels();
		}

		return $config;
	}

	/**
	 * Resolve the `{ [blog_id]: label }` map exposed by the legacy widget's
	 * `blogIdFilteringLabels` option. Mirrors `Helper::generate_initial_javascript_state()`
	 * by running the `jetpack_instant_search_options` filter so any code that
	 * already populates the legacy widget's labels stays the single source of
	 * truth across both surfaces.
	 *
	 * Memoized — build_config() runs twice per filter-checkbox block (once
	 * during state seeding via walk_blocks_for_filter_configs, once from
	 * render.php), and the filter chain may run DB queries in third-party
	 * handlers. Tests can clear the cache via `reset_blog_id_labels_cache()`.
	 *
	 * @return array<string, string>
	 */
	protected static function get_blog_id_labels(): array {
		if ( null !== self::$blog_id_labels_cache ) {
			return self::$blog_id_labels_cache;
		}
		$labels = array();
		if ( function_exists( 'apply_filters' ) ) {
			/** This filter is documented in src/class-helper.php */
			$options = apply_filters( 'jetpack_instant_search_options', array() );
			if ( is_array( $options ) && ! empty( $options['blogIdFilteringLabels'] ) && is_array( $options['blogIdFilteringLabels'] ) ) {
				foreach ( $options['blogIdFilteringLabels'] as $blog_id => $label ) {
					$labels[ (string) $blog_id ] = sanitize_text_field( (string) $label );
				}
			}
		}
		self::$blog_id_labels_cache = $labels;
		return self::$blog_id_labels_cache;
	}

	/**
	 * Reset the memoized blog-id labels. Test-only — production code should
	 * never need to clear the cache mid-request because the underlying filter
	 * is not expected to change between calls.
	 */
	public static function reset_blog_id_labels_cache(): void {
		self::$blog_id_labels_cache = null;
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
}

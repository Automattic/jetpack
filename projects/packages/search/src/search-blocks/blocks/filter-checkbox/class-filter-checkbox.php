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
				return sanitize_key( (string) ( $attributes['taxonomy'] ?? '' ) );
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

	/**
	 * Resolve the ES field name used for the aggregation request.
	 *
	 * Mirrors resolveFilterFields() in store/api.js — taxonomies/authors use
	 * the `slug_slash_name` variants so bucket keys carry display labels,
	 * while post_type uses the plain field. Returns null when the config
	 * doesn't describe a filter we know how to aggregate on.
	 *
	 * @param array $config FilterConfig entry.
	 * @return string|null
	 */
	public static function agg_field( array $config ): ?string {
		switch ( $config['filterType'] ?? '' ) {
			case 'taxonomy':
				$taxonomy = (string) ( $config['taxonomy'] ?? '' );
				if ( 'category' === $taxonomy ) {
					return 'category.slug_slash_name';
				}
				if ( 'post_tag' === $taxonomy ) {
					return 'tag.slug_slash_name';
				}
				if ( '' === $taxonomy ) {
					return null;
				}
				return 'taxonomy.' . $taxonomy . '.slug_slash_name';
			case 'post_type':
				return 'post_type';
			case 'author':
				return 'author_login_slash_name';
		}
		return null;
	}

	/**
	 * Resolve the ES field name used for the `term` filter clause.
	 *
	 * Mirrors resolveFilterFields() in store/api.js — filter clauses use the
	 * plain `.slug` / `author_login` / `post_type` fields (values are slugs),
	 * not the `slug_slash_name` aggregation fields.
	 *
	 * @param array $config FilterConfig entry.
	 * @return string|null
	 */
	public static function filter_field( array $config ): ?string {
		switch ( $config['filterType'] ?? '' ) {
			case 'taxonomy':
				$taxonomy = (string) ( $config['taxonomy'] ?? '' );
				if ( 'category' === $taxonomy ) {
					return 'category.slug';
				}
				if ( 'post_tag' === $taxonomy ) {
					return 'tag.slug';
				}
				if ( '' === $taxonomy ) {
					return null;
				}
				return 'taxonomy.' . $taxonomy . '.slug';
			case 'post_type':
				return 'post_type';
			case 'author':
				return 'author_login';
		}
		return null;
	}

	/**
	 * Build the ES aggregation payload from a filterConfigs map. Mirrors
	 * buildAggregations() in store/api.js.
	 *
	 * @param array $filter_configs { [filterKey]: FilterConfig } map.
	 * @return array<string, array>
	 */
	public static function build_aggregations( array $filter_configs ): array {
		$aggregations = array();
		foreach ( $filter_configs as $filter_key => $config ) {
			$agg_field = static::agg_field( (array) $config );
			if ( ! $agg_field ) {
				continue;
			}
			$aggregations[ $filter_key ] = array(
				'terms' => array(
					'field' => $agg_field,
					'size'  => max( 1, (int) ( $config['maxItems'] ?? 10 ) ),
				),
			);
		}
		return $aggregations;
	}

	/**
	 * Build the ES filter clause from active selections. Mirrors
	 * buildFilterClause() in store/api.js — multiple values in one filter
	 * OR together, different filters AND together.
	 *
	 * @param array $active_filters { [filterKey]: string[] } selections.
	 * @param array $filter_configs { [filterKey]: FilterConfig } map.
	 * @return array|null `{ bool: { must: [...] } }` or null when empty.
	 */
	public static function build_filter_clause( array $active_filters, array $filter_configs ): ?array {
		$must = array();
		foreach ( $active_filters as $filter_key => $values ) {
			if ( ! is_array( $values ) || empty( $values ) ) {
				continue;
			}
			$config = $filter_configs[ $filter_key ] ?? null;
			if ( ! is_array( $config ) ) {
				continue;
			}
			$filter_field = static::filter_field( $config );
			if ( ! $filter_field ) {
				continue;
			}
			$terms  = array_map(
				static function ( $v ) use ( $filter_field ) {
					return array( 'term' => array( $filter_field => (string) $v ) );
				},
				array_values( $values )
			);
			$must[] = count( $terms ) === 1 ? $terms[0] : array( 'bool' => array( 'should' => $terms ) );
		}
		return $must ? array( 'bool' => array( 'must' => $must ) ) : null;
	}
}

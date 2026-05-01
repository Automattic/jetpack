<?php
/**
 * Search product filter — product taxonomy block helpers.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Helper methods for the jetpack/search-product-filter-taxonomy block.
 *
 * Mirrors filter-checkbox for the three built-in WooCommerce product
 * taxonomies — `product_cat`, `product_tag`, `product_brand` — so the
 * inserter can offer dedicated "Filter by Category / Tag / Brand"
 * variations without authors having to find the generic "Custom
 * Taxonomy" filter-checkbox variation and remember the right slug.
 *
 * Internally the filter rides the same `filterType: 'taxonomy'` data
 * plane as filter-checkbox and the attribute filter — `resolveFilterFields`
 * already handles `taxonomy.<slug>.slug_slash_name`, so we don't need a
 * new branch on the JS side.
 */
class Search_Product_Filter_Taxonomy {

	/**
	 * Allowed taxonomy slugs. WooCommerce ships `product_cat` and
	 * `product_tag` out of the box; `product_brand` is provided by the
	 * (now-bundled) Brands feature in WC 9+. Restricting the picker to
	 * this set keeps the block focused on product taxonomies — anyone
	 * wanting a non-product taxonomy filter has the generic Custom
	 * Taxonomy filter-checkbox variation instead.
	 *
	 * @return string[]
	 */
	public static function get_allowed_taxonomies(): array {
		return array( 'product_cat', 'product_tag', 'product_brand' );
	}

	/**
	 * Derive the URL key + filterConfigs key for this block instance.
	 *
	 * Returns the chosen taxonomy slug verbatim (sanitized, gated by the
	 * allow-list). An empty or out-of-list slug short-circuits to '' so
	 * render.php bails before registering a half-formed filter.
	 *
	 * @param array $attributes Block attributes.
	 * @return string
	 */
	public static function derive_filter_key( array $attributes ): string {
		$slug = sanitize_key( (string) ( $attributes['taxonomy'] ?? '' ) );
		if ( '' === $slug || in_array( $slug, Search_Blocks::RESERVED_QUERY_PARAMS, true ) ) {
			return '';
		}
		// Block is opinionated: only the three product taxonomies. A
		// filter-checkbox custom-taxonomy variation covers anything else.
		if ( ! in_array( $slug, self::get_allowed_taxonomies(), true ) ) {
			return '';
		}
		return $slug;
	}

	/**
	 * Default group label when the block author leaves the label attribute
	 * empty. Prefers the registered taxonomy's `singular_name` so a localized
	 * WC install reads "Catégorie", "Étiquette", etc., falling back to a
	 * hardcoded English label per slug for fresh installs where the WC
	 * taxonomies haven't loaded yet (e.g. tests, admin-only renders).
	 *
	 * @param array $attributes Block attributes.
	 * @return string
	 */
	public static function default_label( array $attributes ): string {
		$slug = sanitize_key( (string) ( $attributes['taxonomy'] ?? '' ) );
		if ( '' === $slug ) {
			return '';
		}
		if ( function_exists( 'get_taxonomy' ) ) {
			$tax = get_taxonomy( $slug );
			if ( $tax && ! empty( $tax->labels->singular_name ) ) {
				return (string) $tax->labels->singular_name;
			}
		}
		switch ( $slug ) {
			case 'product_cat':
				return __( 'Category', 'jetpack-search-pkg' );
			case 'product_tag':
				return __( 'Tag', 'jetpack-search-pkg' );
			case 'product_brand':
				return __( 'Brand', 'jetpack-search-pkg' );
		}
		return '';
	}

	/**
	 * Build the filterConfig entry this block contributes to the shared
	 * Interactivity state. JS reads `filterType: 'taxonomy'` so the same
	 * `taxonomy.<slug>.slug_slash_name` aggregation field and `term`
	 * filter clause apply to product taxonomies as to any other taxonomy.
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
		);
	}
}

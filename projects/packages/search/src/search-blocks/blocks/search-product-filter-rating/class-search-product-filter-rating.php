<?php
/**
 * Search product filter — rating block helpers.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Helper methods for the jetpack/search-product-filter-rating block.
 *
 * Filter key + filterConfig shape live here so render.php and the
 * post-content walker (Search_Blocks::collect_product_filter_configs_from_post)
 * agree on what this block contributes to the shared store. The
 * `wc_rating` filterType drives the histogram aggregation + per-star range
 * filter clauses in store/api.js — see `WC_RATING_RANGES`.
 */
class Search_Product_Filter_Rating {

	/**
	 * URL key + interactivity-state filter key for rating selections.
	 *
	 * Mirrors WooCommerce's native URL contract
	 * (`?rating_filter[]=4&rating_filter[]=5`) so deep links interoperate
	 * with WC's own rating filter — and so a future bridge would not need
	 * to translate keys between the two systems.
	 */
	const FILTER_KEY = 'rating_filter';

	/**
	 * Stable star option list for rendering. Highest first matches the
	 * conventional e-commerce "4 stars & up, 3 stars & up, …" ordering;
	 * since the underlying ES range clauses are non-overlapping (star=4
	 * means avg ∈ [3.5, 4.5), not "≥ 3.5"), the visible label may say
	 * "& up" but the selection semantics are exact buckets — multi-select
	 * to OR adjacent stars together.
	 *
	 * @return int[] Star values 5..1.
	 */
	public static function get_star_values(): array {
		return array( 5, 4, 3, 2, 1 );
	}

	/**
	 * Filter key derivation. Constant for this block — the rating field is
	 * always `meta._wc_average_rating.double`, so there's no per-instance
	 * variation. Method form mirrors Filter_Checkbox::derive_filter_key.
	 *
	 * @return string
	 */
	public static function derive_filter_key(): string {
		return self::FILTER_KEY;
	}

	/**
	 * Default group label when the block author leaves the label attribute
	 * empty.
	 *
	 * @return string
	 */
	public static function default_label(): string {
		return __( 'Rating', 'jetpack-search-pkg' );
	}

	/**
	 * Build the filterConfig entry this block contributes to the shared
	 * Interactivity state. JS reads `filterType: 'wc_rating'` to switch
	 * `buildAggregations` to a histogram and `buildFilterClause` to the
	 * per-star range path.
	 *
	 * @param array $attributes Block attributes.
	 * @return array<string, mixed>
	 */
	public static function build_config( array $attributes ): array {
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

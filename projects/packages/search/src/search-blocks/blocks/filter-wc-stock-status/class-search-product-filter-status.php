<?php
/**
 * Search product filter — stock-status block helpers.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Helpers for `jetpack-search/filter-wc-stock-status` — filterKey, fixed
 * option list, and filterConfig shape shared between render.php and the
 * block-walker in `Search_Blocks`.
 */
class Search_Product_Filter_Status {

	/**
	 * URL + IA-state key. Standard array form (`?filter_stock_status[]=…`).
	 */
	const FILTER_KEY = 'filter_stock_status';

	/**
	 * Fixed option set. v1 surfaces only "In stock" — `product_visibility`
	 * carries only `outofstock`, and `_stock_status` postmeta isn't indexed
	 * yet (RSM-1932 will restore the full three-option list and switch to
	 * WC's translated labels).
	 *
	 * @return array<int, array{value: string, label: string}>
	 */
	public static function get_options(): array {
		return array(
			array(
				'value' => 'instock',
				'label' => 'In stock',
			),
		);
	}

	/**
	 * Filter key — constant. Method form mirrors `Filter_Checkbox::derive_filter_key()`
	 * so the walker can call this uniformly.
	 *
	 * @param array $_attributes Unused; interface parity.
	 * @return string
	 */
	public static function derive_filter_key( array $_attributes = array() ): string { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return self::FILTER_KEY;
	}

	/**
	 * Default group label. RSM-1932 will read from WC's translation map.
	 *
	 * @return string
	 */
	public static function default_label(): string {
		return __( 'Stock status', 'jetpack-search-pkg' );
	}

	/**
	 * Build the filterConfig entry. `filterType` dispatches in JS onto the
	 * `taxonomy.product_visibility.slug` agg with `outofstock` include +
	 * term/must_not clauses.
	 *
	 * @param array  $attributes  Block attributes.
	 * @param string $_filter_key Unused; interface parity.
	 * @return array<string, mixed>
	 */
	public static function build_config( array $attributes, string $_filter_key = '' ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$label = sanitize_text_field( (string) ( $attributes['label'] ?? '' ) );
		if ( '' === $label ) {
			$label = static::default_label();
		}

		return array(
			'filterKey'  => self::FILTER_KEY,
			'filterType' => 'wc_stock_status',
			'label'      => $label,
			'showCount'  => (bool) ( $attributes['showCount'] ?? true ),
		);
	}
}

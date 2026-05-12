<?php
/**
 * Search product filter — stock status block helpers.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Helper methods for the jetpack-search/filter-wc-stock-status block.
 *
 * Single source of truth for the block's filterKey, fixed option list, and
 * filterConfig shape. Both render.php (when seeding interactivity state)
 * and Search_Blocks::collect_product_filter_configs_from_post() rely on
 * these so the URL gate sees the same key the block registers at render
 * time, regardless of block order in the post.
 */
class Search_Product_Filter_Status {

	/**
	 * URL key + interactivity-state filter key for stock-status selections.
	 * Written and read as the standard array form (`?filter_stock_status[]=…`),
	 * matching the other Search 3.0 filter blocks.
	 */
	const FILTER_KEY = 'filter_stock_status';

	/**
	 * Fixed option set for the filter. v1 surfaces a single "In stock"
	 * toggle: the data plane reads from the `product_visibility` taxonomy
	 * where only `outofstock` exists — backorder lives solely in the
	 * `_stock_status` postmeta which the WPCOM-side ES indexer doesn't
	 * currently retain, and an explicit "Out of stock" option rarely makes
	 * sense on a shop UI. When the indexer adds `_stock_status`, the full
	 * three-option list (`instock` / `outofstock` / `onbackorder`) can be
	 * restored here and the data-plane wiring in `store/api.js` reverted
	 * to the meta path. Hardcoded English labels for now (RSM-1932 will
	 * server-render the WC translations into `wp_interactivity_state` so
	 * non-en-US locales render correctly).
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
	 * Filter key derivation. Constant for this block — there's only one
	 * stock-status field per WC store, so no per-instance variation. Kept
	 * as a method (mirroring Filter_Checkbox::derive_filter_key) so the
	 * walker in Search_Blocks doesn't need to special-case the API.
	 *
	 * @param array $_attributes Block attributes (unused; present for interface parity).
	 * @return string
	 */
	public static function derive_filter_key( array $_attributes = array() ): string { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return self::FILTER_KEY;
	}

	/**
	 * Default group label when the block author leaves the label attribute
	 * empty. v1 ships English; RSM-1932 will switch this to read from the
	 * WC-provided translation map.
	 *
	 * @return string
	 */
	public static function default_label(): string {
		return __( 'Stock status', 'jetpack-search-pkg' );
	}

	/**
	 * Build the filterConfig entry this block contributes to the shared
	 * Interactivity state. JS reads filterType to dispatch onto the
	 * `taxonomy.product_visibility.slug` ES path with `outofstock`-include
	 * agg and `term` / `must_not term` clauses.
	 *
	 * @param array  $attributes Block attributes.
	 * @param string $_filter_key Resolved filter key (unused; present for interface parity).
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

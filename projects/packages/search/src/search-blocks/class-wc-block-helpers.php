<?php
/**
 * WooCommerce helper utilities shared between `filter-wc-*` blocks.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Shared WC render-time helpers for the price / price-slider blocks.
 *
 * Lives separately from {@see Search_Blocks} (which owns block registration)
 * so the WC-touching code that runs at render time has a dedicated home and
 * the duplicated currency / extents logic in `render.php` files collapses to
 * a single call.
 */
class Wc_Block_Helpers {

	const PRICE_EXTENTS_TRANSIENT = 'jetpack_search_wc_price_extents';
	const PRICE_EXTENTS_TTL_SEC   = 5 * MINUTE_IN_SECONDS;

	/**
	 * Resolve the currency adornment (symbol + position) for a price block.
	 *
	 * Empty author values fall through to the active WooCommerce settings so a
	 * site running AUD gets `A$` adornments out-of-the-box. The `$` / `left`
	 * fallbacks keep the block usable on a plain WP install while the author
	 * wires WC up.
	 *
	 * @param string $author_symbol   Author-configured symbol; '' to defer to WC.
	 * @param string $author_position Author-configured position; '' to defer to WC.
	 * @return array{symbol:string,position:string} `symbol` is trimmed to 2 chars so an
	 *                                              oversized entity can't overflow the adornment slot.
	 */
	public static function get_currency_display( string $author_symbol, string $author_position ): array {
		$symbol   = $author_symbol;
		$position = $author_position;

		if ( '' === $symbol && function_exists( 'get_woocommerce_currency_symbol' ) ) {
			// @phan-suppress-next-line PhanUndeclaredFunction
			$wc_symbol = (string) get_woocommerce_currency_symbol();
			// WC returns symbols as HTML entities (e.g. `&#36;`, `&euro;`). Decode
			// once so the downstream `mb_substr` operates on a single character
			// instead of half an entity, and so `esc_html` at output produces a
			// single round-trip — not double-encoded text.
			$symbol = html_entity_decode( $wc_symbol, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
		}
		if ( '' === $symbol ) {
			$symbol = '$';
		}

		if ( '' === $position ) {
			$wc_pos   = (string) get_option( 'woocommerce_currency_pos', 'left' );
			$position = ( 'right' === $wc_pos || 'right_space' === $wc_pos ) ? 'right' : 'left';
		}
		if ( ! in_array( $position, array( 'left', 'right' ), true ) ) {
			$position = 'left';
		}

		$symbol_short = function_exists( 'mb_substr' ) ? mb_substr( $symbol, 0, 2 ) : substr( $symbol, 0, 2 );

		return array(
			'symbol'   => $symbol_short,
			'position' => $position,
		);
	}

	/**
	 * Catalog-wide price extents from WC's denormalized lookup table.
	 *
	 * Bounds are stable for the page (mirrors WC's slider — applying other
	 * filters narrows products without shrinking the track, so the user can
	 * always drag back out). Transient-cached for {@see self::PRICE_EXTENTS_TTL_SEC}
	 * to absorb the SQL cost across page loads; the null-extents outcome is
	 * cached too, so a broken setup doesn't re-run the query on every render.
	 *
	 * @return array{min:float|null,max:float|null} Both null when WC isn't active
	 *                                              or the lookup table isn't registered.
	 */
	public static function get_catalog_price_extents(): array {
		$cached = function_exists( 'get_transient' ) ? get_transient( self::PRICE_EXTENTS_TRANSIENT ) : false;
		if ( is_array( $cached ) ) {
			return $cached;
		}

		$extents = array(
			'min' => null,
			'max' => null,
		);

		if ( function_exists( 'wc_get_product' ) ) {
			global $wpdb;
			if ( isset( $wpdb ) && ! empty( $wpdb->wc_product_meta_lookup ) ) {
				// `wc_product_meta_lookup` is WC's denormalized one-row-per-product
				// table with indexed DECIMAL `min_price` / `max_price` columns. It
				// is the same source WC's own price-slider, classic widget, and
				// Store API hit — and scales linearly with product count, unlike a
				// REGEXP scan of `postmeta`. Joined to `wp_posts` so draft / pending /
				// trashed products don't inflate the extents: WC populates the lookup
				// table on every product save, not only on publish. The phpcs caching
				// warning fires because the call site doesn't use wp_cache_*; the
				// transient covers that.
				$row = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
					"SELECT MIN(l.min_price) AS min_price, MAX(l.max_price) AS max_price
					FROM {$wpdb->wc_product_meta_lookup} l
					INNER JOIN {$wpdb->posts} p ON p.ID = l.product_id
					WHERE p.post_status = 'publish'
						AND p.post_type IN ( 'product', 'product_variation' )"
				);
				if ( $row && null !== $row->min_price && null !== $row->max_price ) {
					$extents = array(
						'min' => (float) $row->min_price,
						'max' => (float) $row->max_price,
					);
				}
			}
		}

		if ( function_exists( 'set_transient' ) ) {
			set_transient( self::PRICE_EXTENTS_TRANSIENT, $extents, self::PRICE_EXTENTS_TTL_SEC );
		}

		return $extents;
	}
}

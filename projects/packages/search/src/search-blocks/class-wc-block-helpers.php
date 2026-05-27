<?php
/**
 * WooCommerce helper utilities shared between `filter-wc-*` blocks.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Render-time helpers for the WC price / price-slider blocks. Separate from
 * `Search_Blocks` so the WC-touching code has a dedicated home.
 */
class Wc_Block_Helpers {

	const PRICE_EXTENTS_TRANSIENT = 'jetpack_search_wc_price_extents';
	const PRICE_EXTENTS_TTL_SEC   = 5 * MINUTE_IN_SECONDS;

	/**
	 * Currency adornment (symbol + position) for a price block. Empty author
	 * values fall through to WC settings; `$`/`left` for plain WP installs.
	 *
	 * @param string $author_symbol   '' to defer to WC.
	 * @param string $author_position '' to defer to WC.
	 * @return array{symbol:string,position:string} symbol clipped to 2 chars.
	 */
	public static function get_currency_display( string $author_symbol, string $author_position ): array {
		$symbol   = $author_symbol;
		$position = $author_position;

		if ( '' === $symbol && function_exists( 'get_woocommerce_currency_symbol' ) ) {
			// @phan-suppress-next-line PhanUndeclaredFunction
			$wc_symbol = (string) get_woocommerce_currency_symbol();
			// WC returns HTML entities (`&#36;`, `&euro;`). Decode once so `mb_substr`
			// sees a character (not half an entity) and `esc_html` round-trips cleanly.
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
	 * Catalog-wide price extents from WC's `wc_product_meta_lookup`. Bounds
	 * stay stable for the page (matches WC's slider — applying filters narrows
	 * products without shrinking the track). Transient-cached; null-extents
	 * are cached too so broken setups don't re-run the query.
	 *
	 * @return array{min:float|null,max:float|null}
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
				// Same indexed lookup table WC's own slider/widget/Store API hit;
				// scales linearly with product count (vs. a REGEXP `postmeta` scan).
				// Joined to `wp_posts` so draft/pending/trashed don't inflate — WC
				// populates the table on every save, not only on publish.
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

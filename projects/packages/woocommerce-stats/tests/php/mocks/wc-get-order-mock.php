<?php
/**
 * Stubs wc_get_order() with an object carrying only the order id.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

// phpcs:disable WordPress.Files.FileName

if ( ! function_exists( 'wc_get_order' ) ) {
	/**
	 * Stub of wc_get_order().
	 *
	 * @param int $id Order id.
	 * @return object
	 */
	function wc_get_order( $id ) {
		return (object) array( 'id' => (int) $id );
	}
}

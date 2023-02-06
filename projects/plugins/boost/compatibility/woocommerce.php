<?php
/**
 * Compatibility functions for WooCommerce
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Compatibility\Woocommerce;

/**
 * Exclude special Woocommerce pages from standard "single page" Critical CSS.
 *
 * @param object $args the query args.
 */
function exclude_woocommerce_pages_from_query( $args ) {

	// Only do this for page post type.
	if ( 'page' !== $args['post_type'] ) {
		return $args;
	}

	$woocommerce_pages = get_woocommerce_page_ids();
	if ( empty( $woocommerce_pages ) ) {
		return $args;
	}

	if ( ! isset( $args['post__not_in'] ) ) {
		$args['post__not_in'] = array();
	}

	$args['post__not_in'] = array_merge( $woocommerce_pages, $args['post__not_in'] );

	return $args;
}

/**
 * Get those ol' WooCommerce page IDs
 */
function get_woocommerce_page_ids() {
	if ( ! function_exists( 'wc_get_page_id' ) ) {
		return array();
	}
	$page_slugs = array( 'myaccount', 'shop', 'cart', 'checkout', 'view_order', 'terms' );
	$ids        = array_map( 'wc_get_page_id', $page_slugs );
	$ids        = array_filter(
		$ids,
		function ( $value ) {
			return $value > 0;
		}
	);

	return $ids;
}

add_filter( 'jetpack_boost_critical_css_post_type_query', __NAMESPACE__ . '\exclude_woocommerce_pages_from_query' );

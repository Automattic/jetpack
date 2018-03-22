<?php
/**
 * This file contains compatibility functions for WooCommerce to improve Jetpack feature support.
 */
add_action( 'woocommerce_init', 'jetpack_woocommerce_integration' );

function jetpack_woocommerce_integration() {
	/**
	 * Double check WooCommerce exists - unlikely to fail due to the hook being used but better safe than sorry.
	 */
	if ( ! class_exists( 'WooCommerce' ) ) {
		return;
	}

	add_action( 'woocommerce_share', 'jetpack_woocommerce_social_share_icons', 10 );

	/**
	 * Wrap in function exists check since this requires WooCommerce 3.3+.
	 */
	if ( function_exists( 'wc_get_default_products_per_row' ) ) {
		add_filter( 'infinite_scroll_render_callbacks', 'jetpack_woocommerce_infinite_scroll_render_callback', 10 );
		add_filter( 'infinite_scroll_settings', 'jetpack_woocommerce_infinite_scroll_settings', 10 );
	}
}

/*
 * Make sure the social sharing icons show up under the product's short description
 */
function jetpack_woocommerce_social_share_icons() {
	if ( function_exists( 'sharing_display' ) ) {
		remove_filter( 'the_content', 'sharing_display', 19 );
		remove_filter( 'the_excerpt', 'sharing_display', 19 );
		echo sharing_display();
	}
}

/**
 * Add a callback for WooCommerce product rendering in infinite scroll.
 *
 * @param array $callbacks
 * @return array
 */
function jetpack_woocommerce_infinite_scroll_render_callback( $callbacks ) {
	$callbacks[] = 'jetpack_woocommerce_infinite_scroll_render';
	return $callbacks;
}

/**
 * Add a default renderer for WooCommerce products within infinite scroll.
 */
function jetpack_woocommerce_infinite_scroll_render() {
	if ( ! is_shop() && ! is_product_taxonomy() && ! is_product_category() && ! is_product_tag() ) {
		return;
	}

	woocommerce_product_loop_start();

	while ( have_posts() ) {
		the_post();
		wc_get_template_part( 'content', 'product' );
	}

	woocommerce_product_loop_end();
}

/**
 * Adjust settings
 *
 * @param [type] $settings
 * @return void
 */
function jetpack_woocommerce_infinite_scroll_settings( $settings ) {
	if ( ! is_shop() && ! is_product_taxonomy() && ! is_product_category() && ! is_product_tag() ) {
		return $settings;
	}
	$settings['posts_per_page'] = absint( apply_filters( 'loop_shop_per_page', wc_get_default_products_per_row() * wc_get_default_product_rows_per_page() ) );
	return $settings;
}

<?php
/**
 * CSS monkey patches.
 *
 * @package jetpack-mu-wpcom
 */

add_action( 'admin_enqueue_scripts', 'jetpack_mu_wpcom_admin_css_monkey_patches' );

/**
 * Enqueue the CSS monkey patches.
 */
function jetpack_mu_wpcom_admin_css_monkey_patches() {
	wp_enqueue_style( 'css-monkey-patches', plugins_url( 'css-monkey-patches.css', __FILE__ ), array(), JETPACK_MU_WPCOM_VERSION );
}

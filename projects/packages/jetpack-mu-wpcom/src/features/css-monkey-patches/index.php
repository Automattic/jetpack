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
	/**
	 * Only enqueue the Elementor fix on the Elementor admin page.
	 */
	if ( 'toplevel_page_elementor' === get_current_screen()->id ) {
		wp_enqueue_style( 'jetpack-elementor-fix', plugins_url( 'jetpack-elementor-fix.css', __FILE__ ), array(), filemtime( __DIR__ . '/jetpack-elementor-fix.css' ) );
	}
}

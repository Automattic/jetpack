<?php
/**
 * Apply the new font-smoothing styles.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Adds custom classes to the admin body classes.
 *
 * @param string $classes Classes for the body element.
 * @return string
 */
function wpcom_add_font_smoothing_antialiased_class( $classes ) {
	$classes .= ' font-smoothing-antialiased ';
	return $classes;
}
add_filter( 'admin_body_class', 'wpcom_add_font_smoothing_antialiased_class' );

/**
 * Enqueue assets
 */
function wpcom_enqueue_font_smoothing_antialiased_assets() {
	wp_enqueue_style(
		'wpcom-font-smoothing-antialiased',
		plugins_url( 'font-smoothing-antialiased.css', __FILE__ ),
		array(),
		Jetpack_Mu_Wpcom::PACKAGE_VERSION
	);
}
add_action( 'admin_enqueue_scripts', 'wpcom_enqueue_font_smoothing_antialiased_assets' );

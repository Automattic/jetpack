<?php
/**
 * Plugin Name: Boost E2E Enqueue Assets
 * Description: Enqueue assets for testing Concatenate JS and CSS.
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Heart of Gold
 * Version: 1.0.0
 * Text Domain: jetpack
 *
 * @package automattic/jetpack
 */

add_action( 'wp_enqueue_scripts', 'e2e_enqueue_assets' );

function e2e_enqueue_assets() {
	wp_enqueue_script( 'jquery' );
	wp_enqueue_script( 'e2e-script-one', plugins_url( 'assets/e2e-script-one.js', __FILE__ ), array(), '1.0.0', true );
	wp_enqueue_script( 'e2e-script-two', plugins_url( 'assets/e2e-script-two.js', __FILE__ ), array(), '1.0.0', true );

	wp_enqueue_style( 'e2e-style-one', plugins_url( 'assets/e2e-style-one.css', __FILE__ ), array(), '1.0.0' );
	wp_enqueue_style( 'e2e-style-two', plugins_url( 'assets/e2e-style-two.css', __FILE__ ), array(), '1.0.0' );
}

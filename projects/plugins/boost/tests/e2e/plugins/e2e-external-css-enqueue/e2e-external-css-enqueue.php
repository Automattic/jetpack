<?php
/**
 * Plugin Name: Boost E2E Enqueue External Stylesheet
 * Description: Enqueue an external stylesheet for testing.
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Heart of Gold
 * Version: 1.0.0
 * Text Domain: jetpack
 *
 * @package automattic/jetpack
 */

add_action( 'wp_enqueue_scripts', 'e2e_enqueue_external_stylesheet' );

function e2e_enqueue_external_stylesheet() {
	if ( is_front_page() ) {
		wp_enqueue_style( 'e2e-external-stylesheet', plugins_url( 'assets/e2e-external-stylesheet.css', __FILE__ ), array(), '1.0.0' );
	}
}

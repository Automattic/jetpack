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
	wp_enqueue_script( 'wp-tinymce' );
	wp_enqueue_script( 'jquery' );
}

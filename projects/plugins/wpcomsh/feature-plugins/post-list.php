<?php
/**
 * Setup and configure the post list package
 *
 * The post list package is part of Jetpack, but is currently not used
 * by the Jetpack plugin. We require and use it on WordPress.com simple
 * and Atomic sites using composer.
 *
 * @package wpcomsh
 */

use Automattic\Jetpack\Config;

/**
 * Main function to setup the package
 */
function wpcomsh_post_list_init() {
	add_filter( 'jetpack_block_editor_republicize_feature', '__return_true' );

	$config = new Config();
	$config->ensure( 'post_list' );
	$config->on_plugins_loaded();
}

add_action( 'admin_init', 'wpcomsh_post_list_init', 1 );

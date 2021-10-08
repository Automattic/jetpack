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
	if ( ! wpcomsh_is_site_sticker_active( 'wpcom-post-list-enhancements' ) ) {
		return;

	}
	$config = new Config();
	$config->ensure( 'post_list' );
}

add_action( 'plugins_loaded', 'wpcomsh_post_list_init', 1 );

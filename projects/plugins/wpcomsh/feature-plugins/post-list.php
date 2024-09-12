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
	wpcomsh_maybe_enable_share_action();

	$config = new Config();
	$config->ensure( 'post_list' );
	$config->on_plugins_loaded();
}

add_action( 'admin_init', 'wpcomsh_post_list_init', 1 );

/**
 * Checks if Republicize is available and that the classic editor plugin
 * in not active. If so, then it enables the Share post action in the
 * post list.
 */
function wpcomsh_maybe_enable_share_action() {
	// Jetpack isn't available. Unlikely if we got here, but worth checking.
	if ( ! class_exists( 'Jetpack' ) || ! class_exists( 'Jetpack_Gutenberg' ) ) {
		return;
	}

	if ( Jetpack::is_plugin_active( 'classic-editor/classic-editor.php' ) ||
		array_key_exists( 'classic-editor.php', get_mu_plugins() ) ) {
		return;
	}

	// Needed to ensure that the jetpack_register_gutenberg_extensions action has fired.
	Jetpack_Gutenberg::get_cached_availability();
	if ( Jetpack_Gutenberg::is_available( 'republicize' ) ) {
		add_filter( 'jetpack_post_list_display_share_action', '__return_true' );
	}
}

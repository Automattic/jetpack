<?php
/**
 * Customizations for CoBlocks
 *
 * CoBlocks is automatically installed as part of the WordPress.com on Atomic migration process.
 * We need to adjust some CoBlocks behaviors to provide tailored WordPress.com experience.
 */

function wpcomsh_coblocks_plugins_loaded() {
	// Disable CoBlocks block-patterns
	// See https://github.com/godaddy-wordpress/coblocks/pull/1659
	if (
		class_exists( 'CoBlocks_Block_Patterns' )
		&& defined( 'CoBlocks_Block_Patterns::POST_TYPE' )
	) {
		$instance = CoBlocks_Block_Patterns::register();

		remove_action( 'admin_enqueue_scripts', array( $instance, 'conditional_load_patterns' ) );

		if ( is_wp_version_compatible( '5.5' ) ) {
			remove_action( 'init', array( $instance, 'register_post_type' ) );
			remove_action( 'init', array( $instance, 'register_type_taxonomy' ) );
			remove_action( 'init', array( $instance, 'register_category_taxonomy' ) );
			remove_action( 'init', array( $instance, 'load_block_patterns' ) );
			remove_action( 'rest_insert_' . CoBlocks_Block_Patterns::POST_TYPE, array( $instance, 'add_taxonomies_on_insert_post' ), 10, 2 );
		}
	}
}
add_action( 'plugins_loaded', 'wpcomsh_coblocks_plugins_loaded' );

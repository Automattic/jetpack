<?php
/**
 * Gutenberg experiment helper stand-in.
 *
 * @package automattic/jetpack-knowledge
 */

/**
 * Read the test's explicit experiment setting.
 *
 * @param string $name Experiment name.
 * @return bool Whether enabled.
 */
function gutenberg_is_experiment_enabled( $name ) {
	$experiments = get_option( 'gutenberg-experiments', array() );
	return ! empty( $experiments[ $name ] );
}

/**
 * Stand in for Gutenberg's generated page enqueue callback.
 */
function gutenberg_guidelines_wp_admin_enqueue_scripts() {}

/**
 * Stand in for Gutenberg's generated route registration callback.
 */
function gutenberg_register_guidelines_wp_admin_page_routes() {}

add_action( 'admin_enqueue_scripts', 'gutenberg_guidelines_wp_admin_enqueue_scripts' );
add_action( 'guidelines-wp-admin_init', 'gutenberg_register_guidelines_wp_admin_page_routes' );

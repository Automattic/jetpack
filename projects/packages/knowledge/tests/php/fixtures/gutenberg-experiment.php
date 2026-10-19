<?php
/**
 * Gutenberg screen callback stand-ins.
 *
 * @package automattic/jetpack-knowledge
 */

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

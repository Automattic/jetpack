<?php
/**
 * Action Hooks for the PostList.
 *
 * @package automattic/jetpack-post-list
 */

namespace Automattic\Jetpack\PostList;

if ( ! defined( 'ABSPATH' ) ) {
	return;
}

/**
 * Check whether the wp-admin-posts-list-page feature is enabled,
 * via the query string.
 *
 * @return boolean True when feature is active. Otherwise, False.
 */
function is_wp_admin_posts_list_page() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	return isset( $_GET['post-list'] ) && 'true' === $_GET['post-list'];
}

/**
 * Start the Jetpack Post List engines.
 */
function init_posts_list() {
	Admin::init();
}

if ( is_wp_admin_posts_list_page() ) {
	add_action( 'init', __NAMESPACE__ . '\init_posts_list' );
}

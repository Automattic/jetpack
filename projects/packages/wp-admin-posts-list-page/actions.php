<?php
/**
 * Action Hooks for the WPAdminPostsListPage.
 *
 * @package automattic/jetpack-wp-admin-posts-list-page
 */

namespace Automattic\Jetpack\WPAdminPostsListPage;

if ( ! defined( 'ABSPATH' ) ) {
	return;
}

/**
 * Start the WordPress Admin Plus engines.
 */
function init_wp_admin_posts_list_page() {
	Admin::init();
}

add_action( 'init', __NAMESPACE__ . '\init_wp_admin_posts_list_page' );

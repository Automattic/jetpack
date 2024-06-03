<?php
/**
 * WP-Admin Posts list bootstrap file.
 *
 * @package automattic/jetpack-masterbar
 */

namespace Automattic\Jetpack\Masterbar;

/**
 * Load the Posts_List_Notification.
 */
function masterbar_init_wp_posts_list() {
	global $pagenow;

	if (
		( 'edit.php' === $pagenow && isset( $_GET['post_type'] ) && 'page' === $_GET['post_type'] ) // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	) {
		require_once __DIR__ . '/class-posts-list-page-notification.php';
		Automattic\Jetpack\Masterbar\Posts_List_Page_Notification::init();
	}
}

add_action( 'init', __NAMESPACE__ . '\masterbar_init_wp_posts_list', 1 );

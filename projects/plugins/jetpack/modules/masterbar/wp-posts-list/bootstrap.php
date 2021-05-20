<?php
/**
 * WP-Admin Posts list bootstrap file.
 *
 * @package Jetpack
 */

/**
 * Load the Posts_List_Notification.
 */
global $pagenow;

// phpcs:ignore
if ( ( $pagenow === 'edit.php' && isset( $_GET['post_type'] ) && $_GET['post_type'] === 'page' ) || $pagenow === 'post.php' ) {
	require_once __DIR__ . '/class-posts-list-page-notification.php';
	Automattic\Jetpack\Dashboard_Customizations\Posts_List_Page_Notification::init();
}

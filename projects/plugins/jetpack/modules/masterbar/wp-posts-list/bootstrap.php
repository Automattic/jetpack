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

if (
	( 'edit.php' === $pagenow && isset( $_GET['post_type'] ) && 'page' === $_GET['post_type'] ) // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	|| 'post.php' === $pagenow
) {
	require_once __DIR__ . '/class-posts-list-page-notification.php';
	Automattic\Jetpack\Dashboard_Customizations\Posts_List_Page_Notification::init();
}

<?php
/**
 * WP-Admin Posts list bootstrap file.
 *
 * @deprecated 13.7
 *
 * @package automattic\jetpack
 *
 * @phan-file-suppress PhanDeprecatedFunction -- Ok for deprecated code to call other deprecated code.
 */

_deprecated_file( __FILE__, 'jetpack-13.7' );

/**
 * Load the Posts_List_Notification.
 *
 * @deprecated 13.7
 */
function masterbar_init_wp_posts_list() {
	_deprecated_function( __FUNCTION__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\masterbar_init_wp_posts_list' );

	global $pagenow;

	if (
		( 'edit.php' === $pagenow && isset( $_GET['post_type'] ) && 'page' === $_GET['post_type'] ) // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	) {
		require_once __DIR__ . '/class-posts-list-page-notification.php';
		Automattic\Jetpack\Dashboard_Customizations\Posts_List_Page_Notification::init();
	}
}

add_action( 'init', 'masterbar_init_wp_posts_list', 1 );

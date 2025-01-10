<?php
/**
 * Customizations to the Blaze feature.
 * We want that feature to always be available on Atomic sites.
 *
 * @package wpcomsh
 */

use Automattic\Jetpack\Connection\Manager as Jetpack_Connection;

/**
 * Activate the Blaze module
 * If you use a version of Jetpack that supports it,
 * and if it is not already enabled.
 */
function wpcomsh_activate_blaze_module() {
	if ( ! defined( 'JETPACK__VERSION' ) || ! class_exists( 'Jetpack' ) ) {
		return;
	}

	if ( ! Jetpack::is_module_active( 'blaze' ) ) {
		Jetpack::activate_module( 'blaze', false, false );
	}
}

/**
 * Force-enable the Blaze module
 */
function wpcomsh_force_activate_blaze_module() {
	if ( 'wp-admin' === get_option( 'wpcom_admin_interface' ) ) {
		return;
	}

	wpcomsh_activate_blaze_module();
}
add_action( 'init', 'wpcomsh_force_activate_blaze_module', 0, 0 );

/**
 * Remove Blaze from the old Module list.
 * Available at wp-admin/admin.php?page=jetpack_modules
 *
 * @param array $items Array of Jetpack modules.
 * @return array
 */
function wpcomsh_rm_blaze_module_list( $items ) {
	if ( isset( $items['blaze'] ) && get_option( 'wpcom_admin_interface' ) !== 'wp-admin' ) {
		unset( $items['blaze'] );
	}
	return $items;
}
add_filter( 'jetpack_modules_list_table_items', 'wpcomsh_rm_blaze_module_list' );

/**
 * The Blaze module may not be auto-activated when the site is not public,
 * so we have to activate the module when it's public manually.
 *
 * @param int $old_value of blog_public option.
 * @param int $new_value of blog_public option.
 */
function wpcomsh_activate_blaze_module_on_launching( $old_value, $new_value ) {
	$blog_public = (int) $new_value;
	// 'blog_public' is set to '1' when a site is launched.
	if ( $blog_public === 1 ) {
		wpcomsh_activate_blaze_module();
	}

	return $new_value;
}
add_filter( 'update_option_blog_public', 'wpcomsh_activate_blaze_module_on_launching', 10, 2 );

/**
 * Delete the transient for the given site id.
 *
 * @return void
 */
function wpcomsh_blaze_purge_transient_cache() {
	$site_id = Jetpack_Connection::get_site_id();

	if ( is_wp_error( $site_id ) ) {
		return;
	}

	$transient = 'jetpack_blaze_site_supports_blaze_' . $site_id;
	delete_transient( $transient );
}

/**
 * Delete the caching transient when coming soon is changed.
 */
add_action(
	'pre_update_option_wpcom_public_coming_soon',
	function ( $option ) {
		wpcomsh_blaze_purge_transient_cache();
		return $option;
	}
);

/**
 * Delete the caching transient when the blog visibility option changes.
 */
add_action(
	'pre_update_option_blog_public',
	function ( $option ) {
		wpcomsh_blaze_purge_transient_cache();
		return $option;
	}
);

/**
 * On Atomic sites the Promote with Blaze option is enabled.
 *
 * @phan-suppress PhanUndeclaredFunctionInCallable -- jetpack_blaze_post_row_actions_disable is part of jetpack.
 */
add_action(
	'jetpack_modules_loaded',
	function () {
		remove_filter( 'jetpack_blaze_post_row_actions_enable', 'jetpack_blaze_post_row_actions_disable' );
	}
);

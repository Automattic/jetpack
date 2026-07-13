<?php
/**
 * WordPress.com-only get-site endpoint test functions.
 *
 * @phan-file-suppress PhanRedefineFunction
 *
 * @package automattic/jetpack
 */

if ( ! function_exists( 'get_jetpack_hosting_provider' ) ) {
	/**
	 * Test stub for the WordPress.com-only helper.
	 *
	 * @param int $blog_id Blog ID.
	 * @return string
	 */
	function get_jetpack_hosting_provider( $blog_id ) { // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedFunctionFound
		return 'pressable-' . (int) $blog_id;
	}
}

if ( ! function_exists( 'get_blog_option' ) ) {
	/**
	 * Single-site test stub for the multisite helper.
	 *
	 * @param int    $id            Blog ID.
	 * @param string $option        Option name.
	 * @param mixed  $default_value Optional. Default value.
	 * @return mixed
	 */
	function get_blog_option( $id, $option, $default_value = false ) { // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedFunctionFound
		return get_option( $option, $default_value );
	}
}

if ( ! function_exists( 'switch_to_blog' ) ) {
	/**
	 * Single-site test stub for the multisite helper.
	 *
	 * @param int $new_blog_id Blog ID.
	 * @return bool
	 */
	function switch_to_blog( $new_blog_id ) { // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedFunctionFound
		unset( $new_blog_id );
		return true;
	}
}

if ( ! function_exists( 'restore_current_blog' ) ) {
	/**
	 * Single-site test stub for the multisite helper.
	 *
	 * @return bool
	 */
	function restore_current_blog() { // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedFunctionFound
		return true;
	}
}

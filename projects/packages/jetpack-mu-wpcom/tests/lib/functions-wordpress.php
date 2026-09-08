<?php
/**
 * Functions that mock WordPress core functionality for testing purposes.
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( ! function_exists( 'add_blog_option' ) ) {
	/**
	 * A drop-in for a WordPress core function.
	 *
	 * @param int    $id     A blog ID. Can be null to refer to the current blog.
	 * @param string $option Name of option to add. Expected to not be SQL-escaped.
	 * @param mixed  $value  Optional. Option value, can be anything. Expected to not be SQL-escaped.
	 * @return bool True if the option was added, false otherwise.
	 */
	function add_blog_option( $id, $option, $value ) {
		$id = (int) $id;

		if ( empty( $id ) ) {
			$id = get_current_blog_id();
		}

		if ( get_current_blog_id() == $id ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual
			return add_option( $option, $value );
		}

		switch_to_blog( $id );
		$return = add_option( $option, $value );
		restore_current_blog();

		return $return;
	}
}

if ( ! function_exists( 'wpcom_expiry_get_purchases' ) ) {
	/**
	 * Test seam for the expiry-notices wrapper. Shadows the production
	 * function without redefining wpcom_get_site_purchases() globally, which
	 * would change behaviour for unrelated features that use
	 * function_exists() guards on it.
	 *
	 * @return array
	 */
	function wpcom_expiry_get_purchases() {
		return $GLOBALS['wpcom_get_site_purchases_test_value'] ?? array();
	}
}

if ( ! function_exists( 'wpcom_is_vip' ) ) {
	/**
	 * A drop-in for a WordPress.com function. Defaults to false, matching a
	 * regular site, so features that guard on it behave as they did before
	 * this stub existed.
	 *
	 * @return bool
	 */
	function wpcom_is_vip() {
		return ! empty( $GLOBALS['wpcom_is_vip_test_value'] );
	}
}

if ( ! function_exists( 'get_blog_details' ) ) {
	/**
	 * A drop-in for the multisite function WordPress.com keeps the unmapped
	 * domain in. WorDBless is single-site, so it does not ship one.
	 *
	 * @param int $blog_id Blog ID. Unused: tests only ever have one site.
	 * @return object|false
	 */
	function get_blog_details( $blog_id = 0 ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- single-site test env.
		$domain = $GLOBALS['wpcom_blog_details_domain_test_value'] ?? null;
		return null === $domain ? false : (object) array( 'domain' => $domain );
	}
}

if ( ! function_exists( 'wpcom_rest_api_v2_load_plugin' ) ) {
	/**
	 * A drop-in for a WordPress.com function.
	 *
	 * @param string $class_name The name of the class to load.
	 */
	function wpcom_rest_api_v2_load_plugin( $class_name ) {
		global $wpcom_rest_api_v2_plugins;

		if ( ! isset( $wpcom_rest_api_v2_plugins ) ) {
			$wpcom_rest_api_v2_plugins = array();
		}

		if ( ! isset( $wpcom_rest_api_v2_plugins[ $class_name ] ) ) {
			$wpcom_rest_api_v2_plugins[ $class_name ] = new $class_name();
		}
	}
}

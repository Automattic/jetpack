<?php
/**
 * Stand-in for the multisite `get_blog_details()`, which WorDBless does not load.
 *
 * @package automattic/jetpack-premium-analytics
 */

/**
 * The `registered` value the simulated WordPress.com blog reports. Tests assign it directly.
 */
$GLOBALS['jpa_test_blog_registered'] = null;

if ( ! function_exists( 'get_blog_details' ) ) {
	/**
	 * The simulated blog's details.
	 *
	 * @return object
	 */
	function get_blog_details() {
		return (object) array( 'registered' => $GLOBALS['jpa_test_blog_registered'] );
	}
}

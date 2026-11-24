<?php
/**
 * Test stub for the WordPress.com site settings endpoint, which only WordPress.com and Jetpack load.
 *
 * @package automattic/jetpack-google-analytics
 */

if ( ! class_exists( 'WPCOM_JSON_API_Site_Settings_Endpoint' ) ) {
	/**
	 * Minimal stub: the API version GA_Manager reads.
	 */
	class WPCOM_JSON_API_Site_Settings_Endpoint {
		/**
		 * The endpoint's API version.
		 *
		 * @var string
		 */
		public $min_version = '';
	}
}

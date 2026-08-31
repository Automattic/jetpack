<?php
/**
 * Minimal WooCommerce class stub for schema tests.
 *
 * @package automattic/jetpack-seo
 */

if ( ! class_exists( 'WooCommerce' ) ) {

	/**
	 * Stand-in for the WooCommerce plugin class.
	 */
	class WooCommerce {

		/**
		 * Whether the current test request uses a WooCommerce template.
		 *
		 * @var bool
		 */
		public static $is_template = false;

		/**
		 * Structured-data callback owner.
		 *
		 * @var WC_Structured_Data
		 */
		public $structured_data;

		/**
		 * Singleton instance.
		 *
		 * @var WooCommerce|null
		 */
		private static $instance;

		/**
		 * Set up the structured-data owner.
		 */
		public function __construct() {
			$this->structured_data = new WC_Structured_Data();
		}

		/**
		 * Get the singleton test instance.
		 *
		 * @return WooCommerce
		 */
		public static function instance() {
			if ( null === self::$instance ) {
				self::$instance = new self();
			}

			return self::$instance;
		}
	}
}

<?php
/**
 * Test stub for the WAF package runner.
 *
 * The my-jetpack package does not depend on jetpack-waf, but
 * Protect::get_site_protect_data() reads Waf_Runner::get_config() when the package is
 * present at runtime (as it is inside the Jetpack plugin). This stub lets the endpoint
 * test exercise that branch.
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\Waf;

if ( ! class_exists( __NAMESPACE__ . '\Waf_Runner' ) ) {
	/**
	 * Minimal stub exposing the methods Protect::get_site_protect_data() calls.
	 */
	class Waf_Runner {

		/**
		 * The configuration get_config() hands back.
		 *
		 * @var array
		 */
		public static $config = array();

		/**
		 * Return the WAF configuration.
		 *
		 * @return array
		 */
		public static function get_config() {
			return self::$config;
		}

		/**
		 * Whether the WAF is enabled.
		 *
		 * @return bool
		 */
		public static function is_enabled() {
			return true;
		}

		/**
		 * Whether the environment supports the WAF.
		 *
		 * @return bool
		 */
		public static function is_supported_environment() {
			return true;
		}
	}
}

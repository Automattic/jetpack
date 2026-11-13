<?php
/**
 * Test stub for GA_Manager, which jetpack-mu-wpcom loads at runtime.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\Google_Analytics;

if ( ! class_exists( __NAMESPACE__ . '\GA_Manager' ) ) {
	/**
	 * Minimal stub: the option name on Atomic.
	 */
	class GA_Manager {
		/**
		 * The instance.
		 *
		 * @return self
		 */
		public static function get_instance() {
			return new self();
		}

		/**
		 * The option the settings live in.
		 *
		 * @return string
		 */
		public function get_google_analytics_option_name() {
			return 'jetpack_wga';
		}
	}
}

<?php
/**
 * Stand-in for the Google Analytics package's manager, which only jetpack-mu-wpcom loads.
 *
 * @package automattic/jetpack-premium-analytics
 */

// phpcs:disable WordPress.Files.FileName

namespace Automattic\Jetpack\Google_Analytics;

if ( ! class_exists( GA_Manager::class ) ) {
	/**
	 * Picks the option name as the real manager does.
	 */
	class GA_Manager {
		/**
		 * The single instance.
		 *
		 * @var GA_Manager|null
		 */
		private static $instance = null;

		/**
		 * The single instance.
		 *
		 * @return GA_Manager
		 */
		public static function get_instance() {
			if ( null === self::$instance ) {
				self::$instance = new self();
			}
			return self::$instance;
		}

		/**
		 * `jetpack_wga` where Jetpack runs, `wga` on Simple.
		 *
		 * @return string
		 */
		public function get_google_analytics_option_name() {
			// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- The real manager's filter.
			return true === apply_filters( 'is_jetpack_site', false, get_current_blog_id() ) ? 'jetpack_wga' : 'wga';
		}
	}
}

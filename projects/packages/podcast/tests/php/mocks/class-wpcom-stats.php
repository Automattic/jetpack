<?php
/**
 * Stats package test double.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Stats;

if ( ! class_exists( __NAMESPACE__ . '\WPCOM_Stats', false ) ) {
	/**
	 * Minimal Stats package test double.
	 */
	class WPCOM_Stats {
		/**
		 * Mock visits response.
		 *
		 * @var array
		 */
		public static $visits = array();

		/**
		 * Last received query args.
		 *
		 * @var array
		 */
		public static $last_args = array();

		/**
		 * Return a mocked visits response.
		 *
		 * @param array $args Query args.
		 * @return array
		 */
		public function get_visits( $args = array() ) {
			self::$last_args = $args;
			return self::$visits;
		}
	}
}

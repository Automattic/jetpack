<?php
/**
 * Stand-in for `Current_Plan`, which this package does not depend on; it counts refreshes.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack;

if ( ! class_exists( Current_Plan::class ) ) {
	/**
	 * Test double.
	 */
	class Current_Plan {
		/**
		 * Refresh calls so far.
		 *
		 * @var int
		 */
		public static $refresh_count = 0;

		/**
		 * Records a refresh.
		 *
		 * @return bool
		 */
		public static function refresh_from_wpcom() {
			++self::$refresh_count;
			return true;
		}
	}
}

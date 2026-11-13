<?php
/**
 * Stands in for the optional Activity Log package. Tests set its availability in a global.
 *
 * @package automattic/jetpack-backup-plugin
 */

namespace Automattic\Jetpack\Activity_Log;

if ( ! class_exists( Jetpack_Activity_Log::class ) ) {
	/**
	 * Activity Log stand-in.
	 */
	class Jetpack_Activity_Log {
		/**
		 * @return bool
		 */
		public static function is_available() {
			return ! empty( $GLOBALS['jetpack_backup_test_activity_log_available'] );
		}
	}
}

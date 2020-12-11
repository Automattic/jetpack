<?php
/**
 * Contains utilities related to the Jetpack Recommendations.
 *
 * @package Jetpack
 */

/**
 * Jetpack_Recommendations class
 */
class Jetpack_Recommendations {
	/**
	 * Returns a boolean indicating if the Jetpack Recommendations are enabled.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		/**
		 * Determines if the Jetpack Recommendations is displayed or not.
		 *
		 * @since 9.3.0
		 *
		 * @param array $jetpack_show_setup_wizard If true, the Setup Wizard will be displayed. Otherwise it will not display.
		 */
		return true;
	}
}

<?php
/**
 * Displays the first page of the Wizard in a banner form
 *
 * @package Jetpack
 */

/**
 * Jetpack_Wizard class
 */
class Jetpack_Wizard {
	/**
	 * Can the Wizard be displayed?
	 *
	 * @return bool
	 */
	public static function can_be_displayed() {
		/**
		 * Determines if the Setup Wizard is displayed or not.
		 *
		 * @since 8.5.0
		 * @deprecated 9.4.0
		 *
		 * @param array $jetpack_show_setup_wizard If true, the Setup Wizard will be displayed. Otherwise it will not display.
		 */
		return false;
	}
}

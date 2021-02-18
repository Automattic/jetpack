<?php
/**
 * Deprecated since 9.5.0
 *
 * @deprecated
 * @package automattic/jetpack
 */

// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
_deprecated_file( basename( __FILE__ ), 'jetpack-9.5.0' );

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

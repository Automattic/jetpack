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
	 * Has the user started the Wizard?
	 *
	 * @return bool
	 */
	public static function is_started() {
		// TODO: check saved Jetpack_Option (to be implemented).
		return false;
	}

	/**
	 * Has the user finished the Wizard?
	 *
	 * @return bool
	 */
	public static function is_finished() {
		// TODO: check saved Jetpack_Option (to be implemented).
		return false;
	}

	/**
	 * Can the Wizard be displayed?
	 *
	 * @return bool
	 */
	public static function can_be_displayed() {
		/** This filter is documented in _inc/lib/admin-pages/class.jetpack-react-page.php */
		return apply_filters( 'jetpack_show_setup_wizard', false )
				&& Jetpack::is_active()
				&& ! self::is_finished()
				&& current_user_can( 'jetpack_manage_modules' );
	}
}

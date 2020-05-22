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
		return apply_filters( 'jetpack_show_setup_wizard', false )
			&& Jetpack::is_active()
			&& current_user_can( 'jetpack_manage_modules' )
			&& 'completed' !== Jetpack_Options::get_option( 'setup_wizard_status' );
	}
}

<?php
/**
 * Displays the first page of the Wizard in a banner form
 *
 * @package none
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
		return apply_filters( 'jetpack_connection_prompt_helpers', false ) &&
			Jetpack::is_active() &&
			! self::is_finished();
	}

	// TODO: move save and get from the endpoint (update_setup_questionnaire() and get_setup_questionnaire()) to this class.
}

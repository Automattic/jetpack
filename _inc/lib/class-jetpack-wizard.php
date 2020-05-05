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
		return true;
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

	// TODO: move option save from the endpoint into here.
}

<?php
/**
 * Class file for managing the user onboarding experience.
 *
 * @package automattic/jetpack-protect-plugin
 */

namespace Automattic\Jetpack\Protect;

/**
 * Onboarding
 */
class Onboarding {

	const OPTION_NAME = 'protect_onboarding_progress';

	/**
	 * User ID
	 *
	 * @var int
	 */
	private static $user_id;

	/**
	 * Current User Progress
	 *
	 * @var array<string>
	 */
	private static $current_user_progress;

	/**
	 * Onboarding Init
	 *
	 * @return void
	 */
	private static function init() {
		self::$user_id = get_current_user_id();

		$current_user_progress       = get_user_meta( self::$user_id, self::OPTION_NAME, true );
		self::$current_user_progress = $current_user_progress ? $current_user_progress : array();
	}

	/**
	 * Set Onboarding Item As Completed
	 *
	 * @param string $step_id The onboarding step ID.
	 * @return bool
	 */
	public static function complete_step( $step_id ) {
		self::init();

		if ( ! in_array( $step_id, self::$current_user_progress, true ) ) {
			array_push( self::$current_user_progress, $step_id );
			return (bool) update_user_meta(
				self::$user_id,
				self::OPTION_NAME,
				self::$current_user_progress
			);
		}
	}

	/**
	 * Get Current User's Onboarding Progress
	 *
	 * @return array<string>
	 */
	public static function get_current_user_progress() {
		self::init();

		return self::$current_user_progress;
	}

}

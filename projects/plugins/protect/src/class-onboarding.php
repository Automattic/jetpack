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
	 * The current user's ID
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
	 * Set Onboarding Items As Completed
	 *
	 * @param array $step_ids The IDs of the steps to complete.
	 * @return bool True if the update was successful, false otherwise.
	 */
	public static function complete_steps( $step_ids ) {
		self::init();

		if ( empty( self::$current_user_progress ) ) {
			self::$current_user_progress = $step_ids;
		} else {
			// Find step IDs that are not already in the current user progress
			$new_steps = array_diff( $step_ids, self::$current_user_progress );

			// Merge new steps with current progress
			self::$current_user_progress = array_merge( self::$current_user_progress, $new_steps );
		}

		// Update the user meta only once
		return (bool) update_user_meta(
			self::$user_id,
			self::OPTION_NAME,
			self::$current_user_progress
		);
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

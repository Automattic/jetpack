<?php
/**
 * Test-only subclass of Monitor_Abilities that overrides the protected seams
 * (user-connection check, remote state fetch, remote update apply) so the
 * success path can be exercised without a Jetpack token fixture or live IXR
 * endpoint.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Plugin\Abilities\Monitor_Abilities;

/**
 * Test-only subclass overriding Monitor_Abilities's protected seams.
 *
 * - is_user_connected_to_jetpack(): always true.
 * - fetch_notifications_state(): returns the seeded value from ::reset().
 * - apply_notifications_update(): records each call instead of hitting IXR.
 */
class Monitor_Abilities_Test_Stub extends Monitor_Abilities {

	/**
	 * Seeded remote state for fetch_notifications_state().
	 *
	 * @var bool
	 */
	public static $current_state = false;

	/**
	 * Number of apply_notifications_update() calls in the current test.
	 *
	 * @var int
	 */
	public static $apply_calls = 0;

	/**
	 * Last value passed to apply_notifications_update().
	 *
	 * @var bool|null
	 */
	public static $last_applied = null;

	/**
	 * Reset test-double state and seed the simulated remote state.
	 *
	 * @param bool $current_state Simulated current notifications state.
	 */
	public static function reset( bool $current_state ): void {
		self::$current_state = $current_state;
		self::$apply_calls   = 0;
		self::$last_applied  = null;
	}

	/**
	 * Always-connected for tests — bypasses the real Connection_Manager check.
	 */
	protected static function is_user_connected_to_jetpack(): bool {
		return true;
	}

	/**
	 * Return the seeded simulated remote state.
	 *
	 * @return bool
	 */
	protected static function fetch_notifications_state() {
		return self::$current_state;
	}

	/**
	 * Record the call instead of sending the real IXR request.
	 *
	 * @param bool $enabled Desired state.
	 * @return true
	 */
	protected static function apply_notifications_update( bool $enabled ) {
		++self::$apply_calls;
		self::$last_applied  = $enabled;
		self::$current_state = $enabled;
		return true;
	}
}

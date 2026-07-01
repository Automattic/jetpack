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
 * - fetch_notifications_state(): returns the seeded value (bool or WP_Error).
 * - fetch_last_status_change(): returns the seeded value (string|null|WP_Error).
 * - apply_notifications_update(): records each call instead of hitting IXR.
 */
class Monitor_Abilities_Test_Stub extends Monitor_Abilities {

	/**
	 * Seeded remote state for fetch_notifications_state().
	 *
	 * @var bool|\WP_Error
	 */
	public static $current_state = false;

	/**
	 * Seeded remote response for fetch_last_status_change(). When `false`, the
	 * stub falls through to a default `null` (no transition recorded) to keep
	 * the legacy set_notifications tests working without a manual seed.
	 *
	 * @var string|null|false|\WP_Error
	 */
	public static $last_status_change = null;

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
	 * @param bool|\WP_Error              $current_state      Simulated current notifications state.
	 * @param string|null|\WP_Error|false $last_status_change Simulated last status change.
	 */
	public static function reset( $current_state, $last_status_change = null ): void {
		self::$current_state      = $current_state;
		self::$last_status_change = $last_status_change;
		self::$apply_calls        = 0;
		self::$last_applied       = null;
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
	 * @return bool|\WP_Error
	 */
	protected static function fetch_notifications_state() {
		return self::$current_state;
	}

	/**
	 * Return the seeded simulated last-status-change response.
	 *
	 * @return string|null|\WP_Error
	 */
	protected static function fetch_last_status_change() {
		return self::$last_status_change;
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

	/**
	 * Public passthrough exposing the protected normalize_last_status_change
	 * helper so tests can drive it directly without reflection.
	 *
	 * @param mixed $value Raw remote/cached value.
	 * @return string|null
	 */
	public static function expose_normalize_last_status_change( $value ) {
		return parent::normalize_last_status_change( $value );
	}
}

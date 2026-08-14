<?php
/**
 * Test stub for the Jetpack plugin's Jetpack_Memberships class, which the AI
 * Launchpad memberships completion override reads. The Jetpack plugin is not
 * loaded by the mu-wpcom test bootstrap, so this stands in and is aliased onto
 * the global Jetpack_Memberships name.
 *
 * @package automattic/jetpack-mu-wpcom
 */

// phpcs:ignoreFile -- test stub fixture.

/**
 * Stand-in for Jetpack_Memberships (only the static signals the override reads).
 */
class AI_Launchpad_Stub_Jetpack_Memberships {
	public static $connected        = false;
	public static $plans            = false;
	public static $newsletter_plans = false;

	public static function has_connected_account() {
		return self::$connected;
	}

	public static function has_configured_plans_jetpack_recurring_payments( $type = '' ) {
		return 'newsletter' === $type ? self::$newsletter_plans : self::$plans;
	}
}

if ( ! class_exists( 'Jetpack_Memberships', false ) ) {
	class_alias( 'AI_Launchpad_Stub_Jetpack_Memberships', 'Jetpack_Memberships' );
}

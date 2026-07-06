<?php
/**
 * Test stubs for the Jetpack Social classes (and the AI_Launchpad slug constant)
 * the social listener reads. The publicize package and ai-launchpad.php are not
 * loaded by the mu-wpcom test bootstrap, so these stand in and are aliased onto
 * the names the listener references. Several stubs share this fixture file.
 *
 * @package automattic/jetpack-mu-wpcom
 */

// phpcs:ignoreFile -- test stub fixture: several throwaway stand-in classes share one file.

/**
 * Stand-in for Automattic\Jetpack\Publicize\Publicize_Utils.
 */
class AI_Launchpad_Stub_Publicize_Utils {
	public static $active = false;
	public static function is_publicize_active() {
		return self::$active;
	}
}

/**
 * Stand-in for Automattic\Jetpack\Publicize\Connections.
 */
class AI_Launchpad_Stub_Connections {
	public static $all = array();
	public static function get_all() {
		return self::$all;
	}
}

/**
 * Stand-in for Automattic\Jetpack\Jetpack_Mu_Wpcom\AI_Launchpad (just the slug).
 */
class AI_Launchpad_Stub_AI_Launchpad {
	const MENU_SLUG = 'site-setup-wp-admin';
}

if ( ! class_exists( 'Automattic\\Jetpack\\Publicize\\Publicize_Utils', false ) ) {
	class_alias( 'AI_Launchpad_Stub_Publicize_Utils', 'Automattic\\Jetpack\\Publicize\\Publicize_Utils' );
}
if ( ! class_exists( 'Automattic\\Jetpack\\Publicize\\Connections', false ) ) {
	class_alias( 'AI_Launchpad_Stub_Connections', 'Automattic\\Jetpack\\Publicize\\Connections' );
}
if ( ! class_exists( 'Automattic\\Jetpack\\Jetpack_Mu_Wpcom\\AI_Launchpad', false ) ) {
	class_alias( 'AI_Launchpad_Stub_AI_Launchpad', 'Automattic\\Jetpack\\Jetpack_Mu_Wpcom\\AI_Launchpad' );
}

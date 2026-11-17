<?php
/**
 * Stand-in for the Jetpack plugin's module API, which wpcomsh does not bundle.
 *
 * @package wpcomsh
 */

/**
 * Defines a `Jetpack` class that saves modules here and, like Jetpack, reads the active list through `jetpack_active_modules`.
 */
class Jetpack_Stand_In {

	/**
	 * Modules saved as active.
	 *
	 * @var string[]
	 */
	public static $saved = array();

	/**
	 * Whether an activation succeeds.
	 *
	 * @var bool
	 */
	public static $can_activate = true;

	/**
	 * Define `Jetpack`, which cannot be unloaded, so call this from a test that runs in its own process.
	 *
	 * @return bool False when the real Jetpack class is already loaded.
	 */
	public static function load() {
		if ( class_exists( 'Jetpack' ) ) {
			return false;
		}
		if ( ! defined( 'JETPACK__VERSION' ) ) {
			define( 'JETPACK__VERSION', '15.0' );
		}
		eval( 'class Jetpack { public static function is_module_active( $module ) { return in_array( $module, apply_filters( "jetpack_active_modules", Jetpack_Stand_In::$saved ), true ); } public static function activate_module( $module ) { if ( Jetpack_Stand_In::$can_activate ) { Jetpack_Stand_In::$saved[] = $module; } return Jetpack_Stand_In::$can_activate; } }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval
		return true;
	}
}

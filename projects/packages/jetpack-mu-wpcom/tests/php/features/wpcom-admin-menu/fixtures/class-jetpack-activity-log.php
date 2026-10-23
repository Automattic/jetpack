<?php
/**
 * Stand-in for the `jetpack-activity-log` package, which ships with Jetpack rather than this package.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Activity_Log;

/**
 * Registers the page when `$supports_simple` is set, as the package does once it supports Simple sites.
 */
class Jetpack_Activity_Log {

	/**
	 * Whether this stand-in behaves like a package version with Simple support.
	 *
	 * @var bool
	 */
	public static $supports_simple = true;

	/**
	 * Registers the page, or returns null like a version predating Simple support.
	 *
	 * @return string|null
	 */
	public static function add_wp_admin_submenu() {
		if ( ! self::$supports_simple ) {
			return null;
		}

		return add_submenu_page( 'jetpack', 'Activity Log', 'Activity Log', 'manage_options', 'jetpack-activity-log', '__return_null' );
	}
}

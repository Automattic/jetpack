<?php
/**
 * Search package information.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Search package general information
 */
class Package {
	const VERSION = '0.9.1-alpha';
	const SLUG    = 'search';

	/**
	 * The path where package is installed.
	 *
	 * @var string
	 */
	protected static $installed_path;

	/**
	 * Adds the package slug and version to the package version tracker's data.
	 *
	 * @param array $package_versions The package version array.
	 *
	 * @return array The packge version array.
	 */
	public static function send_version_to_tracker( $package_versions ) {
		$package_versions[ self::SLUG ] = self::VERSION;
		return $package_versions;
	}

	/**
	 * Whether Jetpack Search Package's version maps to a public release, or a development version.
	 */
	public static function is_development_version() {
		return (bool) apply_filters(
			'jetpack_search_pkg_version',
			! preg_match( '/^\d+(\.\d+)+$/', self::VERSION )
		);
	}

	/**
	 * Return the path where the package is installed with trailing slash.
	 * It's important not to use a constant, as there could be multiple versions of search package installed.
	 *
	 * @return string
	 */
	public static function get_installed_path() {
		if ( is_null( static::$installed_path ) ) {
			static::$installed_path = dirname( __DIR__ ) . PATH_SEPARATOR;
		}
		return static::$installed_path;
	}
}

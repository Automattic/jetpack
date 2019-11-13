<?php
/**
 * Top level object for registering and fetching named capabilities, e.g. 'jetpack.backups.restore'
 *
 * @package automattic/jetpack-capabilities
 */

namespace Automattic\Jetpack;

use \Automattic\Jetpack\Capabilities\Capability;

// phpcs:ignore Squiz.Commenting.ClassComment.Missing
class Capabilities {
	/**
	 * The list of registered capabilities
	 *
	 * @var array capabilities
	 */
	private static $capabilities = [];

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public static function get( $name ) {
		return self::$capabilities[ $name ];
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public static function register( $capability ) {
		// TODO check for clashes?
		self::$capabilities[ $capability->name ] = $capability;
	}
}

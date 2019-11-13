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
	public static function clear() {
		self::$capabilities = [];
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public static function get( $name ) {
		return self::$capabilities[ $name ];
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public static function register( $capability ) {
		// TODO check for clashes?
		self::$capabilities[ $capability->name ] = $capability;
	}

	// public static function register_caps()

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public static function user_has_cap( $allcaps, $caps, $args, $user ) {

		list( $cap ) = $args;

		if ( isset( self::$capabilities[ $cap ] ) ) {
			$allcaps[ $cap ] = self::$capabilities[ $cap ]->check()->granted();
		}

		return $allcaps;
	}
}

// add_action( 'admin_init', '\Automattic\Jetpack\Capabilities', 'register_caps' );
add_filter( 'user_has_cap', [ '\Automattic\Jetpack\Capabilities', 'user_has_cap' ], 10, 4 );
// add_filter( 'map_meta_cap', [ '\Automattic\Jetpack\Capabilities', 'map_meta_cap' ], 10, 4 );

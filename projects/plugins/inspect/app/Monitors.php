<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack_Inspect;

use Automattic\Jetpack_Inspect\Monitor\Incoming_REST_API;
use Automattic\Jetpack_Inspect\Monitor\Outgoing;

/**
 * The Monitors class.
 */
class Monitors {
	const AVAILABLE_OBSERVERS = array(
		'outgoing' => Outgoing::class,
		'incoming' => Incoming_REST_API::class,
	);

	/**
	 * Array of existing instances.
	 *
	 * @var array
	 */
	protected static $instances = array();

	/**
	 * Returns an instance that observer with a specific name.
	 *
	 * @param String $name observer name.
	 */
	public static function get( $name ) {

		if ( ! isset( static::AVAILABLE_OBSERVERS[ $name ] ) ) {
			return new \WP_Error( "The requested monitor doesn't exist." );
		}

		if ( ! isset( static::$instances[ $name ] ) ) {
			$class                      = static::AVAILABLE_OBSERVERS[ $name ];
			static::$instances[ $name ] = new Monitor( "observer_{$name}", new $class() );
		}

		return static::$instances[ $name ];
	}

	/**
	 * Initializes the instance holder.
	 */
	public static function initialize() {
		foreach ( self::AVAILABLE_OBSERVERS as $name => $class ) {
			self::get( $name )->initialize();
		}
	}
}

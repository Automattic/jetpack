<?php

namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack_Boost\Contracts\Has_Setup;

class Setup {

	protected static $instances = array();

	/**
	 * This method takes a `Has_Setup` instance and registers the setup action.
	 * In addition, it will keep track of all the instances passed to it,
	 *
	 * This is useful if a plugin needs the instance
	 * to modify the behavior at a certain hook that
	 * Jetpack Boost is using.
	 *
	 * The use case would be something like this:
	 * ```
	 *      $instance = my_get_instance_method( Setup::get_instances() );
	 *      remove_action( 'wp_footer', array( $instance, 'foobar' ) );
	 * ```
	 *
	 * @param Has_Setup $instance
	 *
	 * @return void
	 */
	public static function add( Has_Setup $instance ) {
		$instance->setup();

		self::$instances[] = $instance;
	}

	public static function get_instances() {
		return self::$instances;
	}

	/**
	 * @template T
	 * @param class-string<T> $class_name
	 * @return T|null
	 */
	public static function get_instance_of( $class_name ) {
		foreach ( self::get_instances() as $instance ) {
			if ( $instance instanceof $class_name ) {
				// @phan-suppress-next-line PhanTypeMismatchReturn -- Phan isn't inferring the type correctly from the `instanceof $class_name` like it's supposed to.
				return $instance;
			}
		}

		return null;
	}
}

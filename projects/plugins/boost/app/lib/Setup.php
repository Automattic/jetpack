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
		$action = $instance->setup_trigger();

		self::$instances[] = $instance;
		add_action( $action, array( $instance, 'setup' ) );
	}

	public function get_instances() {
		return self::$instances;
	}
}

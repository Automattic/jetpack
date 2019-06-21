<?php

/**
 * simple wrapper that allows enumerating cached static instances
 * of sync modules
 */

namespace Automattic\Jetpack\Sync;

class Modules {

	private static $default_sync_modules = array(
		'Automattic\\Jetpack\\Sync\\Modules\\Constants',
		'Automattic\\Jetpack\\Sync\\Modules\\Callables',
		'Automattic\\Jetpack\\Sync\\Modules\\Network_Options',
		'Automattic\\Jetpack\\Sync\\Modules\\Options',
		'Automattic\\Jetpack\\Sync\\Modules\\Terms',
		'Automattic\\Jetpack\\Sync\\Modules\\Menus',
		'Automattic\\Jetpack\\Sync\\Modules\\Themes',
		'Automattic\\Jetpack\\Sync\\Modules\\Users',
		'Automattic\\Jetpack\\Sync\\Modules\\Import',
		'Automattic\\Jetpack\\Sync\\Modules\\Posts',
		'Automattic\\Jetpack\\Sync\\Modules\\Protect',
		'Automattic\\Jetpack\\Sync\\Modules\\Comments',
		'Automattic\\Jetpack\\Sync\\Modules\\Updates',
		'Automattic\\Jetpack\\Sync\\Modules\\Attachments',
		'Automattic\\Jetpack\\Sync\\Modules\\Meta',
		'Automattic\\Jetpack\\Sync\\Modules\\Plugins',
		'Automattic\\Jetpack\\Sync\\Modules\\Stats',
		'Automattic\\Jetpack\\Sync\\Modules\\Full_Sync',
	);

	private static $initialized_modules = null;

	public static function get_modules() {
		if ( null === self::$initialized_modules ) {
			self::$initialized_modules = self::initialize_modules();
		}

		return self::$initialized_modules;
	}

	public static function set_defaults() {
		foreach ( self::get_modules() as $module ) {
			$module->set_defaults();
		}
	}

	public static function get_module( $module_name ) {
		foreach ( self::get_modules() as $module ) {
			if ( $module->name() === $module_name ) {
				return $module;
			}
		}

		return false;
	}

	static function initialize_modules() {
		/**
		 * Filters the list of class names of sync modules.
		 * If you add to this list, make sure any classes implement the
		 * Jetpack_Sync_Module interface.
		 *
		 * @since 4.2.0
		 */
		$modules = apply_filters( 'jetpack_sync_modules', self::$default_sync_modules );

		$modules = array_map( array( 'Automattic\\Jetpack\\Sync\\Modules', 'load_module' ), $modules );

		return array_map( array( 'Automattic\\Jetpack\\Sync\\Modules', 'set_module_defaults' ), $modules );
	}

	static function load_module( $module_name ) {
		return new $module_name();
	}

	static function set_module_defaults( $module ) {
		$module->set_defaults();
		if ( method_exists( $module, 'set_late_default' ) ) {
			add_action( 'init', array( $module, 'set_late_default' ), 90 );
		}
		return $module;
	}

}

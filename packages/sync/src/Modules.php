<?php

namespace Automattic\Jetpack\Sync;

/**
 * simple wrapper that allows enumerating cached static instances
 * of sync modules
 */

class Modules {

	private static $default_sync_modules = array(
		'Module_Constants',
		'Module_Callables',
		'Module_Options',
		'Module_Network_Options',
		'Module_Terms',
		'Module_Themes',
		'Module_Menus',
		'Module_Users',
		'Module_Posts',
		'Module_Import',
		'Module_Protect',
		'Module_Comments',
		'Module_Updates',
		'Module_Attachments',
		'Module_Meta',
		'Module_Plugins',
		'Module_Full_Sync',
		'Module_Stats',
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
		 * Module interface.
		 *
		 * @since 4.2.0
		 */
		$modules = apply_filters( 'jetpack_sync_modules', self::$default_sync_modules );

		$modules = array_map( array( 'Modules', 'load_module' ), $modules );

		return array_map( array( 'Modules', 'set_module_defaults' ), $modules );
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

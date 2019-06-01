<?php

namespace Automattic\Jetpack\Sync;

/**
 * simple wrapper that allows enumerating cached static instances
 * of sync modules
 */

class Modules {

	private static $default_sync_modules = array(
		__NAMESPACE__ . '\\Module_Constants',
		__NAMESPACE__ . '\\Module_Callables',
		__NAMESPACE__ . '\\Module_Options',
		__NAMESPACE__ . '\\Module_Network_Options',
		__NAMESPACE__ . '\\Module_Terms',
		__NAMESPACE__ . '\\Module_Themes',
		__NAMESPACE__ . '\\Module_Menus',
		__NAMESPACE__ . '\\Module_Users',
		__NAMESPACE__ . '\\Module_Posts',
		__NAMESPACE__ . '\\Module_Import',
		__NAMESPACE__ . '\\Module_Protect',
		__NAMESPACE__ . '\\Module_Comments',
		__NAMESPACE__ . '\\Module_Updates',
		__NAMESPACE__ . '\\Module_Attachments',
		__NAMESPACE__ . '\\Module_Meta',
		__NAMESPACE__ . '\\Module_Plugins',
		__NAMESPACE__ . '\\Module_Full_Sync',
		__NAMESPACE__ . '\\Module_Stats',
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

		$modules = array_map( array( __NAMESPACE__ . '\\Modules', 'load_module' ), $modules );

		return array_map( array( __NAMESPACE__ . '\\Modules', 'set_module_defaults' ), $modules );
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

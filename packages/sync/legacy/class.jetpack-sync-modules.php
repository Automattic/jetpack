<?php

/**
 * simple wrapper that allows enumerating cached static instances
 * of sync modules
 */

class Jetpack_Sync_Modules {

	private static $default_sync_modules = array(
		'Jetpack_Sync_Module_Constants',
		'Jetpack_Sync_Module_Callables',
		'Jetpack_Sync_Module_Options',
		'Jetpack_Sync_Module_Network_Options',
		'Jetpack_Sync_Module_Terms',
		'Jetpack_Sync_Module_Themes',
		'Jetpack_Sync_Module_Menus',
		'Jetpack_Sync_Module_Users',
		'Jetpack_Sync_Module_Posts',
		'Jetpack_Sync_Module_Import',
		'Jetpack_Sync_Module_Protect',
		'Jetpack_Sync_Module_Comments',
		'Jetpack_Sync_Module_Updates',
		'Jetpack_Sync_Module_Attachments',
		'Jetpack_Sync_Module_Meta',
		'Jetpack_Sync_Module_Plugins',
		'Jetpack_Sync_Module_Full_Sync',
		'Jetpack_Sync_Module_Stats',
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

		$modules = array_map( array( 'Jetpack_Sync_Modules', 'load_module' ), $modules );

		return array_map( array( 'Jetpack_Sync_Modules', 'set_module_defaults' ), $modules );
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

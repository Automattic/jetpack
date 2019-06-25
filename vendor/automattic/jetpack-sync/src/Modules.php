<?php

/**
 * simple wrapper that allows enumerating cached static instances
 * of sync modules
 */

namespace Automattic\Jetpack\Sync;

class Modules {

	const DEFAULT_SYNC_MODULES = array(
		'Jetpack_Sync_Modules_Constants',
		'Jetpack_Sync_Modules_Callables',
		'Jetpack_Sync_Modules_Network_Options',
		'Jetpack_Sync_Modules_Options',
		'Jetpack_Sync_Modules_Terms',
		'Jetpack_Sync_Modules_Menus',
		'Jetpack_Sync_Modules_Themes',
		'Jetpack_Sync_Modules_Users',
		'Jetpack_Sync_Modules_Import',
		'Jetpack_Sync_Modules_Posts',
		'Jetpack_Sync_Modules_Protect',
		'Jetpack_Sync_Modules_Comments',
		'Jetpack_Sync_Modules_Updates',
		'Jetpack_Sync_Modules_Attachments',
		'Jetpack_Sync_Modules_Meta',
		'Jetpack_Sync_Modules_Plugins',
		'Jetpack_Sync_Modules_Stats',
		'Jetpack_Sync_Modules_Full_Sync',
	);

	const LEGACY_SYNC_MODULES_MAP = array(
		'Jetpack_Sync_Modules_Constants'       => 'Automattic\\Jetpack\\Sync\\Modules\\Constants',
		'Jetpack_Sync_Modules_Callables'       => 'Automattic\\Jetpack\\Sync\\Modules\\Callables',
		'Jetpack_Sync_Modules_Network_Options' => 'Automattic\\Jetpack\\Sync\\Modules\\Network_Options',
		'Jetpack_Sync_Modules_Options'         => 'Automattic\\Jetpack\\Sync\\Modules\\Options',
		'Jetpack_Sync_Modules_Terms'           => 'Automattic\\Jetpack\\Sync\\Modules\\Terms',
		'Jetpack_Sync_Modules_Menus'           => 'Automattic\\Jetpack\\Sync\\Modules\\Menus',
		'Jetpack_Sync_Modules_Themes'          => 'Automattic\\Jetpack\\Sync\\Modules\\Themes',
		'Jetpack_Sync_Modules_Users'           => 'Automattic\\Jetpack\\Sync\\Modules\\Users',
		'Jetpack_Sync_Modules_Import'          => 'Automattic\\Jetpack\\Sync\\Modules\\Import',
		'Jetpack_Sync_Modules_Posts'           => 'Automattic\\Jetpack\\Sync\\Modules\\Posts',
		'Jetpack_Sync_Modules_Protect'         => 'Automattic\\Jetpack\\Sync\\Modules\\Protect',
		'Jetpack_Sync_Modules_Comments'        => 'Automattic\\Jetpack\\Sync\\Modules\\Comments',
		'Jetpack_Sync_Modules_Updates'         => 'Automattic\\Jetpack\\Sync\\Modules\\Updates',
		'Jetpack_Sync_Modules_Attachments'     => 'Automattic\\Jetpack\\Sync\\Modules\\Attachments',
		'Jetpack_Sync_Modules_Meta'            => 'Automattic\\Jetpack\\Sync\\Modules\\Meta',
		'Jetpack_Sync_Modules_Plugins'         => 'Automattic\\Jetpack\\Sync\\Modules\\Plugins',
		'Jetpack_Sync_Modules_Stats'           => 'Automattic\\Jetpack\\Sync\\Modules\\Stats',
		'Jetpack_Sync_Modules_Full_Sync'       => 'Automattic\\Jetpack\\Sync\\Modules\\Full_Sync',
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
		$modules = apply_filters( 'jetpack_sync_modules', self::DEFAULT_SYNC_MODULES );

		$modules = array_map( array( 'Automattic\\Jetpack\\Sync\\Modules', 'map_legacy_modules' ), $modules );

		$modules = array_map( array( 'Automattic\\Jetpack\\Sync\\Modules', 'load_module' ), $modules );

		return array_map( array( 'Automattic\\Jetpack\\Sync\\Modules', 'set_module_defaults' ), $modules );
	}

	static function load_module( $module_class ) {
		return new $module_class();
	}

	static function map_legacy_modules( $module_class ) {
		$legacy_map = self::LEGACY_SYNC_MODULES_MAP;
		if ( isset( $legacy_map[ $module_class ] ) ) {
			return $legacy_map[ $module_class ];
		}
		return $module_class;
	}

	static function set_module_defaults( $module ) {
		$module->set_defaults();
		if ( method_exists( $module, 'set_late_default' ) ) {
			add_action( 'init', array( $module, 'set_late_default' ), 90 );
		}
		return $module;
	}

}

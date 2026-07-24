<?php
/**
 * Simple wrapper that allows enumerating cached static instances
 * of sync modules.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

use Automattic\Jetpack\Sync\Modules\Module;

/**
 * A class to handle loading of sync modules.
 */
class Modules {

	/**
	 * Lists classnames of sync modules we load by default.
	 *
	 * @access public
	 *
	 * @var array
	 */
	const DEFAULT_SYNC_MODULES = array(
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
		'Automattic\\Jetpack\\Sync\\Modules\\Full_Sync_Immediately',
		'Automattic\\Jetpack\\Sync\\Modules\\Term_Relationships',
	);

	/**
	 * Keeps track of initialized sync modules.
	 *
	 * @access private
	 * @static
	 *
	 * @var null|array
	 */
	private static $initialized_modules = null;

	/**
	 * Gets a list of initialized modules.
	 *
	 * @access public
	 * @static
	 *
	 * @return Module[]
	 */
	public static function get_modules() {
		if ( null === self::$initialized_modules ) {
			self::$initialized_modules = self::initialize_modules();
		}

		return self::$initialized_modules;
	}

	/**
	 * Sets defaults for all initialized modules.
	 *
	 * @access public
	 * @static
	 */
	public static function set_defaults() {
		foreach ( self::get_modules() as $module ) {
			$module->set_defaults();
		}
	}

	/**
	 * Gets the name of an initialized module. Returns false if given module has not been initialized.
	 *
	 * @access public
	 * @static
	 *
	 * @param string $module_name A module name.
	 *
	 * @return bool|\Automattic\Jetpack\Sync\Modules\Module
	 */
	public static function get_module( $module_name ) {
		// @todo Better type hinting for Phan if https://github.com/phan/phan/issues/3842 gets fixed. Then clean up the `@phan-var` on all the callers.

		foreach ( self::get_modules() as $module ) {
			if ( $module->name() === $module_name ) {
				return $module;
			}
		}

		return false;
	}

	/**
	 * Loads and sets defaults for all declared modules.
	 *
	 * @access public
	 * @static
	 *
	 * @return array
	 */
	public static function initialize_modules() {

		/**
		 * Filters the list of class names of sync modules.
		 * If you add to this list, make sure any classes implement the
		 * Jetpack_Sync_Module interface.
		 *
		 * @since 1.6.3
		 * @since-jetpack 4.2.0
		 */
		$modules = apply_filters( 'jetpack_sync_modules', self::DEFAULT_SYNC_MODULES );

		// Exact class duplicates keep the position of their first contribution.
		$modules = array_unique( $modules );

		$modules = array_map( array( __CLASS__, 'load_module' ), $modules );
		$modules = self::deduplicate_modules_by_name( $modules );
		return array_map( array( __CLASS__, 'set_module_defaults' ), $modules );
	}

	/**
	 * Ensure only one implementation of each Sync module is initialized.
	 *
	 * Module names are the public identity used by full-sync configuration and
	 * module lookup. When multiple classes expose the same name, keep the class
	 * contributed last so compatibility filters can override an earlier default
	 * without both implementations registering listeners.
	 *
	 * All contributed classes are instantiated before deduplication, so this does
	 * not isolate constructor side effects from discarded implementations.
	 *
	 * @param \Automattic\Jetpack\Sync\Modules\Module[] $modules Module instances in filtered registration order.
	 * @return \Automattic\Jetpack\Sync\Modules\Module[] Module instances keyed uniquely by module name.
	 */
	private static function deduplicate_modules_by_name( array $modules ) {
		$modules_by_name = array();

		foreach ( $modules as $module ) {
			$module_name = $module->name();

			// Reinsert replacements so the surviving module retains its later order.
			unset( $modules_by_name[ $module_name ] );
			$modules_by_name[ $module_name ] = $module;
		}

		return array_values( $modules_by_name );
	}

	/**
	 * Returns an instance of the given module class.
	 *
	 * @access public
	 * @static
	 *
	 * @param string $module_class The classname of a Jetpack sync module.
	 *
	 * @return \Automattic\Jetpack\Sync\Modules\Module
	 */
	public static function load_module( $module_class ) {
		return new $module_class();
	}

	/**
	 * Sets defaults for the given instance of a Jetpack sync module.
	 *
	 * @access public
	 * @static
	 *
	 * @param \Automattic\Jetpack\Sync\Modules\Module $module Instance of a Jetpack sync module.
	 *
	 * @return \Automattic\Jetpack\Sync\Modules\Module
	 */
	public static function set_module_defaults( $module ) {
		$module->set_defaults();
		if ( method_exists( $module, 'set_late_default' ) ) {
			// @phan-suppress-next-line PhanUndeclaredMethodInCallable -- https://github.com/phan/phan/issues/1204
			add_action( 'init', array( $module, 'set_late_default' ), 90 );
		}
		return $module;
	}
}

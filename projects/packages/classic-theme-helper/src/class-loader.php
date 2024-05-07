<?php
/**
 * Package description here
 *
 * @package automattic/jetpack-classic-theme-helper
 */

namespace Automattic\Jetpack\Classic_Theme_Helper;

/**
 * Classic Theme Helper.
 */
class Loader {

	const PACKAGE_VERSION = '0.1.0-alpha';

	/**
	 * Modules to include.
	 *
	 * @var array
	 */
	public $modules = array(
		'class-featured-content.php',
	);

	/** Holds the singleton instance of the Loader
	 *
	 * @var Loader
	 */
	public static $instance = null;

	/**
	 * Initialize the Loader.
	 */
	public static function init() {
		if ( ! self::$instance ) {
			self::$instance = new Loader();
			add_action( 'plugins_loaded', array( self::$instance, 'load_modules' ) );
		}

		return self::$instance;
	}

	/**
	 * Load modules.
	 */
	public function load_modules() {

		// Filter the modules to include.
		// $since = 0.1.0
		// @param array $modules Array of modules to include.
		$modules = apply_filters( 'jetpack_classic_theme_helper_modules', $this->modules );
		foreach ( $modules as $module ) {
			require_once __DIR__ . $module;
		}
	}
}
Loader::init();

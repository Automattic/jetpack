<?php
/**
 * Package description here
 *
 * @package automattic/jetpack-classic-theme-helper
 */

namespace Automattic\Jetpack;

/**
 * Classic Theme Helper.
 */
class Classic_Theme_Helper {

	const PACKAGE_VERSION = '0.1.0';

	/**
	 * Modules to include.
	 *
	 * @var array
	 */
	public $modules = array(
		'class-featured-content.php',
	);

	/**
	 * Initialize Classic Theme Helper.
	 */
	public function init() {
		add_action( 'plugins_loaded', array( $this, 'load_modules' ) );
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

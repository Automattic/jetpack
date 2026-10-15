<?php
/**
 * Registers the script modules that Jetpack's wp-build dashboards share.
 *
 * @package automattic/jetpack-admin-ui
 */

namespace Automattic\Jetpack\Admin_UI;

/**
 * Libraries every dashboard used to bundle (DataViews, `@wordpress/ui`, Jetpack components, …)
 * are built once by `wp-build-shared` and loaded once per page.
 */
class Shared_Modules {

	/**
	 * Whether the modules were registered.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Hook the registration.
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;
		if ( did_action( 'admin_init' ) ) {
			self::register();
		} else {
			add_action( 'admin_init', array( __CLASS__, 'register' ), 1 );
		}
	}

	/**
	 * Register each shared module; the import map only lists the ones a page ends up importing.
	 */
	public static function register() {
		$dir = dirname( __DIR__ ) . '/build/shared-modules/';
		if ( ! file_exists( $dir . 'modules.php' ) || ! function_exists( 'wp_register_script_module' ) ) {
			return;
		}
		$build = require $dir . 'modules.php';
		$asset = require $dir . 'shared.min.asset.php';
		$url   = plugins_url( 'build/shared-modules/', __DIR__ );
		foreach ( $build['modules'] as $id => $file ) {
			wp_register_script_module( $id, $url . $file, $asset['module_dependencies'] ?? array(), $build['version'] );
		}
	}
}

<?php
/**
 * Registers the script modules that Jetpack's wp-build dashboards share.
 *
 * @package automattic/jetpack-admin-ui
 */

namespace Automattic\Jetpack\Admin_UI;

/**
 * Registers `build/shared-modules/` so dashboards built with `sharedModules` can import them.
 */
class Shared_Modules {

	/**
	 * Whether init() ran.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Hook the registration.
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		// Before the wp-build pages and the shell build the import map on admin_enqueue_scripts.
		if ( did_action( 'admin_init' ) ) {
			self::register();
		} else {
			add_action( 'admin_init', array( __CLASS__, 'register' ), 1 );
		}
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_script_dependencies' ), 100 );
	}

	/**
	 * Read `modules.php`, the manifest `wp-build-shared` writes.
	 *
	 * @return array|null
	 */
	private static function manifest() {
		static $manifest = false;
		if ( false === $manifest ) {
			$file     = dirname( __DIR__ ) . '/build/shared-modules/modules.php';
			$manifest = is_readable( $file ) ? require $file : null;
		}
		return is_array( $manifest ) ? $manifest : null;
	}

	/**
	 * Register each shared module. The import map only lists those a page's modules depend on.
	 *
	 * @return void
	 */
	public static function register() {
		$manifest = self::manifest();
		if ( ! $manifest || ! function_exists( 'wp_register_script_module' ) ) {
			return;
		}
		$url = plugins_url( 'build/shared-modules/', __DIR__ );
		foreach ( $manifest['modules'] as $id => $file ) {
			wp_register_script_module( $id, $url . $file, $manifest['module_dependencies'] ?? array(), $manifest['version'] );
		}
	}

	/**
	 * Load the classic scripts the shared modules read globals from, on wp-build pages.
	 *
	 * @return void
	 */
	public static function enqueue_script_dependencies() {
		$manifest = self::manifest();
		if ( ! $manifest || empty( $manifest['dependencies'] ) ) {
			return;
		}
		// wp-build enqueues one `<page>-wp-admin` module per page; the shell's guests ride on the host's.
		foreach ( wp_script_modules()->get_queue() as $id ) {
			if ( str_ends_with( $id, '-wp-admin' ) ) {
				foreach ( $manifest['dependencies'] as $handle ) {
					wp_enqueue_script( $handle );
				}
				return;
			}
		}
	}
}

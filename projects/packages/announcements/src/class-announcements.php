<?php
/**
 * Jetpack Announcements: a channel to tell users what is new.
 *
 * @package automattic/jetpack-announcements
 */

namespace Automattic\Jetpack\Announcements;

/**
 * The package itself. `actions.php` hooks what it serves.
 */
class Announcements {

	const PACKAGE_VERSION = '0.1.0-alpha';

	/**
	 * Id of the script module a host imports: the name of the js-package that holds its contract.
	 */
	const SCRIPT_MODULE_ID = '@automattic/jetpack-announcements';

	/**
	 * Registers the What's new module under the name hosts import, with its translations. Hooked on `admin_init`.
	 *
	 * Always the minified bundle: a production build replaces the other one with a stub.
	 * Its classic script dependencies are not enqueued, as wp-build leaves them to the page.
	 *
	 * @param string $asset_file Optional. Asset file of the built module. Defaults to the package's own.
	 * @return void
	 */
	public static function register_script_module( $asset_file = '' ) {
		if ( '' === $asset_file ) {
			$asset_file = dirname( __DIR__ ) . '/build/modules/whats-new/index.min.asset.php';
		}

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = require $asset_file;

		wp_register_script_module(
			self::SCRIPT_MODULE_ID,
			plugins_url( 'index.min.js', $asset_file ),
			$asset['module_dependencies'] ?? array(),
			$asset['version'] ?? false
		);

		// WordPress 7.0 prints the translations of a module. On an older core the surface stays in English.
		if ( function_exists( 'wp_set_script_module_translations' ) ) {
			wp_set_script_module_translations( self::SCRIPT_MODULE_ID, 'jetpack-announcements' );
		}
	}
}

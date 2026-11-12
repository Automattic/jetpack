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
	 * Registers the What's new module under the name hosts import. Hooked on `admin_init`.
	 *
	 * Always the minified bundle: a production build replaces the other one with a stub.
	 * Its classic script dependencies are not enqueued, as wp-build leaves them to the page.
	 *
	 * @return void
	 */
	public static function register_script_module() {
		$asset_file = dirname( __DIR__ ) . '/build/modules/whats-new/index.min.asset.php';
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
	}
}

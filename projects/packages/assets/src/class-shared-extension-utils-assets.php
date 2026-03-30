<?php
/**
 * Jetpack shared extension utils assets.
 *
 * @package automattic/jetpack-assets
 */

namespace Automattic\Jetpack\Assets;

use Automattic\Jetpack\Assets;

/**
 * Registers the shared-extension-utils externalized bundle so that
 * consuming packages can declare it as a WordPress script dependency.
 */
class Shared_Extension_Utils_Assets {

	const SCRIPT_HANDLE = 'jetpack-shared-extension-utils';

	/**
	 * Configure.
	 */
	public static function configure() {
		add_action( 'wp_loaded', array( self::class, 'register_assets' ) );
	}

	/**
	 * Register assets.
	 */
	public static function register_assets() {
		Assets::register_script(
			self::SCRIPT_HANDLE,
			'../build/jetpack-shared-extension-utils.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-assets',
			)
		);
	}
}

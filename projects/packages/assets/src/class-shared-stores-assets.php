<?php
/**
 * Jetpack shared stores assets.
 *
 * @package automattic/jetpack-assets
 */

namespace Automattic\Jetpack\Assets;

use Automattic\Jetpack\Assets;

/**
 * Registers the externalized jetpack-shared-stores bundle so that consuming
 * packages can declare it as a WordPress script dependency. Loading the bundle
 * once ensures the contained data stores register exactly once per page.
 */
class Shared_Stores_Assets {

	const SCRIPT_HANDLE = 'jetpack-shared-stores';

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
			'../build/jetpack-shared-stores.js',
			__FILE__,
			array(
				'in_footer' => true,
			)
		);
	}
}

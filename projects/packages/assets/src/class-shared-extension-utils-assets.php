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
		add_action( 'wp_enqueue_scripts', array( self::class, 'enqueue_styles' ), 20, 0 );
		add_action( 'admin_enqueue_scripts', array( self::class, 'enqueue_styles' ), 20, 0 );
		add_action( 'enqueue_block_editor_assets', array( self::class, 'enqueue_styles' ), 20, 0 );
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

	/**
	 * Enqueue styles when the shared bundle is already enqueued as a dependency.
	 */
	public static function enqueue_styles() {
		// Assets::register_script() registers the extracted stylesheet with the same handle.
		if ( wp_script_is( self::SCRIPT_HANDLE, 'enqueued' ) && wp_style_is( self::SCRIPT_HANDLE, 'registered' ) ) {
			wp_enqueue_style( self::SCRIPT_HANDLE );
		}
	}
}

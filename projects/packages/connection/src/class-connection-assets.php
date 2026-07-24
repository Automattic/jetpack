<?php
/**
 * Connection_Assets.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;

/**
 * Connection_Assets class.
 */
class Connection_Assets {

	/**
	 * Initialize the class.
	 */
	public static function configure() {
		add_action( 'wp_loaded', array( __CLASS__, 'register_assets' ) );

		add_filter( 'jetpack_admin_js_script_data', array( Initial_State::class, 'set_connection_script_data' ), 10, 1 );
	}

	/**
	 * Register assets.
	 *
	 * NOTICE: Please think twice before including Connection scripts in the frontend.
	 * Those scripts are intended to be used in WP admin area.
	 */
	public static function register_assets() {
		// jetpack-connection.js externalizes @wordpress/theme and @wordpress/private-apis
		// to wp-theme / wp-private-apis. Older WP core (and Gutenberg without a
		// compatible private-apis allowlist) don't provide usable versions of those,
		// which silently drops the whole script from being enqueued. Register the
		// polyfills before the script below declares them as dependencies.
		if ( class_exists( WP_Build_Polyfills::class ) ) {
			WP_Build_Polyfills::register( 'jetpack-connection', array( 'wp-private-apis', 'wp-theme' ) );
		}

		Assets::register_script(
			'jetpack-connection',
			'../dist/jetpack-connection.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-connection',
			)
		);
	}
}

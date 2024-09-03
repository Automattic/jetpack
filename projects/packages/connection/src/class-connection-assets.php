<?php
/**
 * Connection_Assets.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Assets;

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
	 */
	public static function register_assets() {

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

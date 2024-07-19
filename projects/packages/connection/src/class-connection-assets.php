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
	}

	/**
	 * Register assets.
	 */
	public static function register_assets() {
		if ( ! wp_script_is( 'jetpack-connection', 'registered' ) ) {

			Assets::register_script(
				'jetpack-connection',
				'../dist/jetpack-connection.js',
				__FILE__,
				array(
					'in_footer'  => true,
					'textdomain' => 'jetpack-connection',
				)
			);

			Initial_State::render_script( 'jetpack-connection' );
		}
	}
}

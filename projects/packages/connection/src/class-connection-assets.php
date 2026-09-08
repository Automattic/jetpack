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
		// Priority 20: set_connection_script_data() replaces the whole `connection` key at 10.
		add_filter( 'jetpack_admin_js_script_data', array( __CLASS__, 'add_script_data' ), 20 );
	}

	/**
	 * Add the package's image base URL to the admin script data.
	 *
	 * The disconnect dialog's illustrations are served from the package rather than bundled,
	 * because wp-build's esbuild pipeline has no image loader.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $data Script data.
	 * @return array
	 */
	public static function add_script_data( $data ) {
		$data['connection']['assets_url'] = trailingslashit( plugins_url( 'assets/images/', __DIR__ ) );

		return $data;
	}

	/**
	 * Register assets.
	 *
	 * NOTICE: Please think twice before including Connection scripts in the frontend.
	 * Those scripts are intended to be used in WP admin area.
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

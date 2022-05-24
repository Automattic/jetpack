<?php
/**
 * Main Publicize class.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Publicize;

/**
 * The class to configure and initialize the publicize package.
 */
class Publicize_Setup {
	/**
	 * To configure the publicize package, when called via the Config package.
	 */
	public static function configure() {
		add_action( 'plugins_loaded', array( __CLASS__, 'on_plugins_loaded' ) );
	}

	/**
	 * To configure the publicize package, when called via the Config package.
	 */
	public static function on_plugins_loaded() {
		global $publicize_ui;
		if ( ! isset( $publicize_ui ) ) {
			$publicize_ui = new Publicize_UI();

		}
		// Adding on a higher priority to make sure we're the first field registered.
		// The priority parameter can be removed once we deprecate WPCOM_REST_API_V2_Post_Publicize_Connections_Field
		add_action( 'rest_api_init', array( new Connections_Post_Field(), 'register_fields' ), 5 );

		add_action( 'rest_api_init', array( new REST_Controller(), 'register_rest_routes' ) );
	}
}



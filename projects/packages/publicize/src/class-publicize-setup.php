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
	}
}

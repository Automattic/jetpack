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
class Publicize_Main {
	/**
	 * Contains an instance of class 'Publicize' which loads Keyring, sets up services, etc.
	 *
	 * @var Publicize Instance of Publicize
	 */
	public $publicize;

	/**
	 * Hooks into WordPress to display the various pieces of UI and load our assets
	 */
	public static function configure() {
		add_action( 'plugins_loaded', array( __CLASS__, 'on_plugins_loaded' ) );
	}

	/**
	 * Hooks into WordPress to display the various pieces of UI and load our assets
	 */
	public static function on_plugins_loaded() {
		global $publicize;
		$publicize = new Publicize();

		global $publicize_ui;
		$publicize_ui = new Publicize_UI();
	}
}

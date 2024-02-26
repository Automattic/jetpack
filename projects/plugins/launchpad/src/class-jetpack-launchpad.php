<?php
/**
 * Primary class file for the Jetpack Launchpad plugin.
 *
 * @package automattic/jetpack-launchpad-plugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\My_Jetpack\Initializer as My_Jetpack_Initializer;
use Automattic\Jetpack\Sync\Data_Settings;

/**
 * Class Jetpack_Launchpad
 */
class Jetpack_Launchpad {

	/**
	 * Constructor.
	 */
	public function __construct() {
		// Set up the REST authentication hooks.
		Connection_Rest_Authentication::init();

		// Init Jetpack packages
		add_action(
			'plugins_loaded',
			function () {
				$config = new Automattic\Jetpack\Config();
				// Connection package.
				$config->ensure(
					'connection',
					array(
						'slug'     => JETPACK_LAUNCHPAD_SLUG,
						'name'     => JETPACK_LAUNCHPAD_NAME,
						'url_info' => JETPACK_LAUNCHPAD_URI,
					)
				);
				// Sync package.
				$config->ensure( 'sync', Data_Settings::MUST_SYNC_DATA_SETTINGS );

				// Identity crisis package.
				$config->ensure( 'identity_crisis' );
			},
			1
		);

		My_Jetpack_Initializer::init();
	}

	/**
	 * Removes plugin from the connection manager
	 * If it's the last plugin using the connection, the site will be disconnected.
	 *
	 * @access public
	 * @static
	 */
	public static function plugin_deactivation() {
		$manager = new Connection_Manager( 'jetpack-launchpad' );
		$manager->remove_connection();
	}
}

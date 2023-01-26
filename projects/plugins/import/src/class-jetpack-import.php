<?php
/**
 * Primary class file for the Jetpack Import plugin.
 *
 * @package automattic/jetpack-import-plugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\My_Jetpack\Initializer as My_Jetpack_Initializer;
use Automattic\Jetpack\Sync\Data_Settings;
use Automattic\Jetpack_Import\REST_API\REST_API;

/**
 * Class Jetpack_Import
 */
class Jetpack_Import {
	/**
	 * The REST API
	 *
	 * @var REST_API
	 */
	private $rest_api;

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
						'slug'     => JETPACK_IMPORT_SLUG,
						'name'     => JETPACK_IMPORT_NAME,
						'url_info' => JETPACK_IMPORT_URI,
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
		$this->init_rest_api();
	}

	/**
	 * Register import related REST routes.
	 */
	public function init_rest_api() {
		$routes = array(
			'categories' => Automattic\Jetpack_Import\REST_API\Endpoints\Category::class,
			'comments'   => Automattic\Jetpack_Import\REST_API\Endpoints\Comment::class,
			'posts'      => Automattic\Jetpack_Import\REST_API\Endpoints\Post::class,
			'tags'       => Automattic\Jetpack_Import\REST_API\Endpoints\Tag::class,
		);

		$this->rest_api = REST_API::register( $routes );
	}

	/**
	 * Removes plugin from the connection manager
	 * If it's the last plugin using the connection, the site will be disconnected.
	 *
	 * @access public
	 * @static
	 */
	public static function plugin_deactivation() {
		$manager = new Connection_Manager( 'jetpack-import' );
		$manager->remove_connection();
	}
}

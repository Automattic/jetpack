<?php
/**
 * Set of REST API routes used in WPCOM Unified Importer.
 *
 * @package automattic/jetpack-import
 */

namespace Automattic\Jetpack\Import;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Rest_Authentication;
use Automattic\Jetpack\Import\Abilities\Import_Abilities;

/**
 * This class will provide endpoint for the Unified Importer.
 */
class Main {

	/**
	 * Package version.
	 *
	 * @var string
	 */
	const PACKAGE_VERSION = '0.9.16';

	/**
	 * A list of all the routes.
	 *
	 * @var \WP_REST_Controller[]
	 */
	private static $routes = array();

	/**
	 * Before everything else starts getting initalized, we need to initialize Jetpack using the
	 * Config object.
	 *
	 * @return void
	 */
	public static function configure() {
		if ( did_action( 'jetpack_import_initialized' ) ) {
			return;
		}

		$connection = new Connection_Manager();

		// Initialize the REST API only if the user is connected.
		if ( $connection->has_connected_owner() ) {
			add_action( 'rest_api_init', array( __CLASS__, 'initialize_rest_api' ) );
		}

		// Register WP Abilities API surface. Gated behind the
		// `jetpack_wp_abilities_enabled` filter inside Registrar::init(),
		// which defaults to false — so this call is safe to make unconditionally
		// and still opt-in per-site until the flag is flipped. Wired here
		// rather than inside the connected-owner branch above because the
		// underlying REST endpoints already gate on the `import` capability;
		// the abilities reuse that exact gate, so registering them without a
		// site-level connection check matches the REST route's behavior.
		Import_Abilities::init();

		/**
		 * Runs right after the Jetpack Import package is initialized.
		 *
		 * @since 0.1.0
		*/
		do_action( 'jetpack_import_initialized' );
	}

	/**
	 * Register import related REST routes.
	 *
	 * @return void
	 */
	public static function initialize_rest_api() {
		// Set up the REST authentication hooks.
		Rest_Authentication::init();

		$routes = array(
			'blocks'         => new Endpoints\Block(),
			'categories'     => new Endpoints\Category(),
			'comments'       => new Endpoints\Comment(),
			'custom-css'     => new Endpoints\Custom_CSS(),
			'end'            => new Endpoints\End(),
			'global-styles'  => new Endpoints\Global_Style(),
			'media'          => new Endpoints\Attachment(),
			'menu-items'     => new Endpoints\Menu_Item(),
			'menus'          => new Endpoints\Menu(),
			'navigation'     => new Endpoints\Navigation(),
			'pages'          => new Endpoints\Page(),
			'posts'          => new Endpoints\Post(),
			'start'          => new Endpoints\Start(),
			'tags'           => new Endpoints\Tag(),
			'template-parts' => new Endpoints\Template_Part(),
			'templates'      => new Endpoints\Template(),
		);

		/**
		 * Allow other plugins to modify import routes.
		 *
		 * @since 0.1.0
		 *
		 * @param array $routes Array of import routes.
		 */
		self::$routes = apply_filters( 'jetpack_import_types', $routes );

		// Register all the routes.
		foreach ( self::$routes as $route ) {
			$route->register_routes();
		}
	}
}

<?php
/**
 * Set of REST API routes used in WPCOM Unified Importer.
 *
 * @package automattic/jetpack-import
 */

namespace Automattic\Jetpack\Import;

use Automattic\Jetpack\Config;
use Automattic\Jetpack\Connection\Rest_Authentication;
use Automattic\Jetpack\Sync\Data_Settings;

/**
 * This class will provide endpoint for the Unified Importer.
 */
class Main {

	/**
	 * Slug.
	 *
	 * @var string
	 */
	const PACKAGE_SLUG = 'jetpack-import';

	/**
	 * Package name.
	 *
	 * @var string
	 */
	const PACKAGE_NAME = 'Jetpack Import';

	/**
	 * Package URL.
	 *
	 * @var string
	 */
	const PACKAGE_URI = 'https://jetpack.com/jetpack-import';

	/**
	 * Package version.
	 *
	 * @var string
	 */
	const PACKAGE_VERSION = '0.1.1-alpha';

	/**
	 * Meta name for storing the WXR import ID.
	 *
	 * @var string
	 */
	const IMPORT_ID_META_NAME = 'unified_importer_id';

	/**
	 * A list of all the routes.
	 *
	 * @var \WP_REST_Controller[]
	 */
	private $routes = array();

	/**
	 * Class constructor.
	 *
	 * @return void
	 */
	private function __construct() {
	}

	/**
	 * Before everything else starts getting initalized, we need to initialize Jetpack using the
	 * Config object.
	 *
	 * @return void
	 */
	public static function configure() {
		$import = new self();
		$config = new Config();

		$config->ensure(
			'connection',
			array(
				'slug'     => self::PACKAGE_SLUG,
				'name'     => self::PACKAGE_NAME,
				'url_info' => self::PACKAGE_URI,
			)
		);

		$config->ensure( 'sync', Data_Settings::MUST_SYNC_DATA_SETTINGS );

		add_action( 'rest_api_init', array( $import, 'initialize_rest_api' ) );
	}

	/**
	 * Register import related REST routes.
	 *
	 * @return void
	 */
	public function initialize_rest_api() {
		// Set up the REST authentication hooks.
		Rest_Authentication::init();

		$routes = array(
			'categories' => new Endpoints\Category(),
			'comments'   => new Endpoints\Comment(),
			'posts'      => new Endpoints\Post(),
			'tags'       => new Endpoints\Tag(),
		);

		// Allow other plugins to modify import routes.
		$this->routes = apply_filters( 'jetpack_import_types', $routes );

		// Register all the routes.
		foreach ( $this->routes as $route ) {
			$route->register_routes();
		}
	}
}

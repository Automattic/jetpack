<?php
/**
 * Importer REST API
 *
 * @package automattic/jetpack-import
 */

namespace Automattic\Jetpack_Import\REST_API;

/**
 * Class REST_API
 */
class REST_API {
	/**
	 * A list of all the routes
	 *
	 * @var Route[]
	 */
	private $routes = array();

	/**
	 * Constructor
	 *
	 * @param Endpoint[] $routes A list of the routes to register.
	 */
	public function __construct( $routes ) {
		// The jetpack_import_types can be used to filter the enabled routes
		$routes = apply_filters( 'jetpack_import_types', $routes );

		foreach ( $routes as $name => $route_class ) {
			if ( class_exists( $route_class ) ) {
				$this->routes[ $name ] = new $route_class();
			}
		}
	}

	/**
	 * Register all the REST routes
	 */
	public function register_rest_routes() {
		foreach ( $this->routes as $name => $route ) {
			register_rest_route(
				JETPACK_IMPORT_REST_NAMESPACE,
				JETPACK_IMPORT_REST_PREFIX . '/' . $name,
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $route, 'create_item' ),
					'permission_callback' => array( $route, 'create_item_permissions_check' ),
					'allow_batch'         => true,
					'args'                => array( $route, 'get_endpoint_args_for_item_schema' ),
					'schema'              => array( $route, 'get_public_item_schema' ),
				)
			);
		}
	}

	/**
	 * Queue the routes
	 *
	 * @param string[] $routes A list of the routes.
	 *
	 * @return REST_API The REST API
	 */
	public static function register( $routes ) {
		$rest_api = new REST_API( (array) $routes );
		add_action( 'rest_api_init', array( $rest_api, 'register_rest_routes' ) );

		return $rest_api;
	}
}

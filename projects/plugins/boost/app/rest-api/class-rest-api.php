<?php

namespace Automattic\Jetpack_Boost\REST_API;

use Automattic\Jetpack_Boost\REST_API\Contracts\Endpoint;

class REST_API {

	/**
	 * @var Route[]
	 */
	protected $routes = array();

	/**
	 * @param Endpoint[] $routes
	 */
	public function __construct( $routes ) {
		foreach ( $routes as $route_class ) {
			$this->routes[] = new Route( $route_class );
		}
	}

	public function register_rest_routes() {
		foreach ( $this->routes as $route ) {
			$route->register_rest_route();
		}
	}

	/**
	 * @param Endpoint|Endpoint[]|string $endpoints
	 *
	 * @return void
	 */
	public static function register( $endpoints ) {
		// If endpoints are passed as a string,
		// (array) will convert it to an array.
		$rest_api = new REST_API( (array) $endpoints );
		add_action( 'rest_api_init', array( $rest_api, 'register_rest_routes' ) );
	}
}

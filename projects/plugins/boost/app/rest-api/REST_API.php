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

}

<?php

namespace Automattic\Jetpack_Boost\REST_API;

use Automattic\Jetpack_Boost\REST_API\Endpoints\Generator_Error;
use Automattic\Jetpack_Boost\REST_API\Endpoints\Generator_Request;
use Automattic\Jetpack_Boost\REST_API\Endpoints\Generator_Status;
use Automattic\Jetpack_Boost\REST_API\Endpoints\Generator_Success;
use Automattic\Jetpack_Boost\REST_API\Endpoints\Recommendations_Dismiss;
use Automattic\Jetpack_Boost\REST_API\Endpoints\Recommendations_Reset;
use Automattic\Jetpack_Boost\REST_API\Permissions\Nonce;

class REST_API {

	protected $available_routes = array(
		Generator_Status::class,
		Generator_Request::class,
		Generator_Success::class,
		Recommendations_Dismiss::class,
		Recommendations_Reset::class,
		Generator_Error::class,
	);

	protected $routes = array();

	public function __construct() {
		foreach ( $this->available_routes as $route_class ) {
			$this->routes[] = new Route( $route_class );
		}
	}

	public function register_rest_routes() {
		foreach ( $this->routes as $route ) {
			$route->register_rest_route();
		}
	}

	public function get_nonces() {
		return Nonce::get_generated_nonces();
	}

}

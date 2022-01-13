<?php

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API;

use Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API\Permissions\Nonce;

class Boost_API {

	protected $available_routes = array(
		Generator_Status::class,
		Generator_Request::class,
		Generator_Success::class,
		Generator_Error::class,
		Recommendations_Dismiss::class,
		Recommendations_Reset::class,
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

<?php

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API;

use Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API\Endpoints\Generator_Error;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API\Endpoints\Generator_Request;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API\Endpoints\Generator_Status;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API\Endpoints\Generator_Success;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API\Endpoints\Recommendations_Dismiss;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API\Endpoints\Recommendations_Reset;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API\Permissions\Nonce;

class Boost_API {

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
			$route          = new Route( $route_class );
			$this->routes[] = $route;
		}
	}


	/**
	 * @TODO: Something seems off here.
	 * I don't know why, but Boost expects modules to have routes always turned on.
	 * Enable REST Routes when the Critical CSS module is enabled.
	 *
	 * @return void
	 */
	public function enable_rest_routes() {
		foreach ( $this->routes as $route ) {
			$route->enable();
		}
	}

	public function get_nonces() {
		return Nonce::get_generated_nonces();
	}

}

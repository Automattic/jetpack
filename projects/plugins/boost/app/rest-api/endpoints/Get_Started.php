<?php

namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack_Boost\Admin\Config;
use Automattic\Jetpack_Boost\REST_API\Contracts\Endpoint;
use Automattic\Jetpack_Boost\REST_API\Permissions\Current_User_Admin;

class Get_Started implements Endpoint {
	public function request_methods() {
		return \WP_REST_Server::EDITABLE;
	}

	/**
	 * Handler for POST '/get-started'.
	 *
	 * @param \WP_REST_Request $_request The request object.
	 *
	 * @return \WP_REST_Response|\WP_Error The response.
	 * @todo Figure out what to do in the JavaScript when responding with the error status.
	 */
	public function response( $_request ) {
		return rest_ensure_response(
			Config::set_getting_started( false )
		);
	}

	public function permissions() {
		return array(
			new Current_User_Admin(),
		);
	}

	public function name() {
		return '/get-started';
	}
}

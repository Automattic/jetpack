<?php

namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack_Boost\Lib\Critical_CSS\Regenerate;
use Automattic\Jetpack_Boost\REST_API\Contracts\Endpoint;
use Automattic\Jetpack_Boost\REST_API\Permissions\Current_User_Admin;

class Critical_CSS_Start implements Endpoint {

	public function request_methods() {
		return \WP_REST_Server::EDITABLE;
	}

	public function response( $_request ) {
		$regenerate = new Regenerate();
		$data       = $regenerate->start();
		$state      = $regenerate->get_state();

		return rest_ensure_response(
			array(
				'status' => $state->has_errors() ? 'error' : 'success',
				'data'   => $data,
			)
		);
	}

	public function permissions() {
		return array(
			new Current_User_Admin(),
		);
	}

	public function name() {
		return 'critical-css/start';
	}
}

<?php

namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack_Boost\Admin\Config;
use Automattic\Jetpack_Boost\REST_API\Contracts\Endpoint;
use Automattic\Jetpack_Boost\REST_API\Permissions\Current_User_Admin;

class Config_State implements Endpoint {

	public function request_methods() {
		return \WP_REST_Server::READABLE;
	}

	// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	public function response( $request ) {
		$config = new Config();
		return rest_ensure_response( $config->constants() );
	}

	public function permissions() {
		return array(
			new Current_User_Admin(),
		);
	}

	public function name() {
		return '/configuration';
	}
}
